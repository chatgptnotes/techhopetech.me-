-- DevOps stage 5 — leaves calendar + retrospective.
-- Run once in the Supabase SQL editor (Project: bvaefzcsgtgqwftczixb).
--
-- Adds two new tables:
--   1. dev_resource_leaves — per-developer time off (vacation, sick, public-holiday)
--      so the calendar can show actual availability against sprint dates.
--   2. dev_retros — Four L's retrospective (Liked / Learned / Lacked / Longed for)
--      one row per sprint, each L stored as a JSONB array of notes.

-- ── 1. Resource leaves ────────────────────────────────────────────────────────
create table if not exists dev_resource_leaves (
  id          uuid primary key default gen_random_uuid(),
  dev_id      uuid not null references developers(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  type        text not null default 'vacation',  -- vacation | sick | public-holiday | personal | training
  note        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists dev_leaves_dev_idx   on dev_resource_leaves (dev_id, start_date);
create index if not exists dev_leaves_dates_idx on dev_resource_leaves (start_date, end_date);

alter table dev_resource_leaves enable row level security;
drop policy if exists "dev_leaves_anon_all" on dev_resource_leaves;
create policy "dev_leaves_anon_all" on dev_resource_leaves for all to anon using (true) with check (true);

-- ── 2. Four-L's retrospectives ────────────────────────────────────────────────
-- Each L is a jsonb array of objects: { text: string, author: string, ts: ISO-string }
create table if not exists dev_retros (
  id          uuid primary key default gen_random_uuid(),
  sprint_id   text not null references dev_sprints(id) on delete cascade unique,
  liked       jsonb not null default '[]'::jsonb,
  learned     jsonb not null default '[]'::jsonb,
  lacked      jsonb not null default '[]'::jsonb,
  longed_for  jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists dev_retros_sprint_idx on dev_retros (sprint_id);

drop trigger if exists set_dev_retros_updated_at on dev_retros;
create trigger set_dev_retros_updated_at
  before update on dev_retros
  for each row execute function update_updated_at();

alter table dev_retros enable row level security;
drop policy if exists "dev_retros_anon_all" on dev_retros;
create policy "dev_retros_anon_all" on dev_retros for all to anon using (true) with check (true);

-- Verify:
--   select count(*) from dev_resource_leaves;   -- expect 0
--   select count(*) from dev_retros;            -- expect 0
