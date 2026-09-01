/**
 * Payments that are not marketplace bookings.
 *
 * Expert sessions and subscriptions were the last two flows on ICPay, because
 * the payments module assumed every payment settled a booking. They differ in
 * one important way from each other:
 *
 *   expert_session — a client pays an expert. Held, then transferred, exactly
 *                    like a booking. The expert needs a payout account.
 *   subscription   — a user pays the PLATFORM. There is no counterparty and no
 *                    transfer out, so the payment has no payee and is never
 *                    "released" to anyone.
 *
 * That asymmetry is why `payee_id` is nullable and `payment_purpose_target`
 * exists: a subscription must not be releasable through the booking path.
 */
import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne, withTransaction } from '../../db/pool.js';
import { badRequest, conflict, notFound, serviceUnavailable } from '../../lib/errors.js';
import { generateId } from '../../lib/ids.js';
import { splitPlatformFee } from '../../lib/money.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import { getStripeProvider } from './stripe.js';
import { ProviderError } from './provider.js';

export const purposesRouter = Router();
purposesRouter.use(requireAuth);

function provider() {
  const p = getStripeProvider();
  if (!p) throw serviceUnavailable('Payments are not configured on this environment.');
  return p;
}

// --- Expert sessions -------------------------------------------------------

interface ExpertRow {
  id: string;
  user_id: string;
  hourly_rate_minor: string;
  currency: string;
  is_active: boolean;
}

purposesRouter.post('/expert-session',
  validateBody(z.object({
    expert_id: z.string().min(1),
    scheduled_at: z.string().datetime(),
    duration_minutes: z.number().int().positive().max(600).default(60),
    notes: z.string().max(2000).optional(),
  })),
  async (req, res, next) => {
    try {
      const p = provider();
      const userId = req.user!.userId;

      const expert = await queryOne<ExpertRow>(
        'SELECT id, user_id, hourly_rate_minor, currency, is_active FROM experts WHERE id = $1',
        [req.body.expert_id],
      );
      if (!expert || !expert.is_active) return next(notFound('Expert not found'));
      if (expert.user_id === userId) return next(badRequest('You cannot book a session with yourself'));

      const payee = await repo.getPayoutAccount(expert.user_id);
      if (!payee?.charges_enabled) {
        return next(conflict('This expert has not finished setting up payouts yet.'));
      }

      // Rate is hourly; charge for the time actually booked.
      const rate = BigInt(expert.hourly_rate_minor);
      const total = (rate * BigInt(req.body.duration_minutes)) / 60n;
      if (total <= 0n) return next(badRequest('This expert has not set a session rate'));

      const { fee } = splitPlatformFee(total);
      const sessionId = generateId('exb');
      const paymentId = generateId('pay');
      const idempotencyKey = `expert:${sessionId}:intent`;

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO expert_bookings (id, expert_id, client_id, scheduled_at, duration_minutes,
             amount_minor, currency, status, notes)
           VALUES ($1,$2,$3,$4::timestamptz,$5,$6,$7,'pending',$8)`,
          [sessionId, expert.id, userId, req.body.scheduled_at, req.body.duration_minutes,
           total.toString(), expert.currency, req.body.notes ?? null],
        );

        await client.query(
          `INSERT INTO payments (id, purpose, expert_booking_id, payer_id, payee_id, provider,
             state, currency, amount_minor, platform_fee_minor, idempotency_key, transfer_group,
             destination_account_id, metadata)
           VALUES ($1,'expert_session',$2,$3,$4,'stripe','requires_payment',$5,$6,$7,$8,$9,$10,$11::jsonb)`,
          [paymentId, sessionId, userId, expert.user_id, expert.currency,
           total.toString(), fee.toString(), idempotencyKey, sessionId,
           payee.provider_account_id, JSON.stringify({ expertBookingId: sessionId })],
        );
      });

      const intent = await p.createIntent({
        amountMinor: total,
        currency: expert.currency,
        transferGroup: sessionId,
        metadata: { expertBookingId: sessionId, paymentId, purpose: 'expert_session' },
        idempotencyKey,
      });
      await repo.setProviderPaymentId(paymentId, intent.providerPaymentId);

      res.status(201).json({
        success: true,
        data: {
          expert_booking_id: sessionId,
          payment: { id: paymentId, amount_minor: total.toString(), currency: expert.currency },
          client_secret: intent.clientSecret,
        },
      });
    } catch (err) {
      next(err instanceof ProviderError ? badRequest(err.message) : err);
    }
  });

// --- Subscriptions ---------------------------------------------------------

/**
 * Plan prices live here rather than in the request: a client-supplied amount
 * is a client-chosen price. The old subscription route took `amount` from the
 * body, which meant a Premium plan could be bought for one cent.
 */
const PLANS: Record<string, { amountMinor: bigint; label: string }> = {
  Basic: { amountMinor: 0n, label: 'Basic' },
  Pro: { amountMinor: 2_900n, label: 'Pro' },
  Premium: { amountMinor: 9_900n, label: 'Premium' },
};

purposesRouter.get('/plans', (_req, res) => {
  res.json({
    success: true,
    data: Object.entries(PLANS).map(([key, v]) => ({
      plan: key, label: v.label, amount_minor: v.amountMinor.toString(),
    })),
  });
});

purposesRouter.post('/subscription',
  validateBody(z.object({ plan: z.enum(['Pro', 'Premium']) })),
  async (req, res, next) => {
    try {
      const p = provider();
      const userId = req.user!.userId;
      const plan = PLANS[req.body.plan]!;

      // idx_subscriptions_one_active enforces this; the message is clearer here.
      const active = await queryOne<{ id: string; plan: string }>(
        `SELECT id, plan FROM subscriptions WHERE user_id = $1 AND status = 'active'`, [userId]);
      if (active && active.plan === req.body.plan) {
        return next(conflict(`You are already on the ${req.body.plan} plan`));
      }

      const subscriptionId = generateId('sub');
      const paymentId = generateId('pay');
      const idempotencyKey = `subscription:${subscriptionId}:intent`;
      const currency = 'USD';

      await withTransaction(async (client) => {
        // The new subscription starts inactive: it becomes active when the
        // webhook confirms payment, not when the user clicks buy.
        await client.query(
          `INSERT INTO subscriptions (id, user_id, plan, status, currency, amount_minor,
             provider, current_period_start, current_period_end)
           VALUES ($1,$2,$3,'past_due',$4,$5,'stripe', now(), now() + interval '30 days')`,
          [subscriptionId, userId, req.body.plan, currency, plan.amountMinor.toString()],
        );

        // No payee and no destination account: this money is the platform's.
        await client.query(
          `INSERT INTO payments (id, purpose, subscription_id, payer_id, payee_id, provider,
             state, currency, amount_minor, platform_fee_minor, idempotency_key, metadata)
           VALUES ($1,'subscription',$2,$3,NULL,'stripe','requires_payment',$4,$5,$5,$6,$7::jsonb)`,
          [paymentId, subscriptionId, userId, currency, plan.amountMinor.toString(),
           idempotencyKey, JSON.stringify({ plan: req.body.plan })],
        );
      });

      const intent = await p.createIntent({
        amountMinor: plan.amountMinor,
        currency,
        transferGroup: subscriptionId,
        metadata: { subscriptionId, paymentId, plan: req.body.plan, purpose: 'subscription' },
        idempotencyKey,
      });
      await repo.setProviderPaymentId(paymentId, intent.providerPaymentId);

      res.status(201).json({
        success: true,
        data: {
          subscription_id: subscriptionId,
          payment: { id: paymentId, amount_minor: plan.amountMinor.toString(), currency },
          client_secret: intent.clientSecret,
        },
      });
    } catch (err) {
      next(err instanceof ProviderError ? badRequest(err.message) : err);
    }
  });

purposesRouter.get('/subscription', async (req, res, next) => {
  try {
    const row = await queryOne<Record<string, unknown>>(
      `SELECT id, plan, status, currency, amount_minor, current_period_start, current_period_end
         FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user!.userId],
    );
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
});

/**
 * Applied by the webhook once a non-booking payment is confirmed. Exported
 * rather than inlined so the webhook has one place to call for each purpose.
 */
export async function activateAfterPayment(payment: repo.PaymentRow): Promise<void> {
  if (payment.purpose === 'expert_session' && payment.expert_booking_id) {
    await query(
      `UPDATE expert_bookings SET payment_state = 'held', status = 'confirmed' WHERE id = $1`,
      [payment.expert_booking_id],
    );
    return;
  }

  if (payment.purpose === 'subscription' && payment.subscription_id) {
    await withTransaction(async (client) => {
      // Supersede the previous plan before activating the new one:
      // idx_subscriptions_one_active allows exactly one active row per user.
      await client.query(
        `UPDATE subscriptions SET status = 'cancelled', cancelled_at = now()
          WHERE user_id = $1 AND status = 'active' AND id <> $2`,
        [payment.payer_id, payment.subscription_id],
      );
      await client.query(
        `UPDATE subscriptions SET status = 'active' WHERE id = $1`, [payment.subscription_id]);

      const { rows } = await client.query<{ plan: string }>(
        'SELECT plan FROM subscriptions WHERE id = $1', [payment.subscription_id]);
      const plan = rows[0]?.plan ?? 'Basic';

      // user_usage drives the connects quota the rest of the app reads.
      await client.query(
        `INSERT INTO user_usage (user_id, plan, connects, plan_expires_at)
         VALUES ($1, $2, $3, now() + interval '30 days')
         ON CONFLICT (user_id) DO UPDATE SET
           plan = EXCLUDED.plan,
           connects = user_usage.connects + EXCLUDED.connects,
           plan_expires_at = EXCLUDED.plan_expires_at`,
        [payment.payer_id, plan, plan === 'Premium' ? 150 : 80],
      );
    });
  }
}
