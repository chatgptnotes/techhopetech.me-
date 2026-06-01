-- Members on the handwritten team lists (Apr 2026) that are not yet in
-- bni_contacts. Run after migrations_apply.sql in Supabase SQL editor.

insert into bni_contacts (id, first, last, company, phone, email, status, chapter, city, segment, notes) values
  ('cteam_b_alifiya', 'Alifiya', 'Bandukwala',   '', '', '', 'Identified', '', '', 'Other',     'Listed in Ruchi (Team B) handwritten roster, Apr 2026.'),
  ('cteam_c_binita',  'Binita',  'Gandhi',       '', '', '', 'Identified', '', '', 'Other',     'Listed in Team C handwritten roster, Apr 2026.'),
  ('cteam_c_aarthy',  'Aarthy',  'Rajagopalan',  '', '', '', 'Identified', '', '', 'Other',     'Listed in Team C handwritten roster, Apr 2026.'),
  ('cteam_d_amos',    'Amos',    'Gitau',        '', '', '', 'Identified', '', '', 'Other',     'Listed in Team D handwritten roster, Apr 2026.')
on conflict (id) do nothing;
