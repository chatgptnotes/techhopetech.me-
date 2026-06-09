-- BNI 121 Google Calendar sync — schema additions.
--
-- Safe to paste into the Supabase SQL editor on the live project; idempotent.
-- Adds:
--   1. bni_members          — per-host OAuth credentials (multi-member ready)
--   2. bni_appointments.host_member_id (FK)  — which member hosts this 121
--   3. bni_appointments.gcal_event_id        — Google Calendar event id (sync marker)
--   4. bni_appointments.gcal_error           — permanent-error marker (skip retries)
--   5. Partial index on (gcal_event_id IS NULL AND gcal_error IS NULL)
--   6. RLS — anon may read public columns only; service_role full access.
--   7. Seed row for Dr. Murali (credentials filled in by scripts/gcal_auth.py).

-- ── 1. bni_members ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bni_members (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  email                text NOT NULL UNIQUE,
  gcal_calendar_id     text NOT NULL DEFAULT 'primary',
  gcal_client_id       text,
  gcal_client_secret   text,
  gcal_refresh_token   text,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── 2-4. bni_appointments columns ───────────────────────────────────────────
ALTER TABLE bni_appointments
  ADD COLUMN IF NOT EXISTS host_member_id uuid REFERENCES bni_members(id);

ALTER TABLE bni_appointments
  ADD COLUMN IF NOT EXISTS gcal_event_id text;

ALTER TABLE bni_appointments
  ADD COLUMN IF NOT EXISTS gcal_error text;

-- ── 5. Partial index for cron-worker scan ───────────────────────────────────
CREATE INDEX IF NOT EXISTS bni_appointments_gcal_pending_idx
  ON bni_appointments (date)
  WHERE gcal_event_id IS NULL AND gcal_error IS NULL;

-- ── 6. RLS on bni_members ───────────────────────────────────────────────────
ALTER TABLE bni_members ENABLE ROW LEVEL SECURITY;

-- Anon role: read non-secret columns of active members only (for future host-picker UI).
DROP POLICY IF EXISTS "bni_members anon public read" ON bni_members;
CREATE POLICY "bni_members anon public read" ON bni_members
  FOR SELECT
  TO anon
  USING (active = true);

-- service_role bypasses RLS automatically (it's the default for Supabase service-role key),
-- so no explicit policy is needed for the Edge Function / worker.
-- The anon policy above does NOT scope columns — column-level protection is enforced via
-- the API-level "Exposed columns" setting in Supabase OR by never SELECTing the secret
-- columns from the browser. The Edge Function + cron worker use service_role and bypass RLS.
--
-- To harden further, revoke column privileges on the secrets from anon:
REVOKE SELECT (gcal_client_id, gcal_client_secret, gcal_refresh_token) ON bni_members FROM anon;

-- ── 7. Seed Dr. Murali ──────────────────────────────────────────────────────
-- Credentials are NULL here on purpose; populated by `scripts/gcal_auth.py --member-email`.
INSERT INTO bni_members (name, email, gcal_calendar_id)
VALUES ('Dr. BK Murali', 'cmd@hopehospital.com', 'primary')
ON CONFLICT (email) DO NOTHING;
