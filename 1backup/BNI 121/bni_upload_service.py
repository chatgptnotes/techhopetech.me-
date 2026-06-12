#!/usr/bin/env python3
"""
BNI 121 — file upload + AI proxy service.

The frontend moved from Supabase cloud to self-hosted PostgREST, which has no
Storage API — every sb.storage.upload() used to 405 against nginx. This service
replaces it:

  POST   /bni-upload/upload?bucket=<b>&path=<p>   raw file bytes in body
         → saves to UPLOAD_ROOT/<bucket>/<path>
         → {"ok":true,"bucket":b,"path":p,"url":"https://hopetech.me/bni/uploads/<b>/<p>"}
  DELETE /bni-upload/object?bucket=<b>&path=<p>   → {"ok":true} (idempotent)
  POST   /bni-upload/ai/messages                  JSON body forwarded to
         api.anthropic.com/v1/messages with the server-side ANTHROPIC_API_KEY
         (replaces the in-browser "enter your Anthropic key" prompt)
  GET    /bni-upload/healthz                      → {"ok":true}

Saved files are served as static assets by the existing nginx mapping
(/var/www/bni → /bni/), so uploads/<bucket>/<path> is publicly reachable.

All endpoints except healthz require "Authorization: Bearer $BNI_UPLOAD_BEARER"
(the site's public anon JWT — a bot filter, not a secret; abuse is bounded by
per-IP rate limits, size caps and the model/token caps on the AI proxy).

Install — see install-bni-upload.sh (systemd unit + nginx route, port 18803).
"""
from __future__ import annotations
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

# ── env ─────────────────────────────────────────────────────────────────────
ENV_FILE = "/etc/bni-upload.env"
def load_env():
    if not os.path.exists(ENV_FILE): return
    with open(ENV_FILE) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
load_env()

BEARER          = os.environ.get("BNI_UPLOAD_BEARER", "")
ANTHROPIC_KEY   = os.environ.get("ANTHROPIC_API_KEY", "")
UPLOAD_ROOT     = os.path.realpath(os.environ.get("UPLOAD_ROOT", "/var/www/bni/uploads"))
MAX_UPLOAD_MB   = int(os.environ.get("MAX_UPLOAD_MB", "25"))
PORT            = int(os.environ.get("PORT", "18803"))
PUBLIC_BASE     = os.environ.get("PUBLIC_BASE", "https://hopetech.me/bni/uploads")

if not BEARER:
    print("ERROR: BNI_UPLOAD_BEARER not set; aborting", file=sys.stderr)
    sys.exit(1)
if not ANTHROPIC_KEY:
    print("WARN: ANTHROPIC_API_KEY not set — /ai/messages will return 503", file=sys.stderr)

BUCKETS = {"bni-files", "proposals", "dev-attachments"}
ALLOWED_EXT = {
    "pdf", "png", "jpg", "jpeg", "gif", "webp",
    "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "csv", "md", "mp4", "mp3", "zip",
}
PATH_RE = re.compile(r"^[A-Za-z0-9._/-]+$")
MAX_AI_BODY = 8 * 1024 * 1024       # card scans send base64 images
MAX_AI_TOKENS = 2048

# ── per-IP sliding-window rate limit ────────────────────────────────────────
_hits: dict[str, deque] = defaultdict(deque)
def rate_limited(ip: str, kind: str, per_min: int) -> bool:
    key = f"{ip}:{kind}"
    now = time.time()
    q = _hits[key]
    while q and q[0] < now - 60:
        q.popleft()
    if len(q) >= per_min:
        return True
    q.append(now)
    return False

# ── path safety ─────────────────────────────────────────────────────────────
def safe_target(bucket: str, path: str) -> str | None:
    """Return an absolute file path under UPLOAD_ROOT/<bucket>, or None if unsafe."""
    if bucket not in BUCKETS: return None
    path = unquote(path or "").strip()
    if not path or len(path) > 512: return None
    if not PATH_RE.match(path): return None
    if path.startswith("/") or "\\" in path or ".." in path: return None
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    if ext not in ALLOWED_EXT: return None
    target = os.path.realpath(os.path.join(UPLOAD_ROOT, bucket, path))
    if not target.startswith(UPLOAD_ROOT + os.sep): return None
    return target

# ── AI proxy ────────────────────────────────────────────────────────────────
def proxy_anthropic(raw: bytes) -> tuple[int, bytes]:
    try:
        body = json.loads(raw)
    except Exception:
        return 400, b'{"ok":false,"error":"bad json"}'
    model = str(body.get("model") or "")
    # Haiku/Sonnet only — blocks cost abuse via expensive models with the public bearer.
    if not model.startswith(("claude-haiku-", "claude-sonnet-")):
        return 400, b'{"ok":false,"error":"model not allowed"}'
    # Forward an allowlisted shape only — never caller-supplied system/tools/etc.
    forwarded = {
        "model": model,
        "max_tokens": min(int(body.get("max_tokens") or MAX_AI_TOKENS), MAX_AI_TOKENS),
        "messages": body.get("messages") or [],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(forwarded).encode(),
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=110) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return 502, json.dumps({"ok": False, "error": f"upstream: {e}"}).encode()

# ── HTTP handler ────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stdout.write(f"[{datetime.now()}] {self.address_string()} {fmt % args}\n")

    def _send(self, code, obj=None, body: bytes | None = None):
        payload = body if body is not None else json.dumps(obj or {}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _client_ip(self) -> str:
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def _authed(self) -> bool:
        auth = self.headers.get("Authorization", "")
        return auth == f"Bearer {BEARER}"

    def _route(self) -> tuple[str, dict]:
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith("/bni-upload/"):
            path = path[len("/bni-upload"):]
        q = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        return path, q

    def do_GET(self):
        path, _ = self._route()
        if path == "/healthz":
            return self._send(200, {"ok": True})
        return self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        path, q = self._route()
        if not self._authed():
            return self._send(401, {"ok": False, "error": "unauthorized"})
        ip = self._client_ip()

        if path == "/ai/messages":
            if not ANTHROPIC_KEY:
                return self._send(503, {"ok": False, "error": "AI not configured on server"})
            if rate_limited(ip, "ai", 10):
                return self._send(429, {"ok": False, "error": "rate limited"})
            n = int(self.headers.get("Content-Length") or 0)
            if n <= 0 or n > MAX_AI_BODY:
                return self._send(413, {"ok": False, "error": "body too large"})
            code, payload = proxy_anthropic(self.rfile.read(n))
            print(f"  ai/messages → {code} ({n} bytes in)")
            return self._send(code, body=payload)

        if path == "/upload":
            if rate_limited(ip, "up", 30):
                return self._send(429, {"ok": False, "error": "rate limited"})
            bucket, rel = q.get("bucket", ""), q.get("path", "")
            target = safe_target(bucket, rel)
            if not target:
                return self._send(400, {"ok": False, "error": "bad bucket/path/extension"})
            n = int(self.headers.get("Content-Length") or 0)
            if n <= 0:
                return self._send(400, {"ok": False, "error": "empty body"})
            if n > MAX_UPLOAD_MB * 1024 * 1024:
                return self._send(413, {"ok": False, "error": f"file exceeds {MAX_UPLOAD_MB} MB"})
            data = self.rfile.read(n)
            os.makedirs(os.path.dirname(target), exist_ok=True)
            tmp = target + ".tmp"
            with open(tmp, "wb") as fh:
                fh.write(data)
            os.replace(tmp, target)
            url = f"{PUBLIC_BASE}/{bucket}/{unquote(rel)}"
            print(f"  ✓ upload {bucket}/{rel} ({n} bytes)")
            return self._send(200, {"ok": True, "bucket": bucket, "path": unquote(rel), "url": url})

        return self._send(404, {"ok": False, "error": "not found"})

    def do_DELETE(self):
        path, q = self._route()
        if not self._authed():
            return self._send(401, {"ok": False, "error": "unauthorized"})
        if path != "/object":
            return self._send(404, {"ok": False, "error": "not found"})
        if rate_limited(self._client_ip(), "up", 30):
            return self._send(429, {"ok": False, "error": "rate limited"})
        target = safe_target(q.get("bucket", ""), q.get("path", ""))
        if not target:
            return self._send(400, {"ok": False, "error": "bad bucket/path"})
        try:
            os.remove(target)
            print(f"  ✓ delete {q.get('bucket')}/{q.get('path')}")
        except FileNotFoundError:
            pass
        return self._send(200, {"ok": True})

if __name__ == "__main__":
    print(f"BNI upload service listening on 127.0.0.1:{PORT} (root={UPLOAD_ROOT})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
