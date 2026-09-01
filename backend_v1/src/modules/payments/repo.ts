import type { PoolClient } from 'pg';
import { query, queryOne } from '../../db/pool.js';

export type PaymentState =
  | 'requires_payment' | 'processing' | 'held' | 'released'
  | 'refunded' | 'partially_refunded' | 'failed' | 'cancelled';

export interface PaymentRow {
  id: string;
  booking_id: string | null;
  purpose: 'booking' | 'expert_session' | 'subscription';
  expert_booking_id: string | null;
  subscription_id: string | null;
  payer_id: string;
  /** Null for a subscription: that money is the platform's, with no payout. */
  payee_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  state: PaymentState;
  currency: string;
  amount_minor: string;
  platform_fee_minor: string;
  refunded_minor: string;
  idempotency_key: string | null;
  failure_reason: string | null;
  destination_account_id: string | null;
  transfer_group: string | null;
  held_at: Date | null;
  released_at: Date | null;
  refunded_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface PayoutAccountRow {
  user_id: string;
  provider: string;
  provider_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: Record<string, unknown>;
  country: string | null;
  currency: string | null;
}

export async function getPayoutAccount(userId: string): Promise<PayoutAccountRow | null> {
  return queryOne<PayoutAccountRow>('SELECT * FROM payout_accounts WHERE user_id = $1', [userId]);
}

export async function getPayoutAccountByProviderId(id: string): Promise<PayoutAccountRow | null> {
  return queryOne<PayoutAccountRow>(
    'SELECT * FROM payout_accounts WHERE provider_account_id = $1', [id]);
}

export async function upsertPayoutAccount(
  userId: string, providerAccountId: string, provider = 'stripe',
): Promise<void> {
  await query(
    `INSERT INTO payout_accounts (user_id, provider, provider_account_id)
     VALUES ($1, $2::payment_provider, $3)
     ON CONFLICT (user_id) DO UPDATE SET provider_account_id = EXCLUDED.provider_account_id`,
    [userId, provider, providerAccountId],
  );
}

export async function updateAccountStatus(
  providerAccountId: string,
  s: { chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean;
       requirements: Record<string, unknown>; country: string | null; currency: string | null },
): Promise<void> {
  await query(
    `UPDATE payout_accounts
        SET charges_enabled = $2, payouts_enabled = $3, details_submitted = $4,
            requirements = $5::jsonb, country = $6, currency = $7
      WHERE provider_account_id = $1`,
    [providerAccountId, s.chargesEnabled, s.payoutsEnabled, s.detailsSubmitted,
     JSON.stringify(s.requirements), s.country, s.currency],
  );
}

export async function getPayment(id: string): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>('SELECT * FROM payments WHERE id = $1', [id]);
}

export async function getPaymentByProviderId(
  provider: string, providerPaymentId: string,
): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>(
    'SELECT * FROM payments WHERE provider = $1::payment_provider AND provider_payment_id = $2',
    [provider, providerPaymentId],
  );
}

export async function getPaymentForBooking(bookingId: string): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>(
    // The live one: a cancelled or failed attempt must not block a retry.
    `SELECT * FROM payments
      WHERE booking_id = $1 AND state NOT IN ('failed','cancelled')
      ORDER BY created_at DESC LIMIT 1`,
    [bookingId],
  );
}

export async function findByIdempotencyKey(key: string): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>('SELECT * FROM payments WHERE idempotency_key = $1', [key]);
}

export interface CreatePaymentInput {
  id: string;
  bookingId: string | null;
  payerId: string;
  payeeId: string;
  provider: string;
  currency: string;
  amountMinor: bigint;
  platformFeeMinor: bigint;
  idempotencyKey: string;
  transferGroup: string;
  destinationAccountId: string | null;
  metadata: Record<string, unknown>;
}

export async function insertPayment(p: CreatePaymentInput): Promise<void> {
  await query(
    `INSERT INTO payments (id, booking_id, payer_id, payee_id, provider, state, currency,
       amount_minor, platform_fee_minor, idempotency_key, transfer_group,
       destination_account_id, metadata)
     VALUES ($1,$2,$3,$4,$5::payment_provider,'requires_payment',$6,$7,$8,$9,$10,$11,$12::jsonb)`,
    [p.id, p.bookingId, p.payerId, p.payeeId, p.provider, p.currency,
     p.amountMinor.toString(), p.platformFeeMinor.toString(), p.idempotencyKey,
     p.transferGroup, p.destinationAccountId, JSON.stringify(p.metadata)],
  );
}

export async function setProviderPaymentId(id: string, providerPaymentId: string): Promise<void> {
  await query('UPDATE payments SET provider_payment_id = $2 WHERE id = $1', [id, providerPaymentId]);
}

/**
 * Moves a payment to a new state, but only from the states that legally
 * precede it. Returns null when the transition is not allowed — which is how
 * a replayed webhook is made harmless: the second delivery matches no row.
 */
export async function transitionState(
  client: PoolClient | null,
  id: string,
  to: PaymentState,
  from: PaymentState[],
  extra: { failureReason?: string; refundedMinor?: bigint } = {},
): Promise<PaymentRow | null> {
  const stamp =
    to === 'held' ? ', held_at = COALESCE(held_at, now())'
    : to === 'released' ? ', released_at = COALESCE(released_at, now())'
    : to === 'refunded' || to === 'partially_refunded' ? ', refunded_at = now()'
    : '';

  // Placeholders are numbered from the params actually pushed. The previous
  // version emitted $4/$5 only when their clauses applied but always pushed
  // five values, so every call without them sent 5 parameters for a statement
  // with 3 — which failed every release and refund.
  const params: unknown[] = [id, to, from];
  const sets: string[] = [];

  if (extra.failureReason !== undefined) {
    sets.push(`failure_reason = $${params.push(extra.failureReason)}`);
  }
  if (extra.refundedMinor !== undefined) {
    sets.push(`refunded_minor = $${params.push(extra.refundedMinor.toString())}`);
  }

  const sql = `
    UPDATE payments
       SET state = $2::payment_state
           ${sets.length > 0 ? `, ${sets.join(', ')}` : ''}
           ${stamp}
     WHERE id = $1 AND state = ANY($3::payment_state[])
     RETURNING *`;

  if (client) {
    const { rows } = await client.query<PaymentRow>(sql, params);
    return rows[0] ?? null;
  }
  return queryOne<PaymentRow>(sql, params);
}

export async function insertPayout(
  client: PoolClient,
  p: { id: string; paymentId: string; payeeId: string; provider: string;
       providerPayoutId: string; currency: string; amountMinor: bigint },
): Promise<void> {
  await client.query(
    `INSERT INTO payouts (id, payment_id, payee_id, provider, provider_payout_id, state,
       currency, amount_minor, paid_at)
     VALUES ($1,$2,$3,$4::payment_provider,$5,'in_transit',$6,$7, now())`,
    [p.id, p.paymentId, p.payeeId, p.provider, p.providerPayoutId, p.currency,
     p.amountMinor.toString()],
  );
}

/**
 * Records a webhook event, returning false when it has been seen before.
 *
 * This is the whole replay defence: providers deliver at-least-once and resend
 * after a timeout, so without the unique constraint a redelivered
 * `payment_intent.succeeded` would release a booking twice.
 */
export async function recordEvent(
  id: string, provider: string, providerEventId: string, type: string, payload: unknown,
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO payment_events (id, provider, provider_event_id, event_type, payload)
     VALUES ($1,$2::payment_provider,$3,$4,$5::jsonb)
     ON CONFLICT (provider, provider_event_id) DO NOTHING
     RETURNING id`,
    [id, provider, providerEventId, type, JSON.stringify(payload)],
  );
  return row !== null;
}

export async function markEventProcessed(id: string, error?: string): Promise<void> {
  await query('UPDATE payment_events SET processed_at = now(), process_error = $2 WHERE id = $1',
    [id, error ?? null]);
}
