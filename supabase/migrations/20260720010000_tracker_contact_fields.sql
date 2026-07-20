-- Contact Tracker fields that were present in the UI but missing from the
-- canonical contacts table. Keep these on bni_contacts because the tracker
-- reads and writes contacts as a single row.
alter table public.bni_contacts
  add column if not exists website text not null default '',
  add column if not exists specialty text not null default '',
  add column if not exists meeting_date text not null default '';

notify pgrst, 'reload schema';
