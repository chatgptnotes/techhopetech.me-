-- Run this once in the Supabase SQL editor (Project: ssmdztkqfvgqajzggwjp)
-- to fix the "Detail save failed: Could not find the column …" error,
-- and to support the new profile status bar.

-- ── proposal tracking columns (already in schema.sql but never applied to DB) ──
alter table bni_contact_details add column if not exists financial_proposal_sent_at  timestamptz;
alter table bni_contact_details add column if not exists technical_proposal_sent_at  timestamptz;
alter table bni_contact_details add column if not exists commercial_proposal_sent_at timestamptz;
alter table bni_contact_details add column if not exists financial_proposal_url      text not null default '';
alter table bni_contact_details add column if not exists technical_proposal_url      text not null default '';
alter table bni_contact_details add column if not exists commercial_proposal_url     text not null default '';

-- ── new: meeting outcome + proposal reply tracking for header status bar ──
alter table bni_contact_details add column if not exists meeting_outcome             text;
-- meeting_outcome values: 'completed' | 'rescheduled' | 'no_show' | null
alter table bni_contact_details add column if not exists proposal_reply_received_at  timestamptz;

-- ── sentiment of the BNI member (manually set or AI-derived) ──
alter table bni_contact_details add column if not exists sentiment                   text;
-- sentiment values: 'positive' | 'neutral' | 'negative' | null
alter table bni_contact_details add column if not exists sentiment_note              text not null default '';

-- ── team assignment (Team A / B / C / D) on bni_contacts ──
alter table bni_contacts add column if not exists team text;
-- team values: 'A' | 'B' | 'C' | 'D' | null

-- ── referral graph: who referred whom ──
alter table bni_contacts add column if not exists referred_by_id text references bni_contacts(id) on delete set null;
alter table bni_contacts add column if not exists referred_to    text not null default '';   -- comma-separated names of people the contact has referred TO Murali (free-text; can also be ids when linked)
create index if not exists bni_contacts_referred_by_idx on bni_contacts (referred_by_id);

-- ── WhatsApp drip scheduler ────────────────────────────────────────────────
create table if not exists bni_drip_schedule (
  id            uuid primary key default gen_random_uuid(),
  contact_id    text not null references bni_contacts(id) on delete cascade,
  template_id   text not null,
  scheduled_at  timestamptz not null,
  sent_at       timestamptz,
  cancelled_at  timestamptz,
  channel       text not null default 'WhatsApp',
  body_preview  text not null default '',
  error         text,
  created_by    text,
  created_at    timestamptz not null default now()
);
create index if not exists bni_drip_due_idx
  on bni_drip_schedule (scheduled_at)
  where sent_at is null and cancelled_at is null;
create index if not exists bni_drip_contact_idx on bni_drip_schedule (contact_id);

alter table bni_drip_schedule enable row level security;
drop policy if exists "bni_drip_anon_all" on bni_drip_schedule;
create policy "bni_drip_anon_all" on bni_drip_schedule for all to anon using (true) with check (true);

-- ── Zoom webhook audit log ─────────────────────────────────────────────────
create table if not exists bni_zoom_events (
  id                 uuid primary key default gen_random_uuid(),
  event_type         text not null,
  host_email         text,
  topic              text,
  matched_contact_id text,
  raw                jsonb,
  received_at        timestamptz not null default now()
);
create index if not exists bni_zoom_events_received_idx on bni_zoom_events (received_at desc);
alter table bni_zoom_events enable row level security;
drop policy if exists "bni_zoom_anon_all" on bni_zoom_events;
create policy "bni_zoom_anon_all" on bni_zoom_events for all to anon using (true) with check (true);

-- ── Engineering management (Azure DevOps clone) ───────────────────────────
create table if not exists dev_projects (
  id          text primary key,
  name        text not null,
  description text not null default '',
  color       text not null default '#1e40af',
  hidden      boolean not null default false,
  created_at  timestamptz default now()
);

create table if not exists dev_work_items (
  id           text primary key,
  project_id   text references dev_projects(id) on delete cascade,
  parent_id    text references dev_work_items(id) on delete set null,
  type         text not null default 'Task',
  title        text not null,
  description  text not null default '',
  state        text not null default 'To Do',
  priority     text not null default 'Medium',
  points       integer,
  assignee_id  uuid references developers(id) on delete set null,
  reporter_id  uuid references developers(id) on delete set null,
  tags         text[] not null default '{}',
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists dev_work_items_proj_state_idx on dev_work_items (project_id, state);
create index if not exists dev_work_items_assignee_idx   on dev_work_items (assignee_id);
create index if not exists dev_work_items_priority_idx   on dev_work_items (priority);

drop trigger if exists set_dev_work_items_updated_at on dev_work_items;
create trigger set_dev_work_items_updated_at
  before update on dev_work_items
  for each row execute function update_updated_at();

create table if not exists dev_comments (
  id           uuid primary key default gen_random_uuid(),
  item_id      text not null references dev_work_items(id) on delete cascade,
  author_id    uuid references developers(id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists dev_comments_item_idx on dev_comments (item_id, created_at);

create table if not exists dev_history (
  id           uuid primary key default gen_random_uuid(),
  item_id      text not null references dev_work_items(id) on delete cascade,
  field        text not null,
  old_value    text,
  new_value    text,
  changed_by   uuid references developers(id) on delete set null,
  changed_at   timestamptz not null default now()
);
create index if not exists dev_history_item_idx on dev_history (item_id, changed_at desc);

alter table dev_projects   enable row level security;
alter table dev_work_items enable row level security;
alter table dev_comments   enable row level security;
alter table dev_history    enable row level security;
drop policy if exists "dev_proj_anon_all"     on dev_projects;
drop policy if exists "dev_items_anon_all"    on dev_work_items;
drop policy if exists "dev_comments_anon_all" on dev_comments;
drop policy if exists "dev_history_anon_all"  on dev_history;
create policy "dev_proj_anon_all"     on dev_projects   for all to anon using (true) with check (true);
create policy "dev_items_anon_all"    on dev_work_items for all to anon using (true) with check (true);
create policy "dev_comments_anon_all" on dev_comments   for all to anon using (true) with check (true);
create policy "dev_history_anon_all"  on dev_history    for all to anon using (true) with check (true);

-- Seed default projects so the boards page has something to show on first load.
insert into dev_projects (id, name, color) values
  ('p_bni',      'BNI 121 CRM',     '#1e40af'),
  ('p_drmhope',  'DrM Hope HMS',    '#7c3aed'),
  ('p_general',  'General Tasks',   '#0ea5e9')
on conflict (id) do nothing;

-- ── Stage 2: sprints + git refs on work items ─────────────────────────────
create table if not exists dev_sprints (
  id          text primary key,
  project_id  text references dev_projects(id) on delete cascade,
  name        text not null,
  goal        text not null default '',
  start_date  date not null,
  end_date    date not null,
  state       text not null default 'planned',     -- planned | active | completed
  created_at  timestamptz not null default now()
);
create index if not exists dev_sprints_proj_idx on dev_sprints (project_id, start_date);

alter table dev_work_items add column if not exists sprint_id text references dev_sprints(id) on delete set null;
alter table dev_work_items add column if not exists git_refs  text[] not null default '{}';
create index if not exists dev_work_items_sprint_idx on dev_work_items (sprint_id);

alter table dev_sprints enable row level security;
drop policy if exists "dev_sprints_anon_all" on dev_sprints;
create policy "dev_sprints_anon_all" on dev_sprints for all to anon using (true) with check (true);

-- ── Stage 3: dependencies + saved queries ─────────────────────────────────
create table if not exists dev_dependencies (
  from_id  text not null references dev_work_items(id) on delete cascade,
  to_id    text not null references dev_work_items(id) on delete cascade,
  type     text not null default 'blocks',   -- blocks | relates-to | duplicates
  created_at timestamptz not null default now(),
  primary key (from_id, to_id, type)
);
create index if not exists dev_deps_to_idx on dev_dependencies (to_id);

alter table dev_dependencies enable row level security;
drop policy if exists "dev_deps_anon_all" on dev_dependencies;
create policy "dev_deps_anon_all" on dev_dependencies for all to anon using (true) with check (true);

-- ── Stage 4: attachments + worklog + saved queries ────────────────────────
create table if not exists dev_attachments (
  id            uuid primary key default gen_random_uuid(),
  item_id       text not null references dev_work_items(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  url           text not null,
  size_bytes    bigint,
  mime_type     text,
  uploaded_by   uuid references developers(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists dev_attachments_item_idx on dev_attachments (item_id, created_at);

create table if not exists dev_worklog (
  id          uuid primary key default gen_random_uuid(),
  item_id     text not null references dev_work_items(id) on delete cascade,
  user_id     uuid references developers(id) on delete set null,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  minutes     integer,
  notes       text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists dev_worklog_item_idx on dev_worklog (item_id, started_at);
create index if not exists dev_worklog_active_idx on dev_worklog (user_id) where ended_at is null;

create table if not exists dev_queries (
  id           text primary key,
  project_id   text references dev_projects(id) on delete cascade,
  name         text not null,
  filter_json  jsonb not null default '{}',
  owner_id     uuid references developers(id) on delete set null,
  shared       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists dev_queries_proj_idx on dev_queries (project_id);

alter table dev_attachments enable row level security;
alter table dev_worklog     enable row level security;
alter table dev_queries     enable row level security;
drop policy if exists "dev_attachments_anon_all" on dev_attachments;
drop policy if exists "dev_worklog_anon_all"     on dev_worklog;
drop policy if exists "dev_queries_anon_all"     on dev_queries;
create policy "dev_attachments_anon_all" on dev_attachments for all to anon using (true) with check (true);
create policy "dev_worklog_anon_all"     on dev_worklog     for all to anon using (true) with check (true);
create policy "dev_queries_anon_all"     on dev_queries     for all to anon using (true) with check (true);

-- Storage bucket for attachments + open RLS so anon can upload/read.
insert into storage.buckets (id, name, public)
  values ('dev-attachments', 'dev-attachments', true)
  on conflict (id) do nothing;

drop policy if exists "dev-attachments anon read"   on storage.objects;
drop policy if exists "dev-attachments anon insert" on storage.objects;
drop policy if exists "dev-attachments anon delete" on storage.objects;
create policy "dev-attachments anon read"   on storage.objects for select to anon using (bucket_id = 'dev-attachments');
create policy "dev-attachments anon insert" on storage.objects for insert to anon with check (bucket_id = 'dev-attachments');
create policy "dev-attachments anon delete" on storage.objects for delete to anon using (bucket_id = 'dev-attachments');

-- ── Stage 5: per-project PRT (Project Requirements Tracker) PDF ───────────
alter table dev_projects add column if not exists prt_url          text;
alter table dev_projects add column if not exists prt_name         text;
alter table dev_projects add column if not exists prt_size         bigint;
alter table dev_projects add column if not exists prt_storage_path text;
alter table dev_projects add column if not exists prt_uploaded_at  timestamptz;

-- Tell PostgREST to reload its schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
