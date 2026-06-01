-- BM Confirmed Meetings — bulk insert of members reported in WhatsApp group
-- (BNI 121 dev team meeting reports, April 2026).
-- Run AFTER migrations_apply.sql, in the Supabase SQL editor.
-- Idempotent: re-running will not duplicate rows (ON CONFLICT DO NOTHING).
-- All entries land as status = 'Met' so they appear as cards in
-- Zoom Meetings Done. The next_date / meeting_time go into bni_contact_details.

-- ── 1. Insert into bni_contacts ──────────────────────────────────────────────
insert into bni_contacts (id, first, last, company, phone, email, status, chapter, city, segment, notes) values
  ('cwa01', 'Shivam',     'Bajaj',          'Multi Speciality Dental Clinics',           '9467602313',     '',                              'Met', '', 'Gurgaon',   'Healthcare',           'Multi Speciality Dental clinics. Gurgaon. Reported by Sonam Sharnagat.'),
  ('cwa02', 'Yogesh',     'Waghmare',       '',                                          '9823943035',     '',                              'Met', '', '',          'Other',                'Electrical contractor and consultant. Reported by Abhishek Raisoni.'),
  ('cwa03', 'Chetan',     'Dixit',          '',                                          '9822216659',     '',                              'Met', '', '',          'Other',                'Electrical contractor and consultant. Reported by Abhishek Raisoni.'),
  ('cwa04', 'Baskaran',   'Balasubramaniam','',                                          '9842226337',     '',                              'Met', '', '',          'Other',                'Manufacturing, machinery and equipment manufacturer. Reported by Ashray Drmhope.'),
  ('cwa05', 'Homyar',     'Dotiwala',       'Sun Sterifaab Pvt. Ltd.',                   '9099917451',     'hom@sunsterifaab.com',          'Met', '', 'Ahmedabad', 'Healthcare',           'BNI Ahmedabad. Sterilization services & equipment for pharma, medical-device makers, and hospitals. Reported by Palak Dongre.'),
  ('cwa06', 'Emile',      'Botha',          'IT & Networks',                             '+27 0130101212', '',                              'Met', '', '',          'AI / Tech',            'IT & Networks. Reported via Dr Murali B K.'),
  ('cwa07', 'Sagar',      'Khimsaria',      'Leonsemi Electronics',                      '9773854994',     '',                              'Met', '', '',          'Industrial Automation','Surgical equipment distributor (leonsemi electronics). Reported by Akshay Raisoni.'),
  ('cwa08', 'Ahmad',      'Khawar',         'Accline Corporate Services Ltd',            '+971526454826',  '',                              'Met', '', 'Dubai',     'Other',                'Legal & accounting, bookkeeping. Reported by Yatharth Raisoni.'),
  ('cwa09', 'Abraham',    'Linde',          '',                                          '+27 0720480990', 'abrahamvdl@gmail.com',          'Met', 'BNI Octane', '', 'AI / Tech',           'App developer. Reported by Yash Raisoni Deshmukh.'),
  ('cwa10', 'Senthil',    'Kumar',          'Infx Life Science',                         '7010476306',     'vlrsenthil1978@gmail.com',      'Met', '', '',          'Healthcare',           'Pharmaceutical company, 6 yrs in business and 26 yrs of industry experience. Reported by Ruchi Raisoni.'),
  ('cwa11', 'Abdul',      'Raheem',         'Realtor9',                                  '+971562319319',  'id-abdulrahim@realtor9.com',    'Met', '', 'Dubai',     'Other',                'Residential real estate services / agent. Reported by Yatharth Raisoni.'),
  ('cwa12', 'Suraj',      'Uttam',          'Shenoy Hospitals',                          '9963994540',     '',                              'Met', '', 'Hyderabad', 'Healthcare',           'Shenoy hospitals, East Marredpally. Reported by Roma Gehi (Physiotherapist 2022).'),
  ('cwa13', 'Abdul',      'Nadeem',         '',                                          '+971585192775',  '',                              'Met', '', 'Dubai',     'Other',                'Legal & accounting, business law. Reported by Yatharth Raisoni.'),
  ('cwa14', 'Viswanathan','Vishnu Vijay',   'Stepwise Health',                           '8428438434',     'drvvvj@gmail.com',              'Met', '', 'Chennai',   'Healthcare',           'Chennai-based doctor & diabetic care specialist (MV Diabetes). Stepwise Health: doctor-led footcare brand for diabetic patients. Reported by Palak Dongre.'),
  ('cwa15', 'K',          'Raam',           'Medlife',                                   '9063068921',     'raamabhinay@gmail.com',         'Met', '', '',          'AI / Tech',            'Medlife: healthcare software provider with modules for hospitals, labs and diagnosis. Reported by Akshay Raisoni.'),
  ('cwa16', 'Swapnil',    'Likhare',        'Health and Wellness Dentist',               '8177888684',     '',                              'Met', '', 'Pune',      'Healthcare',           'Health and Wellness dentist, Pune. Reported by Sonam Sharnagat.'),
  ('cwa17', 'Lokesh',     'Koshti',         'Packart Innovation',                        '9033331719',     'info@packartinnovation.com',    'Met', '', 'Ahmedabad', 'Other',                'Packart Innovation — corrugated and monocarton packaging for food, e-commerce and exports. Reported by Palak Dongre.')
on conflict (id) do nothing;

-- ── 2. Insert meeting date / time into bni_contact_details ──────────────────
insert into bni_contact_details (contact_id, next_date, meeting_time, about, sentiment) values
  ('cwa01', '2026-04-28', '12:00', 'Multi Speciality Dental Clinics, Gurgaon.',                                  'neutral'),
  ('cwa02', '2026-04-28', '11:30', 'Electrical contractor and consultant.',                                      'neutral'),
  ('cwa03', '2026-04-28', '11:30', 'Electrical contractor and consultant.',                                      'neutral'),
  ('cwa04', '2026-04-28', '16:00', 'Manufacturing, machinery and equipment manufacturer.',                       'neutral'),
  ('cwa05', '2026-04-30', '14:00', 'Sun Sterifaab Pvt. Ltd. — sterilization services for pharma & healthcare.',  'positive'),
  ('cwa06',  null,         null,   'IT & Networks contact (South Africa).',                                      'neutral'),
  ('cwa07', '2026-04-27', '17:00', 'Leonsemi electronics, surgical equipment distributor.',                      'neutral'),
  ('cwa08', '2026-04-28', '17:00', 'Accline corporate services ltd, legal & accounting, bookkeeping.',           'neutral'),
  ('cwa09', '2026-04-28', '11:00', 'App developer, BNI Octane.',                                                 'neutral'),
  ('cwa10', '2026-04-27', '14:00', 'Infx Life Science: pharmaceutical company, 6 yrs in business, 26 yrs exp.',  'positive'),
  ('cwa11', '2026-04-27', '16:00', 'Residential real estate services / agent.',                                  'neutral'),
  ('cwa12', '2026-04-27', '10:30', 'Shenoy hospitals, East Marredpally.',                                        'neutral'),
  ('cwa13', '2026-04-27', '11:30', 'Legal & accounting, business law (Dubai).',                                  'neutral'),
  ('cwa14', '2026-04-29', '16:00', 'Chennai-based doctor; MV Diabetes; Stepwise Health diabetic footcare brand.','positive'),
  ('cwa15', '2026-04-27', '15:00', 'Medlife: healthcare software for hospitals, labs and diagnosis.',            'positive'),
  ('cwa16', '2026-04-25', '12:00', 'Health and Wellness dentist, Pune.',                                         'neutral'),
  ('cwa17', '2026-04-27', '18:00', 'Packart Innovation: corrugated/monocarton packaging for food, e-com, export.','positive')
on conflict (contact_id) do nothing;
