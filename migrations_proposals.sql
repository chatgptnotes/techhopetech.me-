-- Run once in the live Supabase SQL editor.
-- Adds the proposal approval queue used by proposals.html and tracker.html.

create table if not exists bni_proposals (
  id             uuid primary key default gen_random_uuid(),
  contact_id     text not null references bni_contacts(id) on delete cascade,
  assignee_id    uuid,
  title          text not null default '',
  notes          text,
  file_url       text,
  file_name      text,
  file_size      bigint,
  status         text not null default 'pending',
  reviewer_notes text,
  submitted_at   timestamptz not null default now(),
  reviewed_at    timestamptz
);

alter table bni_proposals enable row level security;
drop policy if exists "bni_proposals_anon_all" on bni_proposals;
create policy "bni_proposals_anon_all" on bni_proposals
  for all to anon using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('proposals', 'proposals', true)
on conflict (id) do nothing;

drop policy if exists "proposal_files_anon_read" on storage.objects;
create policy "proposal_files_anon_read" on storage.objects
  for select to anon using (bucket_id = 'proposals');

drop policy if exists "proposal_files_anon_upload" on storage.objects;
create policy "proposal_files_anon_upload" on storage.objects
  for insert to anon with check (bucket_id = 'proposals');
