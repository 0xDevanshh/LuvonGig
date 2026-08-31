-- Bookings, stages, timeline, reviews, disputes.
-- Ported from ../backend/canisters/marketplace.mo.
--
-- The canister's Booking record carried ~20 denormalised fields (client_name,
-- freelancer_name, package_title, package_features, and a parallel set of
-- *_readable date strings) purely because actors cannot JOIN. Those are gone:
-- names come from a join, dates are formatted at the edge.
--
-- What is deliberately KEPT denormalised is `package_snapshot`: the terms a
-- client actually agreed to. A freelancer editing their package next month
-- must not retroactively change what an existing order promised.

CREATE TYPE booking_status AS ENUM (
  'pending', 'active', 'in_dispute', 'completed', 'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'held_in_escrow', 'released', 'refunded', 'disputed'
);

CREATE TYPE stage_status AS ENUM (
  'pending', 'in_progress', 'completed', 'approved', 'rejected', 'cancelled', 'disputed'
);

CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

CREATE TYPE dispute_kind AS ENUM (
  'quality_issue', 'deadline_miss', 'communication_issue', 'payment_issue', 'other'
);

CREATE TYPE timeline_event_type AS ENUM (
  'booking_created', 'booking_confirmed', 'payment_completed',
  'work_started', 'work_completed',
  'stage_created', 'stage_updated', 'stage_approved', 'stage_rejected',
  'client_reviewed', 'freelancer_reviewed',
  'booking_completed', 'booking_cancelled',
  'dispute_raised', 'dispute_resolved'
);


CREATE TABLE bookings (
  id            TEXT PRIMARY KEY,
  service_id    TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  package_id    TEXT NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
  client_id     TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  freelancer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  requirements  TEXT[] NOT NULL DEFAULT '{}',
  special_instructions TEXT NOT NULL DEFAULT '',

  status         booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',

  -- Money. base + fee = total, always; enforced below.
  currency             CHAR(3) NOT NULL DEFAULT 'USD',
  total_minor          BIGINT  NOT NULL CHECK (total_minor >= 0),
  base_amount_minor    BIGINT  NOT NULL CHECK (base_amount_minor >= 0),
  platform_fee_minor   BIGINT  NOT NULL DEFAULT 0 CHECK (platform_fee_minor >= 0),
  discount_minor       BIGINT  NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  promo_code           TEXT,

  -- Order terms as agreed, immutable once the booking exists.
  package_snapshot JSONB NOT NULL DEFAULT '{}',

  delivery_days     INTEGER NOT NULL DEFAULT 7 CHECK (delivery_days > 0),
  delivery_deadline TIMESTAMPTZ,

  -- Lifecycle. Nullable because each is genuinely unknown until it happens —
  -- the canister used sentinel zeros, which the frontend then had to detect.
  confirmed_at            TIMESTAMPTZ,
  payment_completed_at    TIMESTAMPTZ,
  work_started_at         TIMESTAMPTZ,
  work_completed_at       TIMESTAMPTZ,
  client_reviewed_at      TIMESTAMPTZ,
  freelancer_reviewed_at  TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,

  legacy_total_e8s BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT booking_amounts_balance
    CHECK (total_minor = base_amount_minor + platform_fee_minor - discount_minor),
  CONSTRAINT booking_parties_differ
    CHECK (client_id <> freelancer_id)
);

CREATE INDEX idx_bookings_client     ON bookings (client_id, created_at DESC);
CREATE INDEX idx_bookings_freelancer ON bookings (freelancer_id, created_at DESC);
CREATE INDEX idx_bookings_service    ON bookings (service_id);
CREATE INDEX idx_bookings_status     ON bookings (status) WHERE status IN ('pending', 'active', 'in_dispute');

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE booking_stages (
  id            TEXT PRIMARY KEY,
  booking_id    TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  status        stage_status NOT NULL DEFAULT 'pending',

  amount_minor  BIGINT  NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency      CHAR(3) NOT NULL DEFAULT 'USD',

  due_date      TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,

  deliverables  TEXT[] NOT NULL DEFAULT '{}',
  client_approved     BOOLEAN NOT NULL DEFAULT false,
  freelancer_approved BOOLEAN NOT NULL DEFAULT false,
  dispute_reason      TEXT,

  sort_order    INTEGER NOT NULL DEFAULT 0,
  legacy_amount_e8s BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stages_booking ON booking_stages (booking_id, sort_order);

CREATE TRIGGER booking_stages_updated_at BEFORE UPDATE ON booking_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Append-only audit trail. No updated_at: an event that changes is not an event.
CREATE TABLE booking_timeline_events (
  id            TEXT PRIMARY KEY,
  booking_id    TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type    timeline_event_type NOT NULL,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  description   TEXT NOT NULL DEFAULT '',
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_booking ON booking_timeline_events (booking_id, created_at);


CREATE TABLE reviews (
  id            TEXT PRIMARY KEY,
  booking_id    TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id    TEXT REFERENCES services(id) ON DELETE SET NULL,

  rating        NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL DEFAULT '',
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per person per booking. The canister allowed unlimited
  -- resubmission, which let a single client inflate a rating repeatedly.
  UNIQUE (booking_id, reviewer_id),
  CONSTRAINT review_not_self CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id, created_at DESC);
CREATE INDEX idx_reviews_service  ON reviews (service_id, created_at DESC);

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Keeps services.rating_avg / review_count honest without the application
-- having to remember. The canister recomputed this by hand in submitReview and
-- drifted whenever a write partially failed.
CREATE OR REPLACE FUNCTION refresh_service_rating() RETURNS trigger AS $$
DECLARE
  target_service TEXT := COALESCE(NEW.service_id, OLD.service_id);
BEGIN
  IF target_service IS NOT NULL THEN
    UPDATE services s
       SET rating_avg   = COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.service_id = target_service), 0),
           review_count = (SELECT COUNT(*) FROM reviews r WHERE r.service_id = target_service)
     WHERE s.id = target_service;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_refresh_service_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_service_rating();


CREATE TABLE disputes (
  id           TEXT PRIMARY KEY,
  booking_id   TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  raised_by    TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  kind         dispute_kind   NOT NULL DEFAULT 'other',
  status       dispute_status NOT NULL DEFAULT 'open',
  description  TEXT NOT NULL,
  evidence     TEXT[] NOT NULL DEFAULT '{}',

  resolution   TEXT,
  resolved_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_booking ON disputes (booking_id);
CREATE INDEX idx_disputes_open    ON disputes (status) WHERE status IN ('open', 'under_review');

CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
