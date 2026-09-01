-- Payments that are not marketplace bookings.
--
-- Two flows still ran on ICPay because the payments table assumed a booking:
-- expert sessions (client pays an expert for their time) and subscriptions
-- (a user pays the platform). Both are payments; neither has a booking.
--
-- `booking_id` was already nullable. What blocked them was `payee_id NOT NULL`:
-- a subscription has no counterparty, because the money is the platform's and
-- there is no transfer out.

CREATE TYPE payment_purpose AS ENUM ('booking', 'expert_session', 'subscription');

ALTER TABLE payments
  ADD COLUMN purpose payment_purpose NOT NULL DEFAULT 'booking',
  ADD COLUMN expert_booking_id TEXT REFERENCES expert_bookings(id) ON DELETE SET NULL,
  ADD COLUMN subscription_id   TEXT REFERENCES subscriptions(id) ON DELETE SET NULL;

-- A platform payment has no payee. Relaxing NOT NULL rather than inventing a
-- synthetic "platform" user keeps "who receives this money" honest: for a
-- subscription, nobody does — it stays with the platform.
ALTER TABLE payments ALTER COLUMN payee_id DROP NOT NULL;

-- The old check compared two NOT NULL columns; it has to tolerate a null payee
-- while still forbidding paying yourself.
ALTER TABLE payments DROP CONSTRAINT payment_parties_differ;
ALTER TABLE payments ADD CONSTRAINT payment_parties_differ
  CHECK (payee_id IS NULL OR payer_id <> payee_id);

-- Every purpose must point at the thing it paid for, and only that thing.
-- Without this a subscription payment could carry a booking_id and be released
-- through the booking path.
ALTER TABLE payments ADD CONSTRAINT payment_purpose_target CHECK (
  (purpose = 'booking'        AND booking_id IS NOT NULL AND expert_booking_id IS NULL AND subscription_id IS NULL AND payee_id IS NOT NULL)
  OR
  (purpose = 'expert_session' AND expert_booking_id IS NOT NULL AND booking_id IS NULL AND subscription_id IS NULL AND payee_id IS NOT NULL)
  OR
  (purpose = 'subscription'   AND subscription_id IS NOT NULL AND booking_id IS NULL AND expert_booking_id IS NULL AND payee_id IS NULL)
);

CREATE INDEX idx_payments_expert_booking ON payments (expert_booking_id)
  WHERE expert_booking_id IS NOT NULL;
CREATE INDEX idx_payments_subscription ON payments (subscription_id)
  WHERE subscription_id IS NOT NULL;

-- expert_bookings predates payments; link the two so a session knows whether
-- it has been paid for.
ALTER TABLE expert_bookings
  ADD COLUMN payment_state TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_state IN ('unpaid', 'held', 'released', 'refunded'));
