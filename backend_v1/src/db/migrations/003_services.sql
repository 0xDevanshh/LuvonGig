-- Services and their packages.
-- Ported from ../backend/canisters/marketplace.mo (Service, Package).
--
-- Two structural changes from the canister:
--   1. The JSON side-store in frontend/lib/service-storage.ts (faqs,
--      client_questions, tier_mode, cover_image_url, description_format) is
--      folded in as real columns. It existed only because the canister could
--      not hold this data, and it lived on a serverless filesystem that does
--      not persist — an existing production bug this closes.
--   2. `tier` becomes a stored column. The API was inferring it from package
--      name prefixes and price ordering on every read.

CREATE TYPE service_status AS ENUM ('active', 'paused', 'deleted');
CREATE TYPE package_tier   AS ENUM ('basic', 'standard', 'premium');

CREATE TABLE services (
  id                  TEXT PRIMARY KEY,
  freelancer_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title               TEXT NOT NULL,
  main_category       TEXT NOT NULL,
  sub_category        TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  description_format  TEXT NOT NULL DEFAULT 'markdown',
  whats_included      TEXT NOT NULL DEFAULT '',

  cover_image_url     TEXT,
  portfolio_images    TEXT[] NOT NULL DEFAULT '{}',
  tags                TEXT[] NOT NULL DEFAULT '{}',

  status              service_status NOT NULL DEFAULT 'active',
  tier_mode           TEXT NOT NULL DEFAULT '3tier' CHECK (tier_mode IN ('1tier', '3tier')),

  delivery_time_days  INTEGER NOT NULL DEFAULT 7 CHECK (delivery_time_days > 0),

  starting_from_minor BIGINT  NOT NULL DEFAULT 0 CHECK (starting_from_minor >= 0),
  currency            CHAR(3) NOT NULL DEFAULT 'USD',

  -- Denormalised aggregates, maintained by trigger in 004 when reviews change.
  rating_avg          NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  review_count        INTEGER      NOT NULL DEFAULT 0 CHECK (review_count >= 0),

  faqs                JSONB NOT NULL DEFAULT '[]',
  client_questions    JSONB NOT NULL DEFAULT '[]',

  -- Migration bookkeeping. Prices arrived as ICP e8s and cannot be converted
  -- to fiat automatically without inventing an exchange rate, so imported rows
  -- keep the original value and are flagged for the freelancer to confirm.
  price_needs_review    BOOLEAN NOT NULL DEFAULT false,
  legacy_starting_from_e8s BIGINT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_freelancer ON services (freelancer_id, status);
CREATE INDEX idx_services_category    ON services (main_category, sub_category) WHERE status = 'active';
CREATE INDEX idx_services_created     ON services (created_at DESC) WHERE status = 'active';
CREATE INDEX idx_services_tags        ON services USING gin (tags);

-- Replaces the O(n) substring scan in marketplace.mo searchServices.
CREATE INDEX idx_services_search ON services
  USING gin ((title || ' ' || description) gin_trgm_ops)
  WHERE status = 'active';

CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE service_packages (
  id                 TEXT PRIMARY KEY,
  service_id         TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  tier               package_tier NOT NULL,
  name               TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',

  price_minor        BIGINT  NOT NULL CHECK (price_minor >= 0),
  currency           CHAR(3) NOT NULL DEFAULT 'USD',

  delivery_time_days INTEGER NOT NULL DEFAULT 1 CHECK (delivery_time_days > 0),
  delivery_timeline  TEXT,
  revisions          INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
  features           TEXT[]  NOT NULL DEFAULT '{}',

  is_active          BOOLEAN NOT NULL DEFAULT true,

  price_needs_review BOOLEAN NOT NULL DEFAULT false,
  legacy_price_e8s   BIGINT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A service cannot offer two packages at the same tier.
  UNIQUE (service_id, tier)
);

CREATE INDEX idx_packages_service ON service_packages (service_id) WHERE is_active;

CREATE TRIGGER service_packages_updated_at BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
