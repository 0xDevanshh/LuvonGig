-- Chat, deliverables, experts, and usage metering.
--
-- These are the areas that ALREADY used Postgres, defined in
-- frontend/lib/db/chat-db.ts, deliverables-db.ts and expert-db.ts via
-- `CREATE TABLE IF NOT EXISTS` at runtime. They are redefined here rather than
-- adopted as-is because that pattern left them without a single foreign key,
-- keyed by VARCHAR(255) email, and unable to express any later column change.
--
-- This database is empty, so nothing is being migrated in place. If chat data
-- exists in a DIFFERENT Postgres instance, it must be exported and imported
-- like the canister data — see the note at the bottom of this file.

CREATE TABLE chat_relationships (
  id              TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id      TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  service_id      TEXT REFERENCES services(id) ON DELETE SET NULL,
  package_id      TEXT REFERENCES service_packages(id) ON DELETE SET NULL,
  service_title   TEXT,
  booking_status  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chat_parties_differ CHECK (client_id <> freelancer_id)
);

-- One conversation per booking per pair. NULLS NOT DISTINCT so the
-- booking-less (direct) conversation between two people is also unique —
-- plain UNIQUE would treat every NULL booking_id as distinct and allow
-- unlimited duplicates, which the original table did.
CREATE UNIQUE INDEX idx_chat_rel_unique
  ON chat_relationships (client_id, freelancer_id, booking_id) NULLS NOT DISTINCT;

CREATE INDEX idx_chat_rel_client     ON chat_relationships (client_id);
CREATE INDEX idx_chat_rel_freelancer ON chat_relationships (freelancer_id);

CREATE TRIGGER chat_relationships_updated_at BEFORE UPDATE ON chat_relationships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE chat_messages (
  id            TEXT PRIMARY KEY,
  from_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id    TEXT REFERENCES bookings(id) ON DELETE SET NULL,

  body          TEXT NOT NULL,
  message_type  TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),

  file_url      TEXT,
  file_name     TEXT,
  file_size     BIGINT CHECK (file_size IS NULL OR file_size >= 0),

  reply_to      TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,

  delivered     BOOLEAN NOT NULL DEFAULT false,
  read_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT message_parties_differ CHECK (from_user_id <> to_user_id)
);

-- Serves a conversation in either direction from one index.
CREATE INDEX idx_messages_pair ON chat_messages
  (LEAST(from_user_id, to_user_id), GREATEST(from_user_id, to_user_id), created_at DESC);
CREATE INDEX idx_messages_unread ON chat_messages (to_user_id) WHERE read_at IS NULL;
CREATE INDEX idx_messages_booking ON chat_messages (booking_id, created_at DESC)
  WHERE booking_id IS NOT NULL;


CREATE TABLE deliverables (
  id          TEXT PRIMARY KEY,
  booking_id  TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stage_id    TEXT REFERENCES booking_stages(id) ON DELETE SET NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_size   BIGINT CHECK (file_size IS NULL OR file_size >= 0),
  file_type   TEXT,
  note        TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliverables_booking ON deliverables (booking_id, created_at DESC);


CREATE TABLE project_status_history (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_booking ON project_status_history (booking_id, created_at DESC);


CREATE TABLE experts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  headline      TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  expertise     TEXT[] NOT NULL DEFAULT '{}',

  hourly_rate_minor BIGINT  NOT NULL DEFAULT 0 CHECK (hourly_rate_minor >= 0),
  currency          CHAR(3) NOT NULL DEFAULT 'USD',

  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_experts_active    ON experts (is_active) WHERE is_active;
CREATE INDEX idx_experts_expertise ON experts USING gin (expertise);

CREATE TRIGGER experts_updated_at BEFORE UPDATE ON experts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE expert_bookings (
  id          TEXT PRIMARY KEY,
  expert_id   TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  client_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  scheduled_at   TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),

  amount_minor BIGINT  NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency     CHAR(3) NOT NULL DEFAULT 'USD',

  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes       TEXT,
  meeting_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expert_bookings_expert ON expert_bookings (expert_id, scheduled_at DESC);
CREATE INDEX idx_expert_bookings_client ON expert_bookings (client_id, scheduled_at DESC);

CREATE TRIGGER expert_bookings_updated_at BEFORE UPDATE ON expert_bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Connects / message quota metering. Was keyed by email with no FK.
CREATE TABLE user_usage (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan                 TEXT    NOT NULL DEFAULT 'Basic',
  connects             INTEGER NOT NULL DEFAULT 30 CHECK (connects >= 0),
  daily_messages_count INTEGER NOT NULL DEFAULT 0 CHECK (daily_messages_count >= 0),
  last_message_reset   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_connects_reset  TIMESTAMPTZ NOT NULL DEFAULT now(),
  plan_expires_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_usage_updated_at BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE connects_history (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount           INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'addition', 'upgrade', 'reset')),
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connects_history_user ON connects_history (user_id, created_at DESC);
