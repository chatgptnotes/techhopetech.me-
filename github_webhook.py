#!/usr/bin/env python3
"""
BNI 121 — GitHub webhook listener.

Receives:
  - push events  → for every commit, scan message for work-item references
                   like "BNI-12", "[BNI-12]", "Refs BNI-12", "Fixes BNI-12".
                   For each referenced item that exists in dev_work_items,
                   append the commit URL to its git_refs[] and (if message
                   contains "fix/close/resolve") move state to "Review".

Endpoint URL:  https://hopetech.me/github-webhook

Verifies GitHub's HMAC-SHA256 'X-Hub-Signature-256' header — only events
signed with the configured GITHUB_WEBHOOK_SECRET are honored.

Install: see install-github-webhook.sh
"""
from __future__ import annotations
import hashlib
import hmac
import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

ENV_FILE = "/etc/bni-github.env"
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
GH_SECRET     = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
PORT          = int(os.environ.get("PORT", "18802"))

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set; aborting", file=sys.stderr)
    sys.exit(1)

# Match BNI-12, [BNI-12], (BNI-12), refs BNI-12, fixes #BNI-12, etc.
# Capture group 2 is the full work-item ID like "BNI-12".
REF_RE = re.compile(r"\b(closes?|fix(?:e[sd])?|resolves?|refs?)?\s*#?([A-Z]{2,8}-\d+)\b", re.IGNORECASE)
RESOLVING_VERBS = {"close", "closes", "closed", "fix", "fixes", "fixed", "resolve", "resolves", "resolved"}

def sb(method, path, body=None, params=None):
    url = SUPABASE_URL.rstrip("/") + "/rest/v1/" + path.lstrip("/")
    if params:
        from urllib.parse import urlencode
        url += ("&" if "?" in url else "?") + urlencode(params)
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
               "Content-Type": "application/json", "Prefer": "return=representation"}
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read()
        return json.loads(raw) if raw else None

def parse_refs(message: str):
    """Yield (item_id, resolving_bool) tuples for every distinct ref in the message."""
    seen = set()
    for m in REF_RE.finditer(message or ""):
        verb = (m.group(1) or "").lower()
        item_id = m.group(2)
        if item_id in seen: continue
        seen.add(item_id)
        yield item_id, verb in RESOLVING_VERBS

def handle_push(payload: dict):
    repo = (payload.get("repository") or {}).get("full_name", "?")
    ref  = payload.get("ref", "")
    commits = payload.get("commits") or []
    if not commits:
        return
    print(f"[{datetime.now()}] push {repo} {ref}  ({len(commits)} commits)")
    for c in commits:
        url     = c.get("url") or ""
        msg     = c.get("message") or ""
        sha     = (c.get("id") or "")[:8]
        author  = (c.get("author") or {}).get("name") or "unknown"
        first   = msg.splitlines()[0] if msg else ""
        for item_id, resolving in parse_refs(msg):
            row = (sb("GET", "dev_work_items",
                     params={"select":"id,git_refs,state","id":f"eq.{item_id}"}) or [None])[0]
            if not row:
                print(f"   ↪ {item_id} not in DB; skipping")
                continue
            existing = row.get("git_refs") or []
            line = f"{url} — {first[:80]}"
            update = {}
            if line not in existing:
                update["git_refs"] = [*existing, line]
            if resolving and row.get("state") not in ("Review", "Done"):
                update["state"] = "Review"
            if update:
                sb("PATCH", f"dev_work_items?id=eq.{item_id}", body=update)
                # Audit
                if "state" in update:
                    sb("POST", "dev_history",
                       body={"item_id": item_id, "field": "state",
                             "old_value": row.get("state"), "new_value": update["state"]})
                if "git_refs" in update:
                    sb("POST", "dev_history",
                       body={"item_id": item_id, "field": "git_refs",
                             "old_value": "", "new_value": f"+{sha} from {author}"})
                print(f"   ✓ {item_id}: linked {sha}{' + state→Review' if 'state' in update else ''}")
            else:
                print(f"   = {item_id}: already linked")

DISPATCH = {"push": handle_push}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stdout.write(f"[{datetime.now()}] {self.address_string()} {fmt%args}\n")

    def _send(self, code, body=b"", ctype="application/json"):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        if body: self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/healthz") or self.path.startswith("/github-webhook/healthz"):
            return self._send(200, b'{"ok":true}')
        return self._send(404, b'{"error":"not found"}')

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b""
        # Verify GitHub signature
        if GH_SECRET:
            sig_header = self.headers.get("X-Hub-Signature-256", "")
            expected = "sha256=" + hmac.new(GH_SECRET.encode(), raw, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected, sig_header):
                print(f"  signature mismatch (expected sha256, got {sig_header[:20]}…)")
                return self._send(401, b'{"error":"bad signature"}')
        event = self.headers.get("X-GitHub-Event", "ping")
        if event == "ping":
            return self._send(200, b'{"ok":true,"pong":true}')
        try: payload = json.loads(raw or b"{}")
        except Exception: return self._send(400, b'{"error":"bad json"}')
        try:
            fn = DISPATCH.get(event)
            if fn:
                fn(payload)
            else:
                print(f"[{datetime.now()}] unhandled event={event}")
        except Exception as e:
            print(f"  handler error: {e}", file=sys.stderr)
            import traceback; traceback.print_exc(file=sys.stderr)
        return self._send(200, b'{"ok":true}')

if __name__ == "__main__":
    print(f"BNI GitHub webhook listening on 127.0.0.1:{PORT}")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
