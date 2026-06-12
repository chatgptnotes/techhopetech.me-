const SUPABASE_URL = 'https://hopetech.me';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJpc3MiOiJob3BldGVjaC12cHMifQ.QpnafqwaBL6CZpKkBacpCz8A3nxTk_EORJvE2XI54Yw';

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.BNI_STATUSES = ['Identified', 'Contacted', 'Met', 'Meeting Scheduled', 'Follow-up', 'Converted', 'Not Interested'];

function splitName(full) {
  const trimmed = (full || '').trim();
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(/\s+/);
  if (parts[0] && /^(mr|ms|mrs|dr)\.?$/i.test(parts[0])) {
    const honorific = parts[0];
    const rest = parts.slice(1);
    if (rest.length === 0) return { first: honorific, last: '' };
    return { first: `${honorific} ${rest[0]}`, last: rest.slice(1).join(' ') };
  }
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function joinName(first, last) {
  return `${first || ''} ${last || ''}`.trim();
}

window.splitName = splitName;
window.joinName = joinName;

window.uiToDbContact = (c) => {
  const { first, last } = c.first !== undefined
    ? { first: c.first, last: c.last }
    : splitName(c.name);
  return {
    id:        c.id,
    first:     first || null,
    last:      last || null,
    company:   c.company || null,
    chapter:   c.chapter || null,
    city:      c.city || null,
    phone:     c.phone || null,
    email:     c.email || null,
    website:   c.website || null,
    specialty: c.specialty || null,
    segment:   c.segment || null,
    tenure:    c.tenure || null,
    status:    c.status || 'Identified',
    notes:     c.notes || null,
    hidden:    c.hidden === true,
  };
};

// Status strings are stored in the DB exactly as shown in the UI.
window.toDbStatus = (uiStatus) =>
  window.BNI_STATUSES.includes(uiStatus) ? uiStatus : (uiStatus || 'Identified');

window.dbToUiContact = (row) => ({
  id:         row.id,
  first:      row.first || '',
  last:       row.last || '',
  name:       joinName(row.first, row.last),
  company:    row.company || '',
  chapter:    row.chapter || '',
  city:       row.city || '',
  phone:      row.phone || '',
  email:      row.email || '',
  website:    row.website || '',
  specialty:  row.specialty || '',
  tenure:     row.tenure || '',
  segment:    row.segment || '',
  status:     row.status || 'Identified',
  notes:      row.notes || '',
  hidden:     row.hidden === true,
  assignee_id: row.assignee_id || '',
  meetingDate: row.meeting_date || '',
  lastAction: row.updated_at
    ? new Date(row.updated_at).toLocaleDateString('en-IN')
    : '',
  addedAt:    row.created_at || '',
});

window.BNI_DEVS = [];
// Shared with another app (bettroi_projects FK-references these rows) so we can't
// delete them — hide from BNI UI instead.
const BNI_DEV_HIDDEN = new Set(['Poonam', 'Priyanka', 'Aman']);
window.loadDevelopers = async () => {
  const { data, error } = await window.sb
    .from('developers')
    .select('*')
    .order('name');
  if (!error && data) {
    window.BNI_DEVS = data.filter(d => !BNI_DEV_HIDDEN.has(d.name));
  }
  return window.BNI_DEVS;
};

window.BNI_CHAPTERS = [];
window.loadChapters = async () => {
  const { data, error } = await window.sb
    .from('bni_chapters')
    .select('id,name,city,state,country')
    .order('name');
  if (!error && data) window.BNI_CHAPTERS = data;
  return window.BNI_CHAPTERS;
};
window.ensureChapter = async (name, city) => {
  const clean = (name || '').trim();
  if (!clean) return;
  const existing = (window.BNI_CHAPTERS || []).find(c => c.name === clean);
  if (existing) return existing;
  const { data, error } = await window.sb
    .from('bni_chapters')
    .upsert({ name: clean, city: (city || '').trim() }, { onConflict: 'name' })
    .select()
    .maybeSingle();
  if (!error && data) window.BNI_CHAPTERS.push(data);
  return data;
};
window.chapterDisplay = (name) => {
  const ch = (window.BNI_CHAPTERS || []).find(c => c.name === name);
  return ch && ch.city ? `${ch.city} — ${ch.name}` : (name || '');
};

// ── Activity / follow-up log helper ──────────────────────────────────────────
// Appends an entry to bni_contact_details.followups JSONB array. Creates the
// detail row if needed. Safe to fail silently.
window.logActivity = async (contactId, type, message) => {
  if (!contactId || !type) return;
  try {
    const { data: d } = await window.sb
      .from('bni_contact_details')
      .select('followups')
      .eq('contact_id', contactId)
      .maybeSingle();
    const existing = (d && d.followups) || [];
    const entry = { date: new Date().toISOString().slice(0,10), type, message: message || '' };
    await window.sb
      .from('bni_contact_details')
      .upsert({ contact_id: contactId, followups: [...existing, entry] }, { onConflict: 'contact_id' });
  } catch (e) { console.warn('logActivity failed', e); }
};

// ── WhatsApp quick-message templates ─────────────────────────────────────────
window.WA_TEMPLATES = [
  { id: 'thanks',   label: 'Thank you',       text: (n) => `Hi ${n}, thanks for taking the time for our BNI 121 Zoom call. Really enjoyed the conversation!` },
  { id: 'proposal', label: 'Proposal sent',   text: (n) => `Hi ${n}, as discussed, I've sent over the proposal. Let me know if anything needs adjustment — happy to hop on another quick call.` },
  { id: 'checkin',  label: 'Check-in',        text: (n) => `Hi ${n}, quick check-in — any updates on your end? Any clients I can help with AI/automation?` },
  { id: 'referral', label: 'Ask for referral',text: (n) => `Hi ${n}, thanks again for our 121. If any of your clients could use AI or automation help, please keep me in mind for a BNI referral slip.` },
  { id: 'reconnect',label: 'Reconnect (30d)', text: (n) => `Hi ${n}, it's been a few weeks since our BNI 121. Had a few referrals in your space — worth reconnecting for 15 min?` },
];

window.waUrlFor = (phone, firstName, templateId) => {
  const raw = String(phone || '').replace(/\D/g, '');
  if (!raw) return '';
  const tpl = (window.WA_TEMPLATES || []).find(t => t.id === templateId);
  const msg = tpl ? tpl.text(firstName || '') : `Hi ${firstName || ''}, this is Dr. BK Murali following up on our BNI 121.`;
  return `https://wa.me/${raw}?text=${encodeURIComponent(msg)}`;
};

// ── Tags helper ──────────────────────────────────────────────────────────────
window.uniqueTags = (contacts) => {
  const set = new Set();
  (contacts || []).forEach(c => (c.tags || []).forEach(t => set.add(t)));
  return [...set].sort();
};

// ── Lead scoring (0-100) ─────────────────────────────────────────────────────
// Status weight + priority + fresh activity + contact completeness
window.leadScore = (c, detail) => {
  let s = 0;
  const statusW = { 'Converted': 35, 'Met': 30, 'Follow-up': 25, 'Meeting Scheduled': 20, 'Contacted': 12, 'Identified': 5, 'Not Interested': 0 };
  s += statusW[c.status] ?? 5;
  const prio = (detail && detail.priority) || 'Normal';
  s += prio === 'High' ? 20 : prio === 'Low' ? 2 : 10;
  if (c.email) s += 5;
  if (c.phone) s += 5;
  if (c.deal_value && Number(c.deal_value) > 0) s += 10;
  // Freshness: last 7d +15, 30d +8, older 0
  if (c.updated_at) {
    const age = (Date.now() - new Date(c.updated_at).getTime()) / 86400000;
    if (age <= 7) s += 15;
    else if (age <= 30) s += 8;
  }
  // Reminder urgency
  if (detail && detail.next_date) {
    const today = new Date().toISOString().slice(0,10);
    if (detail.next_date < today) s += 10;
    else if (detail.next_date === today) s += 8;
  }
  return Math.min(100, Math.max(0, Math.round(s)));
};

window.scoreColor = (score) => {
  if (score >= 75) return { bg: '#dcfce7', fg: '#166534', bd: '#86efac' };
  if (score >= 50) return { bg: '#fef3c7', fg: '#92400e', bd: '#fde68a' };
  if (score >= 25) return { bg: '#e0e7ff', fg: '#3730a3', bd: '#c7d2fe' };
  return { bg: '#f1f5f9', fg: '#475569', bd: '#e2e8f0' };
};

// ── Email event log ──────────────────────────────────────────────────────────
window.logEmailEvent = async (contactId, eventType, meta) => {
  if (!contactId || !eventType) return;
  try {
    await window.sb.from('bni_email_events').insert({ contact_id: contactId, event_type: eventType, meta: meta || {} });
  } catch (e) { console.warn('logEmailEvent failed', e); }
};

// ── Google Calendar quick-add URL ────────────────────────────────────────────
window.gcalUrl = (contact, detail) => {
  const name = `${contact.first || ''} ${contact.last || ''}`.trim();
  const title = `BNI 121 with ${name}${contact.company ? ' — ' + contact.company : ''}`;
  const details = [
    contact.notes ? 'Notes: ' + contact.notes.slice(0, 500) : '',
    contact.phone ? 'Phone: ' + contact.phone : '',
    contact.email ? 'Email: ' + contact.email : '',
    detail && detail.zoom_recording_url ? 'Previous recording: ' + detail.zoom_recording_url : '',
  ].filter(Boolean).join('\n');
  // Default: 30-minute slot starting in 1 hour (user edits before saving)
  const start = new Date(Date.now() + 3600 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    location: 'Zoom',
  });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
};

// ── Settings store (bni_settings key/value) ─────────────────────────────────
window.BNI_SETTINGS = {};
window.loadSettings = async () => {
  try {
    const { data } = await window.sb.from('bni_settings').select('key,value');
    if (data) data.forEach(r => { window.BNI_SETTINGS[r.key] = r.value; });
  } catch (e) { console.warn('loadSettings failed', e); }
  return window.BNI_SETTINGS;
};
window.saveSetting = async (key, value) => {
  const { error } = await window.sb.from('bni_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (!error) window.BNI_SETTINGS[key] = value;
  return !error;
};

// ── WhatsApp Business API send (Meta Cloud API) ──────────────────────────────
// Activates when bni_settings has 'whatsapp' = { token, phone_id, approved_template? }
window.sendWhatsAppAPI = async (toPhone, textBody) => {
  const wa = window.BNI_SETTINGS.whatsapp || {};
  if (!wa.token || !wa.phone_id) {
    window.bniToast('WhatsApp Business API not configured — opening wa.me instead', 'info');
    return { fallback: true };
  }
  const to = String(toPhone || '').replace(/\D/g, '');
  const url = `https://graph.facebook.com/v21.0/${wa.phone_id}/messages`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + wa.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to,
        type: 'text', text: { body: textBody }
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return { error: t.slice(0, 200) };
    }
    return { ok: true, data: await resp.json() };
  } catch (e) { return { error: e.message }; }
};
window.devName = (id) => {
  const d = (window.BNI_DEVS || []).find(x => x.id === id);
  return d ? d.name : '';
};
window.devOptionsHtml = (selectedId) => {
  return '<option value="">— Unassigned —</option>' +
    (window.BNI_DEVS || [])
      .map(d => `<option value="${d.id}" ${d.id === selectedId ? 'selected' : ''}>${d.name}</option>`)
      .join('');
};

// Multi-select version (for assignee_ids array)
window.devMultiOptionsHtml = (selectedIds) => {
  const selected = new Set(selectedIds || []);
  return (window.BNI_DEVS || [])
    .map(d => `<option value="${d.id}" ${selected.has(d.id) ? 'selected' : ''}>${d.name}</option>`)
    .join('');
};

// Given a contact row, return effective list of assignee IDs (handles legacy assignee_id)
window.contactAssigneeIds = (c) => {
  if (c && Array.isArray(c.assignee_ids) && c.assignee_ids.length) return c.assignee_ids;
  if (c && c.assignee_id) return [c.assignee_id];
  return [];
};

window.contactAssigneeNames = (c) => {
  return window.contactAssigneeIds(c).map(id => window.devName(id) || '').filter(Boolean);
};

// Multi-phone helpers
window.contactPhones = (c) => {
  if (c && Array.isArray(c.phones) && c.phones.length) return c.phones.filter(Boolean);
  if (c && c.phone) return [c.phone];
  return [];
};
window.primaryPhone = (c) => window.contactPhones(c)[0] || '';

// Phone formatting — Indian-aware. "+919840261043" → "+91 98402 61043". "9840261043" → "98402 61043".
window.formatPhone = (raw) => {
  if (!raw) return '';
  const s = String(raw).trim();
  const digits = s.replace(/\D/g, '');
  // +91 / 91-prefixed Indian 10-digit numbers
  if (/^\+?91\d{10}$/.test(s.replace(/[\s-]/g,'')) || /^91\d{10}$/.test(digits)) {
    const last10 = digits.slice(-10);
    return `+91 ${last10.slice(0,5)} ${last10.slice(5)}`;
  }
  // Bare 10-digit Indian mobile
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `${digits.slice(0,5)} ${digits.slice(5)}`;
  }
  // Other +CC numbers: keep as-is, just collapse runs of whitespace
  return s.replace(/\s+/g,' ');
};
// Tel-href stripped to digits + optional leading +
window.telHref = (raw) => {
  if (!raw) return '';
  const s = String(raw).trim();
  const plus = s.startsWith('+') ? '+' : '';
  return plus + s.replace(/[^\d]/g,'');
};

// Date formatting — single source of truth.
//   formatDate('2026-05-02')           → "Sat, 2 May 2026"   (long, default)
//   formatDate('2026-05-02', 'short')  → "2 May"
//   formatDate('2026-05-02', 'medium') → "2 May 2026"
window.formatDate = (iso, style) => {
  if (!iso) return '';
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(String(iso).slice(0,10) + 'T00:00:00');
  if (isNaN(d)) return String(iso);
  const day = d.getDate(), mon = MONTHS[d.getMonth()], yr = d.getFullYear();
  if (style === 'short')  return `${day} ${mon}`;
  if (style === 'medium') return `${day} ${mon} ${yr}`;
  return `${DAYS[d.getDay()]}, ${day} ${mon} ${yr}`;
};

// ── VPS upload service + server-side AI proxy (/bni-upload/) ────────────────
// Replaces sb.storage.upload (no Storage API on the self-hosted PostgREST VPS)
// and the in-browser Anthropic key prompt. See bni_upload_service.py.
window.bniUpload = async (bucket, path, file) => {
  const resp = await fetch(`/bni-upload/upload?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': (file && file.type) || 'application/octet-stream',
    },
    body: file,
  });
  const j = await resp.json().catch(() => ({}));
  if (!resp.ok || !j.ok) throw new Error(j.error || ('Upload failed (' + resp.status + ')'));
  return j; // { ok, bucket, path, url }
};

window.bniDeleteUpload = async (bucket, path) => {
  try {
    const resp = await fetch(`/bni-upload/object?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY },
    });
    return resp.ok;
  } catch (e) { return false; }
};

// body = Anthropic /v1/messages request ({ model, max_tokens, messages }).
// Returns the Anthropic response JSON; throws with a readable message on error.
window.bniAI = async (body) => {
  const resp = await fetch('/bni-upload/ai/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error((j.error && j.error.message) || j.error || ('AI request failed (' + resp.status + ')'));
  return j;
};

window.bniToast = (msg, type = 'info') => {
  let host = document.getElementById('__bni_toast_host');
  if (!host) {
    host = document.createElement('div');
    host.id = '__bni_toast_host';
    host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  const bg = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb';
  t.style.cssText = `background:${bg};color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:360px;`;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 3500);
};
