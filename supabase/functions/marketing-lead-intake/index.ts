const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const recent = new Map<string, number>();
const slots = new Set(["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM","06:00 PM","06:30 PM","07:00 PM"]);
const clean = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const emailOk = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
async function sb(path: string, init: RequestInit = {}) { return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) } }); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "POST required" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (Date.now() - (recent.get(ip) || 0) < 15000) return json(429, { error: "Please wait a few seconds before trying again." });
  recent.set(ip, Date.now());
  let b: any; try { b = await req.json(); } catch { return json(400, { error: "Invalid form data." }); }
  if (clean(b.website, 80)) return json(200, { ok: true, appointment_id: "filtered" });
  const name = clean(b.name, 120), phone = clean(b.phone, 40), email = clean(b.email, 160), date = clean(b.date, 10), time = clean(b.time, 12);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 10) return json(400, { error: "Enter a valid name and phone number." });
  if (!emailOk(email)) return json(400, { error: "Enter a valid email address." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !slots.has(time)) return json(400, { error: "That time slot is not valid." });
  if (b.consent !== true) return json(400, { error: "Consent is required to book." });
  const company = clean(b.company, 160), industry = clean(b.industry, 100), bni = clean(b.bni, 30), goal = clean(b.goal, 1000);
  const source = clean(b.source, 300) || "direct", campaign = clean(b.campaign, 160), landing = clean(b.landingPage, 200), consent = new Date().toISOString();
  const lookup = await sb(`bni_contacts?phone=eq.${encodeURIComponent(phone)}&select=id&limit=1`);
  if (!lookup.ok) return json(502, { error: "Could not check existing contact." });
  const existing = await lookup.json(), contactId = existing[0]?.id || `c${crypto.randomUUID()}`;
  const parts = name.split(/\s+/);
  const contact = { id: contactId, first: parts[0] || "", last: parts.slice(1).join(" "), company, phone, email, segment: industry || "Other", status: "Meeting Scheduled", notes: `Booked via public scheduler. Goal: ${goal}. BNI: ${bni}`, source, campaign, landing_page: landing, consent_at: consent };
  const saved = await sb(existing.length ? `bni_contacts?id=eq.${encodeURIComponent(contactId)}` : "bni_contacts", { method: existing.length ? "PATCH" : "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(contact) });
  if (!saved.ok) return json(502, { error: "Could not save your contact details." });
  const appointmentId = `appt_${crypto.randomUUID()}`;
  const booked = await sb("bni_appointments", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: appointmentId, contact_id: contactId, contact_name: name, company, date, time, medium: "Zoom", phone, email, industry, bni_status: bni, goal, source, campaign, landing_page: landing, consent_at: consent }) });
  if (!booked.ok) return json(booked.status === 409 ? 409 : 502, { error: booked.status === 409 ? "That slot was just booked. Please choose another time." : "Could not create the booking." });
  return json(200, { ok: true, appointment_id: appointmentId, contact_id: contactId });
});
