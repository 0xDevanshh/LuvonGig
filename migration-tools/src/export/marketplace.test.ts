/**
 * The escrow-link fields on an exported booking.
 *
 * These four are the only recorded connection between a booking and the ICP
 * that escrow.mo held for it, and Phase 8 deletes the canister that could
 * answer the question again. A silent null here is not a cosmetic bug — it is
 * a payment that can no longer be traced to what it paid for, so the empty and
 * absent cases are pinned rather than assumed.
 */
import { describe, expect, it } from 'vitest';
import { normaliseBooking } from './marketplace.js';

/** The fields normaliseBooking needs to not throw; values are irrelevant here. */
const baseBooking = {
  booking_id: 'BK_1',
  service_id: 'SVC_1',
  package_id: 'PKG_1',
  client_id: 'u1',
  freelancer_id: 'u2',
  status: { Active: null },
  payment_status: { HeldInEscrow: null },
  total_amount_e8s: 0n,
  base_amount_e8s: 0n,
  platform_fee_e8s: 0n,
  discount_amount_e8s: 0n,
  promo_code: [],
  delivery_days: 7n,
  created_at: 0n,
  updated_at: 0n,
  deadline: 0n,
  delivery_deadline: 0n,
  booking_confirmed_at: [],
  payment_completed_at: [],
  work_started_at: [],
  work_completed_at: [],
  client_reviewed_at: [],
  freelancer_reviewed_at: [],
  client_review: [],
  client_rating: [],
  freelancer_review: [],
  freelancer_rating: [],
};

describe('exported booking — escrow and ledger link', () => {
  it('carries the payment, transaction, escrow amount and ledger block', () => {
    const booking = normaliseBooking({
      ...baseBooking,
      payment_id: 'SVC_1:0',
      transaction_id: 'SVC_1:0',
      escrow_amount_e8s: 250_000_000n,
      ledger_deposit_block: [12_345n],
    });

    expect(booking.paymentId).toBe('SVC_1:0');
    expect(booking.transactionId).toBe('SVC_1:0');
    expect(booking.escrowAmountE8s).toBe('250000000');
    expect(booking.ledgerDepositBlock).toBe('12345');
  });

  it('treats the canister\'s empty string as absent, not as an id', () => {
    // escrow.mo's booking record uses "" for "no payment", and an id of ""
    // would probe as ":0" and match nothing while looking like real data.
    const booking = normaliseBooking({
      ...baseBooking,
      payment_id: '',
      transaction_id: '',
      escrow_amount_e8s: 0n,
      ledger_deposit_block: [],
    });

    expect(booking.paymentId).toBeNull();
    expect(booking.transactionId).toBeNull();
    expect(booking.ledgerDepositBlock).toBeNull();
  });

  it('keeps a zero escrow amount distinct from an unknown one', () => {
    // 0n is a fact — the booking was never funded. null would claim the
    // canister did not say, which is a different thing during reconciliation.
    expect(
      normaliseBooking({ ...baseBooking, escrow_amount_e8s: 0n }).escrowAmountE8s,
    ).toBe('0');
    expect(
      normaliseBooking({ ...baseBooking, escrow_amount_e8s: undefined }).escrowAmountE8s,
    ).toBeNull();
  });

  it('unwraps the Candid optional around the ledger block', () => {
    // ledger_deposit_block is `?Nat64`, so it arrives as [] or [value] — a
    // bare `String()` of it would export "12345" as a one-element array.
    expect(
      normaliseBooking({ ...baseBooking, ledger_deposit_block: [999n] }).ledgerDepositBlock,
    ).toBe('999');
    expect(
      normaliseBooking({ ...baseBooking, ledger_deposit_block: [] }).ledgerDepositBlock,
    ).toBeNull();
  });
});
