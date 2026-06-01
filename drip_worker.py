#!/usr/bin/env python3
"""
BNI 121 — WhatsApp drip worker.

Runs every 5 minutes via cron. Polls bni_drip_schedule for rows where
scheduled_at <= now and sent_at is null. For each, looks up the contact
+ the template body (with {first}, {company} placeholders), pushes via
the OpenClaw bridge at OPENCLAW_HOST, and writes back sent_at + body_preview
or error.

Install:
  /usr/local/bin/bni-drip-worker.py    (this file)
  cron:  */5 * * * * /usr/local/bin/bni-drip-worker.py >> /var/log/bni-drip.log 2>&1

Env (read from /etc/bni-drip.env if present, else from the process env):
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...
  OPENCLAW_HOST=https://hopetech.me/openclaw-api
  OPENCLAW_TOKEN=...
"""
from __future__ import annotations
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

ENV_FILE = "/etc/bni-drip.env"

def load_env():
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_env()

SUPABASE_URL  = os.environ.get("SUPABASE_URL")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
OC_HOST       = os.environ.get("OPENCLAW_HOST", "https://hopetech.me/openclaw-api")
OC_TOKEN      = os.environ.get("OPENCLAW_TOKEN") or os.environ.get("OPENCLAW_GATEWAY_TOKEN")

if not (SUPABASE_URL and SUPABASE_KEY):
    print(f"[{datetime.now()}] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
    sys.exit(0)

def sb(method: str, path: str, body=None, params=None):
    url = SUPABASE_URL.rstrip("/") + "/rest/v1/" + path.lstrip("/")
    if params:
        from urllib.parse import urlencode
        url += ("&" if "?" in url else "?") + urlencode(params)
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read()
        return json.loads(raw) if raw else None

def render(body: str, contact: dict) -> str:
    first = (contact.get("first") or "").strip() or "there"
    last  = (contact.get("last")  or "").strip()
    return (body or "") \
        .replace("{first}", first) \
        .replace("{last}",  last)  \
        .replace("{name}",  (first + " " + last).strip()) \
        .replace("{company}", contact.get("company") or "your company")

def send_whatsapp(phone: str, text: str) -> dict:
    if not OC_HOST:
        raise RuntimeError("OPENCLAW_HOST not set")
    url = OC_HOST.rstrip("/") + "/send"
    headers = {"Content-Type": "application/json"}
    if OC_TOKEN:
        headers["Authorization"] = f"Bearer {OC_TOKEN}"
    body = json.dumps({"to": phone, "text": text}).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return {"ok": True, "status": r.status, "body": r.read().decode()[:200]}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "body": e.read().decode()[:200]}
    except Exception as e:
        return {"ok": False, "status": 0, "body": str(e)[:200]}

def main():
    now = datetime.now(timezone.utc).isoformat()
    due = sb("GET", "bni_drip_schedule",
             params={
                 "select": "id,contact_id,template_id,scheduled_at",
                 "sent_at": "is.null",
                 "cancelled_at": "is.null",
                 "scheduled_at": f"lte.{now}",
                 "order": "scheduled_at.asc",
                 "limit": "20",
             }) or []
    if not due:
        return  # silent for cron log

    print(f"[{now}] {len(due)} due")
    for row in due:
        try:
            contact = (sb("GET", "bni_contacts",
                          params={"select":"id,first,last,company,phone","id":f"eq.{row['contact_id']}"}) or [None])[0]
            if not contact:
                sb("PATCH", f"bni_drip_schedule?id=eq.{row['id']}",
                   body={"error": "contact not found", "cancelled_at": now})
                continue
            tmpl = (sb("GET", "bni_templates",
                       params={"select":"body,channel","id":f"eq.{row['template_id']}"}) or [None])[0]
            if not tmpl:
                sb("PATCH", f"bni_drip_schedule?id=eq.{row['id']}",
                   body={"error": "template not found", "cancelled_at": now})
                continue
            body = render(tmpl["body"], contact)
            phone = contact.get("phone") or ""
            if not phone:
                sb("PATCH", f"bni_drip_schedule?id=eq.{row['id']}",
                   body={"error": "contact has no phone", "cancelled_at": now})
                continue
            res = send_whatsapp(phone, body)
            if res["ok"]:
                sb("PATCH", f"bni_drip_schedule?id=eq.{row['id']}",
                   body={"sent_at": datetime.now(timezone.utc).isoformat(),
                         "body_preview": body[:200]})
                print(f"  sent → {phone}  ({contact.get('first','')} {contact.get('last','')})")
            else:
                sb("PATCH", f"bni_drip_schedule?id=eq.{row['id']}",
                   body={"error": f"{res['status']}: {res['body'][:120]}"})
                print(f"  FAIL → {phone}: {res['status']} {res['body'][:120]}")
        except Exception as e:
            print(f"  ERROR row {row['id']}: {e}", file=sys.stderr)
            try:
                sb("PATCH", f"bni_drip_schedule?id=eq.{row['id']}",
                   body={"error": str(e)[:200]})
            except Exception:
                pass

if __name__ == "__main__":
    main()
