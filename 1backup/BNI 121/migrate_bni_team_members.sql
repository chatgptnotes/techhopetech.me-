CREATE TABLE IF NOT EXISTS bni_team_members (
  id           TEXT PRIMARY KEY,
  team         CHAR(1) NOT NULL CHECK (team IN ('A','B','C','D')),
  first        TEXT NOT NULL,
  last         TEXT,
  company      TEXT,
  phone        TEXT,
  email        TEXT,
  meeting_date DATE,
  meeting_time TIME,
  notes        TEXT,
  hidden       BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
NOTIFY pgrst, 'reload schema';
