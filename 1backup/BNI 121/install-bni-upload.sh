#!/bin/bash
# BNI 121 — install the upload + AI proxy service (systemd unit + nginx route).
# Run ONCE on the VPS (after the cron deploy has shipped bni_upload_service.py):
#
#   bash /var/www/bni/install-bni-upload.sh
#
# Reads ANTHROPIC_API_KEY interactively (used by the /bni-upload/ai/messages proxy).
# Listener: 127.0.0.1:18803 (proxied behind https://hopetech.me/bni-upload/).

set -euo pipefail

ENV_FILE=/etc/bni-upload.env
SERVICE_NAME=bni-upload
SERVICE_FILE=/etc/systemd/system/$SERVICE_NAME.service
TARGET_PY=/var/www/bni/bni_upload_service.py
UPLOAD_ROOT=/var/www/bni/uploads

# The site's public anon JWT (supabase-config.js) — used as a request bearer.
DEFAULT_BEARER='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJpc3MiOiJob3BldGVjaC12cHMifQ.QpnafqwaBL6CZpKkBacpCz8A3nxTk_EORJvE2XI54Yw'

prompt_secret() {
  local var="$1" label="$2"
  local cur="${!var-}"
  if [ -z "$cur" ]; then
    read -r -s -p "$label: " val </dev/tty
    echo
    printf -v "$var" '%s' "$val"
    export "$var"
  fi
}

prompt_secret ANTHROPIC_API_KEY "Anthropic API key (sk-ant-…) for the AI proxy"
BNI_UPLOAD_BEARER="${BNI_UPLOAD_BEARER:-$DEFAULT_BEARER}"

[ -f "$TARGET_PY" ] || { echo "ERROR: $TARGET_PY not deployed yet. Wait 60 s for the cron to deploy, then re-run."; exit 2; }
chmod +x "$TARGET_PY"

mkdir -p "$UPLOAD_ROOT"

# 1. /etc/bni-upload.env (mode 600)
umask 077
cat > "$ENV_FILE" <<EOF
BNI_UPLOAD_BEARER=$BNI_UPLOAD_BEARER
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
UPLOAD_ROOT=$UPLOAD_ROOT
MAX_UPLOAD_MB=25
PORT=18803
EOF
chmod 600 "$ENV_FILE"
echo "✓ wrote $ENV_FILE (mode 600)"

# 2. systemd unit
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BNI 121 upload + AI proxy service
After=network-online.target

[Service]
Type=simple
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/python3 $TARGET_PY
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/bni-upload.log
StandardError=append:/var/log/bni-upload.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
sleep 1
systemctl status "$SERVICE_NAME" --no-pager | head -10 || true

# 3. nginx route — append a /bni-upload/ block to the hopetech vhost if missing
NGX=/etc/nginx/sites-enabled/hopetech
if ! grep -q 'location /bni-upload/' "$NGX" 2>/dev/null; then
  python3 - "$NGX" <<'PY'
import sys, re
p = sys.argv[1]
src = open(p).read()
block = """
    # BNI upload + AI proxy
    location /bni-upload/ {
        proxy_pass http://127.0.0.1:18803;
        client_max_body_size 26m;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120;
        proxy_connect_timeout 5;
    }
"""
# Insert before the catch-all "location / {"
new = re.sub(r'(\n\s*location\s*/\s*\{)', block + r'\1', src, count=1)
if new == src:
    new = src.rstrip() + "\n" + block + "\n"
open(p, 'w').write(new)
PY
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "✓ nginx /bni-upload/ route added and reloaded"
  else
    echo "WARN: nginx -t failed; revert by editing $NGX manually"
  fi
else
  echo "✓ nginx /bni-upload/ route already present"
fi

# 4. Healthcheck
echo "=== healthcheck ==="
sleep 1
curl -s --max-time 5 https://hopetech.me/bni-upload/healthz || echo "(curl failed — check $SERVICE_NAME logs)"
echo
echo "✓ Upload endpoint:  POST https://hopetech.me/bni-upload/upload?bucket=<b>&path=<p>"
echo "  AI proxy:         POST https://hopetech.me/bni-upload/ai/messages"
echo "  Files served at:  https://hopetech.me/bni/uploads/<bucket>/<path>"
echo "  Logs:             journalctl -u $SERVICE_NAME -f   OR   tail -f /var/log/bni-upload.log"
