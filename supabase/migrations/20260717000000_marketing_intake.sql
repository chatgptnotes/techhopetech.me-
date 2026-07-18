-- Public marketing booking fields and one booking per time slot.
alter table bni_contacts add column if not exists source text;
alter table bni_contacts add column if not exists campaign text;
alter table bni_contacts add column if not exists landing_page text;
alter table bni_contacts add column if not exists consent_at timestamptz;
alter table bni_appointments add column if not exists source text;
alter table bni_appointments add column if not exists campaign text;
alter table bni_appointments add column if not exists landing_page text;
alter table bni_appointments add column if not exists consent_at timestamptz;
create unique index if not exists bni_appointments_date_time_unique on bni_appointments (date, time);
