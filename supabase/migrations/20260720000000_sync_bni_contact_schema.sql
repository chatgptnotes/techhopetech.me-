-- Keep the live database aligned with the fields used by the BNI browser pages.
-- This migration is idempotent so it is safe to apply to an existing project.

-- Contact list/profile fields.
alter table public.bni_contacts
  add column if not exists phones jsonb not null default '[]'::jsonb,
  add column if not exists assignee_ids jsonb not null default '[]'::jsonb,
  add column if not exists tags jsonb not null default '[]'::jsonb;

-- Detail fields used by Zoom, dashboard, teams, contact profile, and webhook pages.
alter table public.bni_contact_details
  add column if not exists meeting_time text,
  add column if not exists zoom_recording_url text not null default '',
  add column if not exists zoom_transcript_url text not null default '',
  add column if not exists financial_proposal_sent_at timestamptz,
  add column if not exists technical_proposal_sent_at timestamptz,
  add column if not exists commercial_proposal_sent_at timestamptz,
  add column if not exists financial_proposal_url text not null default '',
  add column if not exists technical_proposal_url text not null default '',
  add column if not exists commercial_proposal_url text not null default '',
  add column if not exists meeting_outcome text,
  add column if not exists proposal_reply_received_at timestamptz,
  add column if not exists sentiment text,
  add column if not exists sentiment_note text not null default '';

-- Rebuild the PostgREST schema cache after the column changes.
notify pgrst, 'reload schema';
