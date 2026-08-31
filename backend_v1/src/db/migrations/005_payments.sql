-- Payments, payouts, and the provider event log.
--
-- Provider-agnostic on purpose. The Stripe Connect decision is deferred to the
-- end of the migration, and the region feasibility check (Phase 0.5) has not
-- run — if cross-border transfers turn out to be unsupported, this has to work
-- for Razorpay Route instead. Nothing here names a provider; the
-- provider-specific tables (connected accounts, etc.) arrive in Phase 5.
--
-- This replaces ../backend/canisters/escrow.mo. "Escrow" is now a state a
-- payment is in, not a canister holding ICP: funds sit with the payment
-- provider until released.

CREATE TYPE payment_provider AS ENUM ('stripe', 'razorpay', 'icpay', 'manual');

CREATE TYPE payment_state AS ENUM (
  'requires_payment',  -- created, awaiting the client
  'processing',        -- submitted to the provider
  'held',              -- captured, funds held — the escrow state
  'released',          -- paid out to the freelancer
  'refunded',
  'partially_refunded',
  'failed',
  'cancelled'
);

CREATE TYPE payout_state AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'reversed');


CREATE TABLE payments (
  id          TEXT PRIMARY KEY,
  booking_id  TEXT REFERENCES bookings(id) ON DELETE RESTRICT,
  payer_id    TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payee_id    TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  provider             payment_provider NOT NULL,
  -- The provider's own identifier (Stripe PaymentIntent id, etc.). Null until
  -- the provider has been contacted.
  provider_payment_id  TEXT,

  state       payment_state NOT NULL DEFAULT 'requires_payment',

  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  amount_minor        BIGINT  NOT NULL CHECK (amount_minor > 0),
  platform_fee_minor  BIGINT  NOT NULL DEFAULT 0 CHECK (platform_fee_minor >= 0),
  refunded_minor      BIGINT  NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0),

  -- Client-supplied key that makes "pay for this booking" safe to retry. The
  -- canister already had this concept in bookPackage; here the database
  -- enforces it rather than the application remembering to.
  idempotency_key TEXT UNIQUE,

  failure_reason TEXT,

  held_at     TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT refund_within_amount CHECK (refunded_minor <= amount_minor),
  CONSTRAINT payment_parties_differ CHECK (payer_id <> payee_id)
);

-- One provider reference maps to exactly one payment row.
CREATE UNIQUE INDEX idx_payments_provider_ref
  ON payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_payer   ON payments (payer_id, created_at DESC);
CREATE INDEX idx_payments_payee   ON payments (payee_id, created_at DESC);
CREATE INDEX idx_payments_held    ON payments (state) WHERE state = 'held';

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE payouts (
  id         TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  payee_id   TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  provider            payment_provider NOT NULL,
  provider_payout_id  TEXT,

  state        payout_state NOT NULL DEFAULT 'pending',
  currency     CHAR(3) NOT NULL DEFAULT 'USD',
  amount_minor BIGINT  NOT NULL CHECK (amount_minor > 0),

  failure_reason TEXT,
  paid_at        TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_payouts_provider_ref
  ON payouts (provider, provider_payout_id)
  WHERE provider_payout_id IS NOT NULL;

CREATE INDEX idx_payouts_payee ON payouts (payee_id, created_at DESC);

CREATE TRIGGER payouts_updated_at BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Webhook deduplication. Providers deliver at-least-once and will resend the
-- same event after a timeout, so the unique constraint on the provider's event
-- id is what stops a booking being released twice.
CREATE TABLE payment_events (
  id                TEXT PRIMARY KEY,
  provider          payment_provider NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  payload           JSONB NOT NULL,

  processed_at   TIMESTAMPTZ,
  process_error  TEXT,

  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (provider, provider_event_id)
);

CREATE INDEX idx_payment_events_unprocessed
  ON payment_events (received_at) WHERE processed_at IS NULL;


-- Subscriptions (the existing /api/subscription routes, currently backed by
-- user_usage alone with no record of what was actually bought).
CREATE TABLE subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  plan       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active'
             CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),

  currency      CHAR(3) NOT NULL DEFAULT 'USD',
  amount_minor  BIGINT  NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),

  provider             payment_provider,
  provider_subscription_id TEXT,

  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end   TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions (user_id, created_at DESC);
-- At most one live subscription per user.
CREATE UNIQUE INDEX idx_subscriptions_one_active
  ON subscriptions (user_id) WHERE status = 'active';

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
