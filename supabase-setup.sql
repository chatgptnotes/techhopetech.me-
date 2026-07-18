-- BNI 121 — Supabase schema
-- Run this in: supabase.com → ssmdztkqfvgqajzggwjp → SQL Editor

CREATE TABLE IF NOT EXISTS bni_contacts (
  id          TEXT PRIMARY KEY,
  first       TEXT NOT NULL DEFAULT '',
  last        TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  segment     TEXT NOT NULL DEFAULT 'Other',
  status      TEXT NOT NULL DEFAULT 'Identified',
  notes       TEXT NOT NULL DEFAULT '',
  chapter     TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bni_contacts ADD COLUMN IF NOT EXISTS source       TEXT;
ALTER TABLE bni_contacts ADD COLUMN IF NOT EXISTS campaign     TEXT;
ALTER TABLE bni_contacts ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE bni_contacts ADD COLUMN IF NOT EXISTS consent_at   TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS bni_contact_details (
  contact_id   TEXT PRIMARY KEY,
  followups    JSONB NOT NULL DEFAULT '[]',
  next_date    DATE,
  linkedin     TEXT NOT NULL DEFAULT '',
  website      TEXT NOT NULL DEFAULT '',
  about        TEXT NOT NULL DEFAULT '',
  priority     TEXT NOT NULL DEFAULT 'Normal',
  actions      JSONB NOT NULL DEFAULT '[]',
  photo        TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  meetmode     TEXT NOT NULL DEFAULT '',
  proposal     TEXT NOT NULL DEFAULT '',
  conversation TEXT NOT NULL DEFAULT '',
  pdfs         JSONB NOT NULL DEFAULT '[]',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: allow anon key full access (personal tool, password-gated in UI)
ALTER TABLE bni_contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bni_contact_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bni_contacts_anon_all"        ON bni_contacts        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "bni_contact_details_anon_all" ON bni_contact_details FOR ALL TO anon USING (true) WITH CHECK (true);
