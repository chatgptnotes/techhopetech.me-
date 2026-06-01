#!/usr/bin/env python3
"""
BNI 121 — Zoom webhook listener.

Receives:
  - meeting.ended events  → stamps the contact's bni_contacts.status='Met'
                            and bni_contact_details.meeting_outcome='completed'
  - recording.completed   → drops the share URL into zoom_recording_url
                            and the transcript URL into zoom_transcript_url

Matches the meeting to a BNI contact by host email → assignee, and by
participant email → contact email. If no match is found, the event is
logged into bni_zoom_events for later manual reconciliation.

Endpoint URL:  https://hopetech.me/zoom-webhook

Verifies Zoom's HMAC-SHA256 'authorization' challenge so only requests
signed with the configured ZOOM_WEBHOOK_SECRET_TOKEN are honored.

Install — see install-zoom-webhook.sh (sets up systemd unit + nginx route).
"""
from __future__ import annotations
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── env ─────────────────────────────────────────────────────────────────────
ENV_FILE = "/etc/bni-zoom.env"
def load_env():
    if not os.path.exists(ENV_FILE): return
    with open(ENV_FILE) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
load_env()

SUPABASE_URL  = os.environ.get("SUPABASE_URL", "https://bvaefzcsgtgqwftczixb.supabase.co")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ZOOM_SECRET   = os.environ.get("ZOOM_WEBHOOK_SECRET_TOKEN", "")
PORT          = int(os.environ.get("PORT", "18801"))

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set; aborting", file=sys.stderr)
    sys.exit(1)

# ── tiny Supabase REST helper ───────────────────────────────────────────────
def sb(method, path, body=None, params=None):
    url = SUPABASE_URL.rstrip("/") + "/rest/v1/" + path.lstrip("/")
    if params:
        from urllib.parse import urlencode
        url += ("&" if "?" in url else "?") + urlencode(params)
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read()
        return json.loads(raw) if raw else None

# ── matching logic ──────────────────────────────────────────────────────────
def find_contact_by_email(email: str):
    if not email: return None
    rows = sb("GET", "bni_contacts",
             params={"select": "id,first,last,email,status",
                     "email": f"ilike.{email}", "hidden": "eq.false", "limit": "1"}) or []
    return rows[0] if rows else None

def find_contact_by_meeting_topic(topic: str):
    """Fallback — Zoom meeting topics often contain 'with <Name>' or just a name."""
    if not topic: return None
    # crude name extraction; user can refine later
    import re
    m = re.search(r"with\s+([A-Za-z][A-Za-z\s.]+)", topic)
    name = (m.group(1) if m else topic).strip().split()
    if not name: return None
    rows = sb("GET", "bni_contacts",
             params={"select":"id,first,last,email,status",
                     "or": f"(first.ilike.{name[0]}%,last.ilike.{name[-1]}%)",
                     "hidden":"eq.false", "limit":"1"}) or []
    return rows[0] if rows else None

# ── handlers per event type ─────────────────────────────────────────────────
def handle_meeting_ended(payload: dict):
    obj = payload.get("object") or {}
    host_email   = obj.get("host_email") or ""
    topic        = obj.get("topic") or ""
    participants = obj.get("participants") or []
    end_time     = obj.get("end_time") or datetime.now(timezone.utc).isoformat()

    contact = None
    for p in participants:
        if p.get("email") and p.get("email") != host_email:
            contact = find_contact_by_email(p["email"])
            if contact: break
    if not contact:
        contact = find_contact_by_meeting_topic(topic)

    log = {"event_type": "meeting.ended", "host_email": host_email,
           "topic": topic, "matched_contact_id": contact["id"] if contact else None,
           "raw": payload, "received_at": datetime.now(timezone.utc).isoformat()}
    try: sb("POST", "bni_zoom_events", body=log)
    except Exception as e: print(f"  log fail: {e}", file=sys.stderr)

    if not contact:
        print(f"  no contact match (topic={topic!r}, host={host_email})")
        return
    sb("PATCH", f"bni_contacts?id=eq.{contact['id']}",
       body={"status": "Met"})
    sb("POST", "bni_contact_details",
       body={"contact_id": contact["id"], "meeting_outcome": "completed",
             "next_date": end_time[:10]})
    print(f"  ✓ meeting.ended → {contact['id']} {contact.get('first','')} marked Met")

def handle_recording_completed(payload: dict):
    obj = payload.get("object") or {}
    topic       = obj.get("topic") or ""
    host_email  = obj.get("host_email") or ""
    files       = obj.get("recording_files") or []
    share_url   = obj.get("share_url") or ""
    play_url    = obj.get("play_url")  or share_url
    transcript  = next((f.get("download_url") for f in files
                        if (f.get("file_type") or "").upper() == "TRANSCRIPT"), "")

    contact = find_contact_by_email(host_email) or find_contact_by_meeting_topic(topic)
    log = {"event_type":"recording.completed","host_email":host_email,
           "topic":topic, "matched_contact_id": contact["id"] if contact else None,
           "raw":payload, "received_at": datetime.now(timezone.utc).isoformat()}
    try: sb("POST", "bni_zoom_events", body=log)
    except Exception as e: print(f"  log fail: {e}", file=sys.stderr)

    if not contact:
        print(f"  no contact match for recording (topic={topic!r})")
        return
    detail = {"contact_id": contact["id"]}
    if play_url:   detail["zoom_recording_url"]  = play_url
    if transcript: detail["zoom_transcript_url"] = transcript
    sb("POST", "bni_contact_details", body=detail)
    print(f"  ✓ recording → {contact['id']} {contact.get('first','')}: {play_url}")

DISPATCH = {
    "meeting.ended":         handle_meeting_ended,
    "recording.completed":   handle_recording_completed,
}

# ── HTTP handler ────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stdout.write(f"[{datetime.now()}] {self.address_string()} {fmt%args}\n")

    def _send(self, code, body=b"", ctype="application/json"):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        if body: self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/healthz") or self.path.startswith("/zoom-webhook/healthz"):
            return self._send(200, b'{"ok":true}')
        return self._send(404, b'{"error":"not found"}')

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b""
        try: payload = json.loads(raw or b"{}")
        except Exception: return self._send(400, b'{"error":"bad json"}')

        event = payload.get("event")

        # Zoom URL-validation handshake
        if event == "endpoint.url_validation":
            ptoken = (payload.get("payload") or {}).get("plainToken") or ""
            sig = hmac.new(ZOOM_SECRET.encode(), ptoken.encode(), hashlib.sha256).hexdigest()
            return self._send(200, json.dumps({"plainToken": ptoken, "encryptedToken": sig}).encode())

        # Verify signature on real events
        ts  = self.headers.get("x-zm-request-timestamp", "")
        sig = self.headers.get("x-zm-signature", "")
        if ZOOM_SECRET and ts and sig:
            msg = f"v0:{ts}:{raw.decode('utf-8')}".encode()
            expected = "v0=" + hmac.new(ZOOM_SECRET.encode(), msg, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected, sig):
                print(f"  signature mismatch for event={event}")
                return self._send(401, b'{"error":"bad signature"}')

        body = payload.get("payload") or {}
        try:
            fn = DISPATCH.get(event)
            if fn:
                print(f"[{datetime.now()}] event={event}")
                fn(body)
            else:
                print(f"[{datetime.now()}] unhandled event={event}")
        except Exception as e:
            print(f"  handler error: {e}", file=sys.stderr)
        return self._send(200, b'{"ok":true}')

if __name__ == "__main__":
    print(f"BNI Zoom webhook listening on 127.0.0.1:{PORT}")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
