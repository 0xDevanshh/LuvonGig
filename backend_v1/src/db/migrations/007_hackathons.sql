-- Hackathons: events, categories, rewards, participants, teams, submissions.
-- Ported from ../backend/canisters/hackquest.mo, which is the richest of the
-- four competing hackathon actors (hackathon.mo, hackathon_minimal.mo,
-- hackathon_simple.mo, hackquest.mo). This schema is the single consolidated
-- model all three route trees (/api/hackathon, /hackathons, /hackquest)
-- collapse onto in Phase 4.
--
-- IDENTITY CHANGE: hackquest keyed every actor by Principal — an IC identity
-- that stops existing when the canisters do. Participants become real users,
-- linked by the email hackquest already stored on Participant. The original
-- principal is kept in legacy_principal so the import can be reconciled and
-- the /api/hackquest/participants/email-to-principal routes can be retired.

CREATE TYPE hackathon_status  AS ENUM ('draft', 'upcoming', 'ongoing', 'judging', 'completed', 'cancelled');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'under_review', 'selected', 'rejected');


CREATE TABLE hackathons (
  id           TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  title        TEXT NOT NULL,
  tagline      TEXT NOT NULL DEFAULT '',
  summary      TEXT NOT NULL DEFAULT '',
  theme        TEXT NOT NULL DEFAULT '',
  location     TEXT NOT NULL DEFAULT '',

  banner_url     TEXT,
  hero_video_url TEXT,

  prize_pool_minor BIGINT  NOT NULL DEFAULT 0 CHECK (prize_pool_minor >= 0),
  currency         CHAR(3) NOT NULL DEFAULT 'USD',

  faq       TEXT[] NOT NULL DEFAULT '{}',
  resources TEXT[] NOT NULL DEFAULT '{}',

  min_team_size           INTEGER NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
  max_team_size           INTEGER NOT NULL DEFAULT 5 CHECK (max_team_size >= 1),
  max_teams_per_category  INTEGER NOT NULL DEFAULT 0 CHECK (max_teams_per_category >= 0),

  submissions_open_at  TIMESTAMPTZ,
  submissions_close_at TIMESTAMPTZ,
  start_at             TIMESTAMPTZ,
  end_at               TIMESTAMPTZ,

  status hackathon_status NOT NULL DEFAULT 'draft',

  legacy_organizer_principal TEXT,
  legacy_prize_pool_e8s      BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT team_size_range CHECK (max_team_size >= min_team_size),
  CONSTRAINT hackathon_dates_ordered CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
);

CREATE INDEX idx_hackathons_status    ON hackathons (status, start_at DESC);
CREATE INDEX idx_hackathons_organizer ON hackathons (organizer_id);

CREATE TRIGGER hackathons_updated_at BEFORE UPDATE ON hackathons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE hackathon_categories (
  id               TEXT PRIMARY KEY,
  hackathon_id     TEXT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  reward_slots     INTEGER NOT NULL DEFAULT 0 CHECK (reward_slots >= 0),
  judging_criteria TEXT[]  NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_hackathon ON hackathon_categories (hackathon_id);

CREATE TRIGGER hackathon_categories_updated_at BEFORE UPDATE ON hackathon_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Teams are declared before rewards so the reward's award FKs can reference them.
CREATE TABLE hackathon_teams (
  id            TEXT PRIMARY KEY,
  hackathon_id  TEXT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  category_id   TEXT REFERENCES hackathon_categories(id) ON DELETE SET NULL,

  name          TEXT NOT NULL,
  leader_id     TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  legacy_leader_principal TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (hackathon_id, name),
  -- Lets hackathon_team_members carry hackathon_id under a composite FK, so
  -- "one team per person per hackathon" can be a plain unique constraint.
  UNIQUE (id, hackathon_id)
);

CREATE INDEX idx_teams_hackathon ON hackathon_teams (hackathon_id, category_id);

CREATE TRIGGER hackathon_teams_updated_at BEFORE UPDATE ON hackathon_teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE hackathon_submissions (
  id           TEXT PRIMARY KEY,
  hackathon_id TEXT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  team_id      TEXT NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
  category_id  TEXT REFERENCES hackathon_categories(id) ON DELETE SET NULL,

  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  repo_url    TEXT,
  demo_url    TEXT,
  gallery     TEXT[] NOT NULL DEFAULT '{}',

  status       submission_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One submission per team. hackquest kept Team.submissionId as a back-link,
  -- which could disagree with the submission's own teamId; a unique FK here
  -- makes that disagreement impossible.
  UNIQUE (team_id)
);

CREATE INDEX idx_submissions_hackathon ON hackathon_submissions (hackathon_id, status);

CREATE TRIGGER hackathon_submissions_updated_at BEFORE UPDATE ON hackathon_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE hackathon_rewards (
  id           TEXT PRIMARY KEY,
  hackathon_id TEXT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  category_id  TEXT REFERENCES hackathon_categories(id) ON DELETE SET NULL,

  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rank        INTEGER NOT NULL DEFAULT 1 CHECK (rank >= 1),
  perks       TEXT[]  NOT NULL DEFAULT '{}',

  amount_minor BIGINT  NOT NULL DEFAULT 0 CHECK (amount_minor >= 0),
  currency     CHAR(3) NOT NULL DEFAULT 'USD',

  awarded_submission_id TEXT REFERENCES hackathon_submissions(id) ON DELETE SET NULL,
  awarded_team_id       TEXT REFERENCES hackathon_teams(id) ON DELETE SET NULL,
  awarded_by            TEXT REFERENCES users(id) ON DELETE SET NULL,
  awarded_at            TIMESTAMPTZ,
  note                  TEXT,

  legacy_amount_e8s BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_hackathon ON hackathon_rewards (hackathon_id, rank);

CREATE TRIGGER hackathon_rewards_updated_at BEFORE UPDATE ON hackathon_rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Global participant registry (hackquest's `Participant`, keyed by Principal).
CREATE TABLE hackathon_participants (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  legacy_principal TEXT UNIQUE
);


-- Which participants joined which event (hackquest's registerForHackathon).
CREATE TABLE hackathon_registrations (
  hackathon_id  TEXT NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (hackathon_id, user_id)
);

CREATE INDEX idx_registrations_user ON hackathon_registrations (user_id);


-- hackathon_id is carried here (rather than only via team_id) so that "one
-- team per person per hackathon" is a plain unique constraint. The composite
-- FK guarantees it always agrees with the team's own hackathon.
CREATE TABLE hackathon_team_members (
  team_id      TEXT NOT NULL,
  hackathon_id TEXT NOT NULL,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted     BOOLEAN NOT NULL DEFAULT false,
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  legacy_principal TEXT,

  PRIMARY KEY (team_id, user_id),

  FOREIGN KEY (team_id, hackathon_id)
    REFERENCES hackathon_teams (id, hackathon_id) ON DELETE CASCADE,

  -- hackquest enforced this in application code only, and not on every path.
  UNIQUE (hackathon_id, user_id)
);

CREATE INDEX idx_team_members_user ON hackathon_team_members (user_id);
