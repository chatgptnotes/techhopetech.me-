#!/usr/bin/env python3
"""
BNI 121 — One-time Google Calendar OAuth setup for a host member.

Run this LOCALLY (not on the VPS) — it opens a browser, lets the host sign
in to the Google account whose calendar should receive 121 bookings, and
upserts the OAuth credentials directly into the bni_members table.

Prereq:
  1. Google Cloud project with Calendar API enabled.
  2. OAuth client (type "Desktop app") created → download credentials.json.
  3. The host's Gmail added as a Test User on the OAuth consent screen
     (so the refresh token doesn't expire after 7 days).
  4. pip install google-auth-oauthlib
  5. Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY exported in this shell.
  6. The host's row must already exist in bni_members (created by the
     20260511000000_gcal_sync.sql migration for Dr. Murali; INSERT another
     row first if onboarding a new member).

Usage:
  export SUPABASE_URL=https://<ref>.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=eyJ...
  python gcal_auth.py credentials.json --member-email cmd@hopehospital.com

Optional: --calendar-id <id>  (default: 'primary')
Optional: --print-only         (skip Supabase write; print the values instead)
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def sb_patch(member_email: str, payload: dict) -> None:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    q = urllib.parse.urlencode({"email": f"eq.{member_email}"})
    req = urllib.request.Request(
        f"{url}/rest/v1/bni_members?{q}",
        data=json.dumps(payload).encode(),
        method="PATCH",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        result = json.loads(r.read())
        if not result:
            raise RuntimeError(
                f"No bni_members row matched email={member_email!r}. "
                f"Insert the row first (name, email) then re-run."
            )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("credentials", help="OAuth client credentials.json from Google Cloud Console")
    ap.add_argument("--member-email", required=True, help="bni_members.email to attach credentials to")
    ap.add_argument("--calendar-id", default="primary", help="Calendar id to write events to (default: primary)")
    ap.add_argument("--print-only", action="store_true", help="Print values instead of writing to Supabase")
    args = ap.parse_args()

    if not args.print_only:
        missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(v)]
        if missing:
            print(f"ERROR: missing env vars: {', '.join(missing)}", file=sys.stderr)
            sys.exit(2)

    flow = InstalledAppFlow.from_client_secrets_file(args.credentials, SCOPES)
    # access_type=offline + prompt=consent guarantees a refresh_token is returned
    creds = flow.run_local_server(
        port=0,
        access_type="offline",
        prompt="consent",
    )

    if not creds.refresh_token:
        print("ERROR: no refresh_token returned. Re-run; ensure prompt=consent.", file=sys.stderr)
        sys.exit(1)

    if args.print_only:
        print()
        print("# ---- credentials (print-only mode; no DB write) ----")
        print(f"GCAL_CLIENT_ID={creds.client_id}")
        print(f"GCAL_CLIENT_SECRET={creds.client_secret}")
        print(f"GCAL_REFRESH_TOKEN={creds.refresh_token}")
        print(f"GCAL_CALENDAR_ID={args.calendar_id}")
        return

    sb_patch(args.member_email, {
        "gcal_client_id":     creds.client_id,
        "gcal_client_secret": creds.client_secret,
        "gcal_refresh_token": creds.refresh_token,
        "gcal_calendar_id":   args.calendar_id,
        "active":             True,
    })
    print(f"✓ bni_members credentials updated for {args.member_email}")


if __name__ == "__main__":
    main()
