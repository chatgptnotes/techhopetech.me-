-- BNI 121 — create bni_proposals (proposal approvals workflow).
-- proposals.html reads this table and tracker.html submits into it; it was
-- never created on the VPS Postgres (PostgREST returns PGRST205).
--
-- Run ONCE on the VPS:
--   sudo -u postgres psql -d <dbname> -f /var/www/bni/migrations_bni_proposals.sql

CREATE TABLE IF NOT EXISTS bni_proposals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     text,
  assignee_id    text,
  title          text NOT NULL,
  notes          text,
  file_url       text,
  file_name      text,
  file_size      bigint,
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
  reviewer_notes text,
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at    timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON bni_proposals TO web_anon;

-- Defensive: settings.html now writes personalization keys (my_phone etc.)
-- into bni_settings; the table exists but has never been written to via the
-- web role, so make sure the grants are in place.
GRANT SELECT, INSERT, UPDATE, DELETE ON bni_settings TO web_anon;

NOTIFY pgrst, 'reload schema';
