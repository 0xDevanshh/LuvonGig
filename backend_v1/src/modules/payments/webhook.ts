/**
 * Stripe webhook endpoint.
 *
 * Three things make this safe, and all three are load-bearing:
 *
 *   1. RAW BODY. Signature verification hashes the exact bytes Stripe sent.
 *      This router must be mounted BEFORE express.json(), or the body is a
 *      parsed object by the time it arrives and every signature fails.
 *   2. SIGNATURE VERIFICATION. An unverified webhook is an unauthenticated
 *      stranger instructing us to move money. No signature, no processing —
 *      and the failure is a 400, never a "well, probably fine".
 *   3. REPLAY PROTECTION. Providers deliver at-least-once and resend after a
 *      timeout. Every event is recorded against a unique
 *      (provider, provider_event_id); a redelivery is recognised and dropped.
 *
 * The endpoint is deliberately unauthenticated in the session sense: Stripe
 * has no cookie. The signature IS the authentication.
 *
 * It also answers 200 for anything it has verified but cannot process. A non-2xx
 * makes Stripe retry, and retrying will not fix a payload we do not handle —
 * it just builds a backlog.
 */
import { Router, raw } from 'express';
import { withTransaction } from '../../db/pool.js';
import { generateId } from '../../lib/ids.js';
import { logger } from '../../lib/logger.js';
import * as repo from './repo.js';
import * as bookingRepo from '../bookings/repo.js';
import { getStripeProvider } from './stripe.js';
import { activateAfterPayment } from './purposes.js';

export const webhookRouter = Router();

interface PaymentIntentLike {
  id?: string;
  last_payment_error?: { message?: string };
}

interface AccountLike {
  id?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  requirements?: Record<string, unknown>;
  country?: string;
  default_currency?: string;
}

async function onPaymentSucceeded(payload: PaymentIntentLike): Promise<void> {
  if (!payload.id) return;
  const payment = await repo.getPaymentByProviderId('stripe', payload.id);
  if (!payment) {
    logger.warn({ providerPaymentId: payload.id }, 'Webhook for an unknown payment');
    return;
  }

  // Only advances from a pre-payment state, so a redelivered success cannot
  // move an already-released payment backwards.
  const moved = await repo.transitionState(null, payment.id, 'held',
    ['requires_payment', 'processing']);
  if (!moved) {
    logger.info({ paymentId: payment.id, state: payment.state },
      'payment_intent.succeeded ignored — payment already past that state');
    return;
  }

  // A booking activates; an expert session confirms; a subscription starts.
  // Reading `purpose` rather than guessing from which id is set keeps the
  // three flows from silently sharing behaviour.
  if (payment.purpose === 'booking' && payment.booking_id) {
    await withTransaction(async (client) => {
      await bookingRepo.setPaymentStatus(client, payment.booking_id!, 'held_in_escrow');
      const booking = await bookingRepo.getBooking(payment.booking_id!);
      if (booking?.status === 'pending') {
        await bookingRepo.setStatus(client, payment.booking_id!, 'active');
      }
      await bookingRepo.addTimelineEvent(client, payment.booking_id!, 'payment_completed',
        null, 'Payment received and held', { paymentId: payment.id });
    });
  } else {
    await activateAfterPayment(payment);
  }
}

async function onPaymentFailed(payload: PaymentIntentLike): Promise<void> {
  if (!payload.id) return;
  const payment = await repo.getPaymentByProviderId('stripe', payload.id);
  if (!payment) return;

  await repo.transitionState(null, payment.id, 'failed', ['requires_payment', 'processing'], {
    failureReason: payload.last_payment_error?.message ?? 'Payment failed',
  });
}

async function onAccountUpdated(payload: AccountLike): Promise<void> {
  if (!payload.id) return;
  const account = await repo.getPayoutAccountByProviderId(payload.id);
  if (!account) {
    logger.warn({ providerAccountId: payload.id }, 'account.updated for an unknown account');
    return;
  }

  await repo.updateAccountStatus(payload.id, {
    chargesEnabled: payload.charges_enabled ?? false,
    payoutsEnabled: payload.payouts_enabled ?? false,
    detailsSubmitted: payload.details_submitted ?? false,
    requirements: payload.requirements ?? {},
    country: payload.country ?? null,
    currency: payload.default_currency?.toUpperCase() ?? null,
  });
}

const HANDLERS: Record<string, (payload: Record<string, unknown>) => Promise<void>> = {
  'payment_intent.succeeded': (p) => onPaymentSucceeded(p as PaymentIntentLike),
  'payment_intent.payment_failed': (p) => onPaymentFailed(p as PaymentIntentLike),
  'payment_intent.canceled': async (p) => {
    const payload = p as PaymentIntentLike;
    if (!payload.id) return;
    const payment = await repo.getPaymentByProviderId('stripe', payload.id);
    if (payment) {
      await repo.transitionState(null, payment.id, 'cancelled', ['requires_payment', 'processing']);
    }
  },
  'account.updated': (p) => onAccountUpdated(p as AccountLike),
};

webhookRouter.post('/', raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const provider = getStripeProvider();
  if (!provider) {
    // Nothing is configured to verify against; refusing beats guessing.
    return res.status(503).json({ success: false, error: 'Payments are not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing signature header.' });
  }

  let event;
  try {
    // Throws on a bad signature, a tampered body, or a timestamp outside
    // Stripe's tolerance window.
    event = provider.verifyWebhook(req.body as Buffer, signature);
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Rejected a webhook with an invalid signature');
    return res.status(400).json({ success: false, error: 'Invalid signature.' });
  }

  const eventRowId = generateId('pev');
  const isNew = await repo.recordEvent(eventRowId, 'stripe', event.id, event.type, event.payload);
  if (!isNew) {
    // Already handled. Acknowledge so Stripe stops resending.
    logger.info({ eventId: event.id, type: event.type }, 'Duplicate webhook ignored');
    return res.json({ received: true, duplicate: true });
  }

  const handler = HANDLERS[event.type];
  if (!handler) {
    await repo.markEventProcessed(eventRowId);
    return res.json({ received: true, handled: false });
  }

  try {
    await handler(event.payload);
    await repo.markEventProcessed(eventRowId);
  } catch (err) {
    // The event is stored, so this is recoverable by replaying from the table.
    // Still answer 200: a retry will hit the duplicate check and change
    // nothing, so it would only produce noise.
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, eventId: event.id, type: event.type }, 'Webhook handler failed');
    await repo.markEventProcessed(eventRowId, message);
  }

  res.json({ received: true });
});
