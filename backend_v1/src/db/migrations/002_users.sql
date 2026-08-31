-- Users, profiles, and auth artefacts.
-- Ported from ../backend/canisters/user.mo (the actor deployed as `user_v3`
-- per backend/dfx.json — NOT user_v2.mo, which is a divergent unused copy).

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  email           CITEXT      NOT NULL UNIQUE,
  password_hash   TEXT        NOT NULL,
  is_verified     BOOLEAN     NOT NULL DEFAULT false,
  profile_submitted BOOLEAN   NOT NULL DEFAULT false,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Kept only so a migrated row can be traced back to its canister identity
  -- during reconciliation. Dropped in Phase 8.
  legacy_wallet_principal  TEXT,
  legacy_wallet_account_id TEXT
);

-- The canister keyed users by raw Text, so "A@x.com" and "a@x.com" were two
-- different accounts. CITEXT closes that; the import must detect any existing
-- collisions before it runs.
COMMENT ON COLUMN users.email IS 'Case-insensitive. Canister treated case as significant — check for collisions on import.';

CREATE INDEX idx_users_created_at ON users (created_at DESC);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE user_profiles (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name        TEXT NOT NULL DEFAULT '',
  last_name         TEXT NOT NULL DEFAULT '',
  bio               TEXT,
  phone             TEXT,
  location          TEXT,
  website           TEXT,
  linkedin          TEXT,
  github            TEXT,
  twitter           TEXT,
  profile_image_url TEXT,
  resume_url        TEXT,
  skills            TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_skills ON user_profiles USING gin (skills);

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- start_date / end_date are TEXT because the canister stored them as free-form
-- Text ("2020", "Jan 2020", "2020-01-15") with no validation. Parsing them into
-- DATE would silently drop whatever fails to parse, so the raw value is
-- preserved and normalisation is left to a later, deliberate cleanup.
CREATE TABLE experiences (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company     TEXT NOT NULL,
  position    TEXT NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT,
  description TEXT,
  is_current  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_experiences_user ON experiences (user_id, sort_order);

CREATE TRIGGER experiences_updated_at BEFORE UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE educations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree      TEXT NOT NULL,
  field       TEXT NOT NULL,
  start_date  TEXT NOT NULL,
  end_date    TEXT,
  gpa         TEXT,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_educations_user ON educations (user_id, sort_order);

CREATE TRIGGER educations_updated_at BEFORE UPDATE ON educations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- One live OTP per email, matching the canister's single-slot behaviour.
-- Keyed by email rather than user_id because signup issues an OTP before any
-- user row is confirmed.
CREATE TABLE otp_codes (
  email      CITEXT PRIMARY KEY,
  code       TEXT        NOT NULL,
  attempts   INTEGER     NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_codes_expires ON otp_codes (expires_at);


-- Only the hash is stored: a leaked table must not yield usable reset links.
CREATE TABLE password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens (expires_at);
