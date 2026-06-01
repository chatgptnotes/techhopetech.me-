-- migrations_team_persist.sql
-- Fix: team-builder member phone/notes + drag-order were saved only to the
-- browser's localStorage, so they vanished across devices/reloads. Move them
-- into the database (developers + dev_team_config).
--
-- ⚠️  RUN THIS ON THE VPS PostgreSQL (the DB behind https://hopetech.me/rest),
--     NOT in the Supabase cloud project — the web app's tables live on the VPS.

-- Per-member contact fields (the developers table already holds team assignment)
alter table developers      add column if not exists mobile text;
alter table developers      add column if not exists notes  text;

-- Per-team member ordering (seniority). Stored as a JSON array of developer ids.
alter table dev_team_config add column if not exists member_order jsonb not null default '[]'::jsonb;

-- PostgREST caches the schema; tell it to reload so the new columns are queryable.
notify pgrst, 'reload schema';
