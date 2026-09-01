-- Stripe Connect accounts.
--
-- A freelancer receives money through a connected account they own; the
-- platform never holds their balance beyond the escrow window. Nothing here is
-- Stripe-specific in shape — `provider` is on the row so a second provider can
-- coexist during a migration — but the capability flags follow Connect's
-- model, which is the one being implemented.

CREATE TABLE payout_accounts (
  user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  provider  payment_provider NOT NULL DEFAULT 'stripe',

  -- Stripe's `acct_...`. Unique: one connected account per user, and one user
  -- per connected account.
  provider_account_id TEXT NOT NULL UNIQUE,

  -- Mirrored from the provider via account.updated webhooks. Authoritative
  -- enough to gate publishing, but the provider remains the source of truth.
  charges_enabled     BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled     BOOLEAN NOT NULL DEFAULT false,
  details_submitted   BOOLEAN NOT NULL DEFAULT false,

  -- Requirements Stripe is still waiting on, kept for the onboarding UI.
  requirements JSONB NOT NULL DEFAULT '{}',

  country   CHAR(2),
  currency  CHAR(3),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_accounts_enabled ON payout_accounts (user_id) WHERE charges_enabled;

CREATE TRIGGER payout_accounts_updated_at BEFORE UPDATE ON payout_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Ties a payment to the connected account that will receive the transfer.
-- Nullable: a payment created before onboarding completes still records who it
-- is destined for once known.
ALTER TABLE payments
  ADD COLUMN destination_account_id TEXT,
  ADD COLUMN transfer_group TEXT;

-- Stripe groups a charge and its later transfers by transfer_group; using the
-- booking id makes reconciliation a join rather than a lookup table.
CREATE INDEX idx_payments_transfer_group ON payments (transfer_group)
  WHERE transfer_group IS NOT NULL;
