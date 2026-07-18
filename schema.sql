-- BNI 121 Outreach — Unified Supabase Schema
-- Project: ssmdztkqfvgqajzggwjp
-- Merges System A (supabase-setup.sql) and System B (this project). Re-runnable.

-- ── contacts table (System A schema, canonical) ───────────────────────────────
create table if not exists bni_contacts (
  id          text primary key,
  first       text not null default '',
  last        text not null default '',
  company     text not null default '',
  city        text not null default '',
  phone       text not null default '',
  email       text not null default '',
  segment     text not null default 'Other',
  status      text not null default 'Identified',
  notes       text not null default '',
  chapter     text not null default '',
  tenure      text,
  hidden      boolean not null default false,
  updated_at  timestamptz default now()
);

alter table bni_contacts add column if not exists tenure      text;
alter table bni_contacts add column if not exists hidden      boolean not null default false;
alter table bni_contacts add column if not exists assignee_id uuid;
alter table bni_contacts add column if not exists source       text;
alter table bni_contacts add column if not exists campaign     text;
alter table bni_contacts add column if not exists landing_page text;
alter table bni_contacts add column if not exists consent_at   timestamptz;

-- ── rich per-contact detail (from System A) ───────────────────────────────────
create table if not exists bni_contact_details (
  contact_id   text primary key references bni_contacts(id) on delete cascade,
  followups    jsonb not null default '[]',
  next_date    date,
  linkedin     text not null default '',
  website      text not null default '',
  about        text not null default '',
  priority     text not null default 'Normal',
  actions      jsonb not null default '[]',
  photo        text not null default '',
  address      text not null default '',
  meetmode     text not null default '',
  proposal     text not null default '',
  conversation text not null default '',
  pdfs         jsonb not null default '[]',
  updated_at   timestamptz default now()
);

-- ── developers / team (already populated; referenced by assignee_id) ──────────
create table if not exists developers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null default '',
  created_at timestamptz default now()
);

-- ── appointments / meetings (System B — canonical for scheduled calls) ────────
create table if not exists bni_appointments (
  id               text primary key,
  contact_id       text references bni_contacts(id) on delete set null,
  contact_name     text,
  company          text,
  date             date,
  time             text,
  medium           text default 'Zoom',
  phone            text,
  email            text,
  industry         text,
  bni_status       text,
  goal             text,
  meeting_held     text,          -- 'yes' | 'no_show' | 'rescheduled' | null
  followup_sent_at timestamptz,
  outcome          text,          -- 'warm' | 'converted' | 'cold' | 'not_fit' | null
  followup_notes   text,
  assignee_id      uuid,
  created_at       timestamptz default now()
);

alter table bni_appointments add column if not exists meeting_held     text;
alter table bni_appointments add column if not exists followup_sent_at timestamptz;
alter table bni_appointments add column if not exists outcome          text;
alter table bni_appointments add column if not exists followup_notes   text;
alter table bni_appointments add column if not exists assignee_id      uuid;
alter table bni_appointments add column if not exists phone            text;
alter table bni_appointments add column if not exists email            text;
alter table bni_appointments add column if not exists industry         text;
alter table bni_appointments add column if not exists bni_status       text;
alter table bni_appointments add column if not exists goal             text;
alter table bni_appointments add column if not exists source           text;
alter table bni_appointments add column if not exists campaign         text;
alter table bni_appointments add column if not exists landing_page     text;
alter table bni_appointments add column if not exists consent_at       timestamptz;
create unique index if not exists bni_appointments_date_time_unique on bni_appointments (date, time);

-- ── FKs for assignee (idempotent) ─────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'bni_contacts_assignee_fk') then
    alter table bni_contacts
      add constraint bni_contacts_assignee_fk
      foreign key (assignee_id) references developers(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bni_appointments_assignee_fk') then
    alter table bni_appointments
      add constraint bni_appointments_assignee_fk
      foreign key (assignee_id) references developers(id) on delete set null;
  end if;
end $$;

-- ── updated_at auto-update ────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_contacts_updated_at on bni_contacts;
create trigger set_contacts_updated_at
  before update on bni_contacts
  for each row execute function update_updated_at();

drop trigger if exists set_contact_details_updated_at on bni_contact_details;
create trigger set_contact_details_updated_at
  before update on bni_contact_details
  for each row execute function update_updated_at();

-- ── RLS (anon full access — tool is password-gated in UI) ─────────────────────
alter table bni_contacts         enable row level security;
alter table bni_contact_details  enable row level security;
alter table bni_appointments     enable row level security;
alter table developers           enable row level security;

drop policy if exists "bni_contacts_anon_all"        on bni_contacts;
drop policy if exists "bni_contact_details_anon_all" on bni_contact_details;
drop policy if exists "bni_appointments_anon_all"    on bni_appointments;
drop policy if exists "developers_anon_all"          on developers;

create policy "bni_contacts_anon_all"        on bni_contacts         for all to anon using (true) with check (true);
create policy "bni_contact_details_anon_all" on bni_contact_details  for all to anon using (true) with check (true);
create policy "bni_appointments_anon_all"    on bni_appointments     for all to anon using (true) with check (true);
create policy "developers_anon_all"          on developers           for all to anon using (true) with check (true);
