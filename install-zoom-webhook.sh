#!/bin/bash
# BNI 121 — install the Zoom webhook listener (systemd unit + nginx route).
# Run ONCE on the VPS:
#
#   curl -sL https://raw.githubusercontent.com/chatgptnotes/bni121/main/1backup/BNI%20121/install-zoom-webhook.sh | bash
#
# Reads ZOOM_WEBHOOK_SECRET_TOKEN + SUPABASE_SERVICE_ROLE_KEY interactively.
# Listener: 127.0.0.1:18801 (proxied behind https://hopetech.me/zoom-webhook).

set -euo pipefail

ENV_FILE=/etc/bni-zoom.env
SERVICE_NAME=bni-zoom-webhook
SERVICE_FILE=/etc/systemd/system/$SERVICE_NAME.service
TARGET_PY=/var/www/bni/zoom_webhook.py

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

prompt_secret SUPABASE_SERVICE_ROLE_KEY    "Supabase service-role key (eyJ…)"
prompt_secret ZOOM_WEBHOOK_SECRET_TOKEN     "Zoom webhook secret token (Zoom Marketplace → your app → Feature → Secret Token)"

SUPABASE_URL="${SUPABASE_URL:-https://bvaefzcsgtgqwftczixb.supabase.co}"

[ -f "$TARGET_PY" ] || { echo "ERROR: $TARGET_PY not deployed yet. Wait 60 s for the cron to deploy, then re-run."; exit 2; }
chmod +x "$TARGET_PY"

# 1. /etc/bni-zoom.env (mode 600)
umask 077
cat > "$ENV_FILE" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ZOOM_WEBHOOK_SECRET_TOKEN=$ZOOM_WEBHOOK_SECRET_TOKEN
PORT=18801
EOF
chmod 600 "$ENV_FILE"
echo "✓ wrote $ENV_FILE (mode 600)"

# 2. systemd unit
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BNI 121 Zoom webhook listener
After=network-online.target

[Service]
Type=simple
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/python3 $TARGET_PY
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/bni-zoom.log
StandardError=append:/var/log/bni-zoom.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
sleep 1
systemctl status "$SERVICE_NAME" --no-pager | head -10 || true

# 3. nginx route — append a /zoom-webhook block to the hopetech vhost if missing
NGX=/etc/nginx/sites-enabled/hopetech
if ! grep -q 'location /zoom-webhook' "$NGX" 2>/dev/null; then
  python3 - "$NGX" <<'PY'
import sys, re
p = sys.argv[1]
src = open(p).read()
block = """
    # BNI Zoom webhook
    location /zoom-webhook {
        proxy_pass http://127.0.0.1:18801;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30;
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
    echo "✓ nginx /zoom-webhook route added and reloaded"
  else
    echo "WARN: nginx -t failed; revert by editing $NGX manually"
  fi
else
  echo "✓ nginx /zoom-webhook route already present"
fi

# 4. Healthcheck
echo "=== healthcheck ==="
sleep 1
curl -s --max-time 5 https://hopetech.me/zoom-webhook/healthz || echo "(curl failed — check $SERVICE_NAME logs)"
echo
echo "✓ Webhook URL for Zoom Marketplace:  https://hopetech.me/zoom-webhook"
echo "  Subscribe to:  meeting.ended  recording.completed"
echo "  Logs:          journalctl -u $SERVICE_NAME -f   OR   tail -f /var/log/bni-zoom.log"
