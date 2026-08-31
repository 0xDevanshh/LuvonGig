-- Job posts and proposals.
-- Ported from ../backend/canisters/job_marketplace.mo.
--
-- The canister encoded the assignee inside the status variant
-- (#ASSIGNED: UserId), which made "is this job open?" and "who has it?" the
-- same field. Split here into `status` and `freelancer_id`, with a constraint
-- keeping them consistent.

CREATE TYPE job_status  AS ENUM ('open', 'closed', 'assigned', 'completed', 'paid');
CREATE TYPE budget_type AS ENUM ('fixed', 'hourly');
CREATE TYPE proposal_status AS ENUM ('pending', 'shortlisted', 'rejected', 'accepted');


CREATE TABLE job_posts (
  id           TEXT PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  required_skills TEXT[] NOT NULL DEFAULT '{}',

  budget_type   budget_type NOT NULL DEFAULT 'fixed',
  budget_minor  BIGINT  NOT NULL DEFAULT 0 CHECK (budget_minor >= 0),
  currency      CHAR(3) NOT NULL DEFAULT 'USD',

  status        job_status NOT NULL DEFAULT 'open',
  freelancer_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  is_paid       BOOLEAN NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,

  client_review TEXT,
  client_rating NUMERIC(2,1) CHECK (client_rating IS NULL OR client_rating BETWEEN 1 AND 5),

  price_needs_review BOOLEAN NOT NULL DEFAULT false,
  legacy_budget_raw  BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A job past 'open' must name who is doing it; an open job must not.
  CONSTRAINT job_assignment_consistent CHECK (
    (status = 'open'  AND freelancer_id IS NULL) OR
    (status = 'closed') OR
    (status IN ('assigned', 'completed', 'paid') AND freelancer_id IS NOT NULL)
  ),
  CONSTRAINT job_parties_differ CHECK (freelancer_id IS NULL OR freelancer_id <> client_id)
);

CREATE INDEX idx_jobs_client     ON job_posts (client_id, created_at DESC);
CREATE INDEX idx_jobs_freelancer ON job_posts (freelancer_id) WHERE freelancer_id IS NOT NULL;
CREATE INDEX idx_jobs_open       ON job_posts (created_at DESC) WHERE status = 'open';
CREATE INDEX idx_jobs_skills     ON job_posts USING gin (required_skills);
CREATE INDEX idx_jobs_search     ON job_posts
  USING gin ((title || ' ' || description) gin_trgm_ops) WHERE status = 'open';

CREATE TRIGGER job_posts_updated_at BEFORE UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE proposals (
  id            TEXT PRIMARY KEY,
  job_id        TEXT NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  freelancer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  cover_letter  TEXT NOT NULL DEFAULT '',
  bid_minor     BIGINT  NOT NULL CHECK (bid_minor >= 0),
  currency      CHAR(3) NOT NULL DEFAULT 'USD',
  estimated_delivery_days INTEGER NOT NULL DEFAULT 1 CHECK (estimated_delivery_days > 0),

  status        proposal_status NOT NULL DEFAULT 'pending',

  price_needs_review BOOLEAN NOT NULL DEFAULT false,
  legacy_bid_raw     BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One bid per freelancer per job. The canister permitted duplicates.
  UNIQUE (job_id, freelancer_id)
);

CREATE INDEX idx_proposals_job        ON proposals (job_id, created_at DESC);
CREATE INDEX idx_proposals_freelancer ON proposals (freelancer_id, created_at DESC);
-- At most one accepted proposal per job.
CREATE UNIQUE INDEX idx_proposals_one_accepted
  ON proposals (job_id) WHERE status = 'accepted';

CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
