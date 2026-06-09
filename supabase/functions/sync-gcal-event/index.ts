// BNI 121 — instant Google Calendar sync.
//
// Called by scheduler.html immediately after a booking is INSERTed into
// bni_appointments. Looks up the host's OAuth credentials in bni_members,
// creates an event in their Google Calendar, and writes the event id back.
//
// Failure modes:
//   - Network / 5xx from Google  → leave row untouched, cron worker retries.
//   - 4xx from Google            → write gcal_error so the worker skips it.
//   - Missing host credentials   → write gcal_error.
//
// Deploy:
//   supabase functions deploy sync-gcal-event --project-ref <ref>
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//
// Invoke from client:
//   supabase.functions.invoke('sync-gcal-event', { body: { appointment_id } })

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// CORS for browser invocation (Supabase JS client adds these on supabase.functions.invoke,
// but the function itself must reply with the matching headers).
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Supabase REST helpers (service role bypasses RLS) ───────────────────────
async function sbGet(path: string): Promise<any> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!r.ok) throw new Error(`supabase GET ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function sbPatch(path: string, body: unknown): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`supabase PATCH ${path}: ${r.status} ${await r.text()}`);
}

// ── Google OAuth: refresh → access token ────────────────────────────────────
async function getAccessToken(host: any): Promise<string> {
  const body = new URLSearchParams({
    client_id:     host.gcal_client_id,
    client_secret: host.gcal_client_secret,
    refresh_token: host.gcal_refresh_token,
    grant_type:    "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`oauth refresh ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.access_token;
}

// ── Build the calendar event from an appointment row ────────────────────────
function to24h(t: string): string {
  // "09:30 AM" → "09:30:00"; "02:30 PM" → "14:30:00"
  const [timePart, meridiem] = t.trim().split(/\s+/);
  let [h, m] = timePart.split(":").map(Number);
  if (meridiem?.toUpperCase() === "PM" && h !== 12) h += 12;
  if (meridiem?.toUpperCase() === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function buildEvent(row: any): unknown {
  const start = `${row.date}T${to24h(row.time)}`;
  // 30-min slot. Compute end as wall-clock in IST so Google interprets it with timeZone.
  const [h, m] = to24h(row.time).split(":").map(Number);
  const endTotal = h * 60 + m + 30;
  const endHH = String(Math.floor(endTotal / 60) % 24).padStart(2, "0");
  const endMM = String(endTotal % 60).padStart(2, "0");
  const endWall = `${row.date}T${endHH}:${endMM}:00`;

  const summary = `Zoom Call: ${row.contact_name || "BNI booking"}${row.company ? ` (${row.company})` : ""}`;
  const desc: string[] = [];
  if (row.goal)       desc.push(`Goal: ${row.goal}`);
  if (row.phone)      desc.push(`Phone: ${row.phone}`);
  if (row.industry)   desc.push(`Industry: ${row.industry}`);
  if (row.bni_status) desc.push(`BNI: ${row.bni_status}`);
  desc.push("Booked via scheduler.html");

  const event: any = {
    summary,
    description: desc.join("\n"),
    start: { dateTime: start,   timeZone: "Asia/Kolkata" },
    end:   { dateTime: endWall, timeZone: "Asia/Kolkata" },
    reminders: { useDefault: true },
  };
  if (row.email) event.attendees = [{ email: row.email }];
  return event;
}

// ── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let appointmentId: string | undefined;
  try {
    const body = await req.json();
    appointmentId = body.appointment_id;
  } catch {
    return json(400, { error: "invalid JSON body" });
  }
  if (!appointmentId) return json(400, { error: "appointment_id required" });

  // 1. Fetch appointment + joined host. PostgREST embeds host as `host:bni_members(...)`.
  const rows = await sbGet(
    `bni_appointments?id=eq.${encodeURIComponent(appointmentId)}` +
    `&select=id,contact_name,company,email,date,time,goal,phone,industry,bni_status,` +
    `gcal_event_id,gcal_error,host:bni_members(gcal_calendar_id,gcal_client_id,gcal_client_secret,gcal_refresh_token,active)` +
    `&host_member_id=not.is.null`,
  );
  if (!rows.length) return json(404, { error: "appointment not found or host_member_id is null" });
  const row  = rows[0];
  const host = row.host;

  // Idempotency: already synced? Already permanently errored? Skip.
  if (row.gcal_event_id) return new Response(JSON.stringify({ skipped: "already_synced" }), { headers: { ...CORS, "Content-Type": "application/json" } });
  if (row.gcal_error)    return new Response(JSON.stringify({ skipped: "previously_errored" }), { headers: { ...CORS, "Content-Type": "application/json" } });

  if (!host || !host.active || !host.gcal_client_id || !host.gcal_client_secret || !host.gcal_refresh_token) {
    await sbPatch(`bni_appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
      gcal_error: "host credentials missing or inactive",
    });
    return json(424, { error: "host credentials missing" });
  }

  // 2. OAuth refresh.
  let accessToken: string;
  try {
    accessToken = await getAccessToken(host);
  } catch (e) {
    // Refresh failure is usually permanent (revoked token) — mark and skip.
    await sbPatch(`bni_appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
      gcal_error: `oauth: ${String(e).slice(0, 200)}`,
    });
    return json(424, { error: "oauth refresh failed" });
  }

  // 3. Create the calendar event.
  const calId = encodeURIComponent(host.gcal_calendar_id || "primary");
  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEvent(row)),
    },
  );

  if (!r.ok) {
    const text = (await r.text()).slice(0, 300);
    // 4xx = permanent (bad input, calendar not found, etc.) → mark error.
    // 5xx / 429 = transient → leave row alone so cron retries.
    if (r.status >= 400 && r.status < 500 && r.status !== 429) {
      await sbPatch(`bni_appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
        gcal_error: `gcal ${r.status}: ${text}`,
      });
    }
    return json(r.status, { error: "gcal create failed", detail: text });
  }

  const created = await r.json();
  await sbPatch(`bni_appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
    gcal_event_id: created.id,
  });

  return new Response(JSON.stringify({ ok: true, gcal_event_id: created.id }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
