-- Extensions the schema relies on.
--
-- citext  : case-insensitive email columns. The canisters keyed users by raw
--           Text, so "Devansh@x.com" and "devansh@x.com" were different users.
-- pg_trgm : trigram indexes for service search, replacing the hand-rolled
--           substring scan in ../backend/canisters/marketplace.mo searchServices.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Every table gets `updated_at`; this keeps it honest without app-side effort.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
