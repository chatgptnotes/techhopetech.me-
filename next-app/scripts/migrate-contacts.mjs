import { createClient } from '@supabase/supabase-js';

const sourceUrl = process.env.OLD_API_URL || 'https://hopetech.me';
const sourceKey = process.env.OLD_API_KEY;
const targetUrl = process.env.SUPABASE_URL;
const targetKey = process.env.SUPABASE_KEY;

if (!sourceKey || !targetUrl || !targetKey) {
  console.error('Required: OLD_API_KEY, SUPABASE_URL, SUPABASE_KEY');
  process.exit(1);
}

const source = `${sourceUrl.replace(/\/$/, '')}/rest/v1/bni_contacts?select=*`;
const response = await fetch(source, {
  headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` },
});
if (!response.ok) {
  console.error(`Source backend failed: HTTP ${response.status} ${await response.text()}`);
  console.error('Restore the old backend or provide a database export before retrying.');
  process.exit(2);
}

const oldRows = await response.json();
const rows = oldRows.map((c) => ({
  id: c.id,
  first: c.first || '', last: c.last || '', company: c.company || '',
  city: c.city || '', phone: c.phone || '', email: c.email || '',
  chapter: c.chapter || '', segment: c.segment || 'Other',
  status: c.status || 'Identified', notes: c.notes || '',
  tenure: c.tenure || null, assignee_id: c.assignee_id || null,
  hidden: c.hidden === true,
}));

console.log(`Read ${rows.length} contacts from ${sourceUrl}`);
if (process.env.MIGRATE_DRY_RUN === '1') {
  console.log('Dry run only; no destination writes performed.');
  process.exit(0);
}

const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });
const { error } = await target.from('bni_contacts').upsert(rows, { onConflict: 'id' });
if (error) {
  console.error(`Destination write failed: ${error.message}`);
  process.exit(3);
}
console.log(`Migrated ${rows.length} contacts to ${targetUrl}`);
