/**
 * Payment and payout routes.
 *
 * Replaces escrow.mo. "Escrow" is no longer a canister holding ICP: the client
 * is charged onto the PLATFORM balance and the money stays there until the
 * work is accepted, at which point a transfer moves the freelancer's share.
 *
 * Two rules run through everything here:
 *   - only the client pays, and only the client releases; a freelancer can
 *     never move money toward themselves
 *   - state changes go through transitionState, which only advances from the
 *     states that legally precede the new one. A replayed webhook matches no
 *     row and does nothing.
 */
import { Router } from 'express';
import { z } from 'zod';
import { withTransaction } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { badRequest, conflict, forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';
import { ok } from '../../lib/http.js';
import { generateId } from '../../lib/ids.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { param, validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import * as bookingRepo from '../bookings/repo.js';
import { createBooking } from '../bookings/service.js';
import { getStripeProvider } from './stripe.js';
import { ProviderError } from './provider.js';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

/** The API boots without Stripe keys; these routes just refuse until it has them. */
function provider() {
  const p = getStripeProvider();
  if (!p) throw serviceUnavailable('Payments are not configured on this environment.');
  return p;
}

function toPaymentDto(p: repo.PaymentRow) {
  return {
    id: p.id,
    booking_id: p.booking_id,
    state: p.state,
    currency: p.currency,
    amount_minor: p.amount_minor,
    platform_fee_minor: p.platform_fee_minor,
    refunded_minor: p.refunded_minor,
    provider: p.provider,
    held_at: p.held_at,
    released_at: p.released_at,
    refunded_at: p.refunded_at,
    created_at: p.created_at,
  };
}

// --- Payout onboarding -----------------------------------------------------

paymentsRouter.post('/payouts/onboard', async (req, res, next) => {
  try {
    const p = provider();
    const userId = req.user!.userId;
    const existing = await repo.getPayoutAccount(userId);

    const returnUrl = `${env.APP_URL}/freelancer/settings/payouts?done=1`;
    const refreshUrl = `${env.APP_URL}/freelancer/settings/payouts?refresh=1`;

    // Reuse the account if one exists — creating a second would strand the
    // first, along with any balance on it.
    const link = existing
      ? await p.refreshOnboardingLink(existing.provider_account_id, returnUrl, refreshUrl)
      : await p.startOnboarding(userId, req.user!.email, returnUrl, refreshUrl);

    if (!existing) await repo.upsertPayoutAccount(userId, link.providerAccountId, p.name);

    ok(res, { url: link.url });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/payouts/status', async (req, res, next) => {
  try {
    const account = await repo.getPayoutAccount(req.user!.userId);
    if (!account) {
      return ok(res, { onboarded: false, charges_enabled: false, payouts_enabled: false });
    }

    // Refresh from the provider when possible: webhooks can be missed, and
    // this flag gates whether someone can sell.
    const p = getStripeProvider();
    if (p) {
      try {
        const status = await p.getAccountStatus(account.provider_account_id);
        await repo.updateAccountStatus(account.provider_account_id, {
          chargesEnabled: status.chargesEnabled,
          payoutsEnabled: status.payoutsEnabled,
          detailsSubmitted: status.detailsSubmitted,
          requirements: status.requirements,
          country: status.country,
          currency: status.defaultCurrency,
        });
        return ok(res, {
          onboarded: status.detailsSubmitted,
          charges_enabled: status.chargesEnabled,
          payouts_enabled: status.payoutsEnabled,
          requirements: status.requirements,
          country: status.country,
        });
      } catch {
        // Fall through to the stored copy rather than failing the page.
      }
    }

    ok(res, {
      onboarded: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
      country: account.country,
    });
  } catch (err) {
    next(err);
  }
});

// --- Paying for a booking --------------------------------------------------

paymentsRouter.post('/intent',
  validateBody(z.object({ booking_id: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const p = provider();
      const booking = await bookingRepo.getBooking(req.body.booking_id);
      if (!booking) return next(notFound('Booking not found'));

      // Only the client pays. A freelancer creating an intent on their own
      // booking would be charging someone else's card.
      if (booking.client_id !== req.user!.userId) {
        return next(forbidden('Only the client can pay for this booking'));
      }
      if (booking.payment_status !== 'pending') {
        return next(conflict('This booking has already been paid'));
      }

      const payee = await repo.getPayoutAccount(booking.freelancer_id);
      if (!payee?.charges_enabled) {
        return next(conflict(
          'This freelancer has not finished setting up payouts, so the booking cannot be paid yet.',
        ));
      }

      // Retrying the same booking must not create a second charge.
      const idempotencyKey = `booking:${booking.id}:intent`;
      const existing = await repo.findByIdempotencyKey(idempotencyKey);
      if (existing && existing.state !== 'failed' && existing.state !== 'cancelled') {
        const intent = await p.createIntent({
          amountMinor: BigInt(existing.amount_minor),
          currency: existing.currency,
          transferGroup: booking.id,
          metadata: { bookingId: booking.id, paymentId: existing.id },
          idempotencyKey,
        });
        return ok(res, { payment: toPaymentDto(existing), client_secret: intent.clientSecret });
      }

      const total = BigInt(booking.total_minor);
      // Use the fee the booking already recorded. Recomputing it from the
      // total double-charges: the total is base + fee, so splitPlatformFee on
      // it yields a fee on the fee — the platform over-collects and the
      // freelancer is short-paid by that difference.
      const fee = BigInt(booking.platform_fee_minor);

      const paymentId = generateId('pay');
      await repo.insertPayment({
        id: paymentId,
        bookingId: booking.id,
        payerId: booking.client_id,
        payeeId: booking.freelancer_id,
        provider: p.name,
        currency: booking.currency,
        amountMinor: total,
        platformFeeMinor: fee,
        idempotencyKey,
        transferGroup: booking.id,
        destinationAccountId: payee.provider_account_id,
        metadata: { bookingId: booking.id },
      });

      const intent = await p.createIntent({
        amountMinor: total,
        currency: booking.currency,
        transferGroup: booking.id,
        metadata: { bookingId: booking.id, paymentId },
        idempotencyKey,
      });
      await repo.setProviderPaymentId(paymentId, intent.providerPaymentId);

      const created = await repo.getPayment(paymentId);
      res.status(201).json({
        success: true,
        data: { payment: toPaymentDto(created!), client_secret: intent.clientSecret },
      });
    } catch (err) {
      next(err instanceof ProviderError ? badRequest(err.message) : err);
    }
  });

/**
 * Book and pay in one call.
 *
 * The escrow flow it replaces worked the other way round: EscrowManager
 * created an escrow from a package_id and the booking came out of that. Rather
 * than restructure both checkout pages into "create booking, then pay", this
 * keeps their shape — hand it a package, get back a booking and a client
 * secret.
 *
 * Idempotent on (client, package): a double-submit returns the existing
 * booking rather than creating a second one.
 */
paymentsRouter.post('/checkout',
  validateBody(z.object({
    package_id: z.string().min(1),
    requirements: z.array(z.string().max(2000)).max(50).default([]),
    special_instructions: z.string().max(4000).default(''),
  })),
  async (req, res, next) => {
    try {
      const p = provider();
      const userId = req.user!.userId;

      const { rows: existingRows } = await (await import('../../db/pool.js')).query<{ id: string }>(
        `SELECT id FROM bookings
          WHERE client_id = $1 AND package_id = $2 AND status = 'pending' AND payment_status = 'pending'
          ORDER BY created_at DESC LIMIT 1`,
        [userId, req.body.package_id],
      );

      let bookingId = existingRows[0]?.id;

      if (!bookingId) {
        bookingId = (await createBooking({
          clientId: userId,
          packageId: req.body.package_id,
          requirements: req.body.requirements,
          specialInstructions: req.body.special_instructions,
        })).id;
      }

      const booking = await bookingRepo.getBooking(bookingId!);
      if (!booking) return next(notFound('Booking could not be created'));

      const payee = await repo.getPayoutAccount(booking.freelancer_id);
      if (!payee?.charges_enabled) {
        return next(conflict(
          'This freelancer has not finished setting up payouts, so the booking cannot be paid yet.',
        ));
      }

      const idempotencyKey = `booking:${booking.id}:intent`;
      let payment = await repo.findByIdempotencyKey(idempotencyKey);

      if (!payment) {
        const total = BigInt(booking.total_minor);
        const fee = BigInt(booking.platform_fee_minor);
        const paymentId = generateId('pay');
        await repo.insertPayment({
          id: paymentId,
          bookingId: booking.id,
          payerId: booking.client_id,
          payeeId: booking.freelancer_id,
          provider: p.name,
          currency: booking.currency,
          amountMinor: total,
          platformFeeMinor: fee,
          idempotencyKey,
          transferGroup: booking.id,
          destinationAccountId: payee.provider_account_id,
          metadata: { bookingId: booking.id },
        });
        payment = (await repo.getPayment(paymentId))!;
      }

      const intent = await p.createIntent({
        amountMinor: BigInt(payment.amount_minor),
        currency: payment.currency,
        transferGroup: booking.id,
        metadata: { bookingId: booking.id, paymentId: payment.id },
        idempotencyKey,
      });
      await repo.setProviderPaymentId(payment.id, intent.providerPaymentId);

      res.status(201).json({
        success: true,
        data: {
          booking_id: booking.id,
          payment: toPaymentDto((await repo.getPayment(payment.id))!),
          client_secret: intent.clientSecret,
        },
      });
    } catch (err) {
      next(err instanceof ProviderError ? badRequest(err.message) : err);
    }
  });

// --- Release ---------------------------------------------------------------

paymentsRouter.post('/:paymentId/release', async (req, res, next) => {
  try {
    const p = provider();
    const payment = await repo.getPayment(param(req, 'paymentId'));
    if (!payment) return next(notFound('Payment not found'));

    // The client releases. Letting the payee release would remove the point of
    // holding the money at all.
    if (payment.payer_id !== req.user!.userId) {
      return next(forbidden('Only the client can release this payment'));
    }
    if (payment.state !== 'held') {
      return next(conflict(`A payment in state "${payment.state}" cannot be released`));
    }
    // A subscription has no payee — that money is the platform's and there is
    // nothing to transfer out. payment_purpose_target makes this unreachable
    // from a well-formed row, but releasing to nobody is worth refusing
    // explicitly rather than relying on that.
    if (!payment.payee_id || !payment.destination_account_id) {
      return next(conflict('This payment has no recipient to release to'));
    }
    const payeeId = payment.payee_id;

    const total = BigInt(payment.amount_minor);
    const fee = BigInt(payment.platform_fee_minor);
    const payout = total - fee;

    // Claim the state first. If the transfer then fails we roll back to held,
    // rather than leaving a window in which two releases can both proceed.
    const claimed = await repo.transitionState(null, payment.id, 'released', ['held']);
    if (!claimed) return next(conflict('This payment is already being released'));

    let transfer;
    try {
      transfer = await p.transferToAccount({
        amountMinor: payout,
        currency: payment.currency,
        destinationAccountId: payment.destination_account_id,
        transferGroup: payment.transfer_group ?? payment.id,
        metadata: { paymentId: payment.id, bookingId: payment.booking_id ?? '' },
        idempotencyKey: `payment:${payment.id}:release`,
      });
    } catch (err) {
      await repo.transitionState(null, payment.id, 'held', ['released'],
        { failureReason: err instanceof Error ? err.message : 'transfer failed' });
      throw err;
    }

    await withTransaction(async (client) => {
      await repo.insertPayout(client, {
        id: generateId('po'),
        paymentId: payment.id,
        payeeId,
        provider: p.name,
        providerPayoutId: transfer.providerTransferId,
        currency: payment.currency,
        amountMinor: payout,
      });

      if (payment.booking_id) {
        await bookingRepo.setPaymentStatus(client, payment.booking_id, 'released');
        await bookingRepo.addTimelineEvent(client, payment.booking_id, 'payment_completed',
          req.user!.userId, 'Payment released to the freelancer',
          { paymentId: payment.id, payoutMinor: payout.toString() });
      }
    });

    ok(res, toPaymentDto((await repo.getPayment(payment.id))!));
  } catch (err) {
    next(err instanceof ProviderError ? badRequest(err.message) : err);
  }
});

// --- Refund ----------------------------------------------------------------

paymentsRouter.post('/:paymentId/refund',
  validateBody(z.object({
    amount_minor: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)])
      .transform((v) => BigInt(v)).optional(),
    reason: z.string().max(500).optional(),
  })),
  async (req, res, next) => {
    try {
      const p = provider();
      const payment = await repo.getPayment(param(req, 'paymentId'));
      if (!payment) return next(notFound('Payment not found'));

      // Either party may request a refund while the money is still held.
      if (payment.payer_id !== req.user!.userId && payment.payee_id !== req.user!.userId) {
        return next(notFound('Payment not found'));
      }
      if (payment.state !== 'held') {
        return next(conflict(
          payment.state === 'released'
            ? 'This payment has already been released and can no longer be refunded here'
            : `A payment in state "${payment.state}" cannot be refunded`,
        ));
      }

      const total = BigInt(payment.amount_minor);
      const already = BigInt(payment.refunded_minor);
      const amount = req.body.amount_minor ?? total - already;

      // refund_within_amount would reject this; the message is clearer here.
      if (amount <= 0n || already + amount > total) {
        return next(badRequest('Refund amount exceeds what remains on this payment'));
      }

      const result = await p.refund({
        providerPaymentId: payment.provider_payment_id!,
        ...(amount < total - already ? { amountMinor: amount } : {}),
        reason: req.body.reason,
        idempotencyKey: `payment:${payment.id}:refund:${(already + amount).toString()}`,
      });

      const refundedTotal = already + result.refundedMinor;
      const fullyRefunded = refundedTotal >= total;

      await repo.transitionState(null, payment.id,
        fullyRefunded ? 'refunded' : 'partially_refunded', ['held'],
        { refundedMinor: refundedTotal });

      if (payment.booking_id && fullyRefunded) {
        await withTransaction(async (client) => {
          await bookingRepo.setPaymentStatus(client, payment.booking_id!, 'refunded');
          await bookingRepo.addTimelineEvent(client, payment.booking_id!, 'booking_cancelled',
            req.user!.userId, 'Payment refunded', { paymentId: payment.id });
        });
      }

      ok(res, toPaymentDto((await repo.getPayment(payment.id))!));
    } catch (err) {
      next(err instanceof ProviderError ? badRequest(err.message) : err);
    }
  });

/**
 * The live payment for a booking, or null.
 *
 * Exists because a booking does not carry its payment id — payments reference
 * bookings, not the reverse — so the client had no way to name the payment it
 * wanted to release. The old UI guessed, constructing the canister's
 * `serviceId:N` escrow id and hoping it addressed something; against Postgres
 * ids that always 404s.
 *
 * Two segments, so it cannot be mistaken for a payment id by the route below.
 */
paymentsRouter.get('/for-booking/:bookingId', async (req, res, next) => {
  try {
    const payment = await repo.getPaymentForBooking(param(req, 'bookingId'));
    // No payment yet is a normal state for an unpaid booking, not an error.
    if (!payment) return ok(res, null);
    if (payment.payer_id !== req.user!.userId && payment.payee_id !== req.user!.userId) {
      return next(notFound('Payment not found'));
    }
    ok(res, toPaymentDto(payment));
  } catch (err) {
    next(err);
  }
});

paymentsRouter.get('/:paymentId', async (req, res, next) => {
  try {
    const payment = await repo.getPayment(param(req, 'paymentId'));
    if (!payment) return next(notFound('Payment not found'));
    if (payment.payer_id !== req.user!.userId && payment.payee_id !== req.user!.userId) {
      return next(notFound('Payment not found'));
    }
    ok(res, toPaymentDto(payment));
  } catch (err) {
    next(err);
  }
});
