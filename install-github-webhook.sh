#!/bin/bash
# BNI 121 — install the GitHub webhook listener (systemd unit + nginx route).
# Run ONCE on the VPS:
#
#   curl -sL https://raw.githubusercontent.com/chatgptnotes/bni121/main/1backup/BNI%20121/install-github-webhook.sh | bash
#
# Listener: 127.0.0.1:18802 (proxied at https://hopetech.me/github-webhook).

set -euo pipefail

ENV_FILE=/etc/bni-github.env
SERVICE=bni-github-webhook
SERVICE_FILE=/etc/systemd/system/$SERVICE.service
TARGET_PY=/var/www/bni/github_webhook.py

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

prompt_secret SUPABASE_SERVICE_ROLE_KEY "Supabase service-role key (eyJ…)"
prompt_secret GITHUB_WEBHOOK_SECRET     "GitHub webhook secret (you'll paste this same value into the GitHub UI)"

SUPABASE_URL="${SUPABASE_URL:-https://bvaefzcsgtgqwftczixb.supabase.co}"

[ -f "$TARGET_PY" ] || { echo "ERROR: $TARGET_PY not deployed yet. Wait 60 s for the cron to deploy, then re-run."; exit 2; }
chmod +x "$TARGET_PY"

umask 077
cat > "$ENV_FILE" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
GITHUB_WEBHOOK_SECRET=$GITHUB_WEBHOOK_SECRET
PORT=18802
EOF
chmod 600 "$ENV_FILE"
echo "✓ wrote $ENV_FILE (mode 600)"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BNI 121 GitHub webhook listener
After=network-online.target

[Service]
Type=simple
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/python3 $TARGET_PY
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/bni-github.log
StandardError=append:/var/log/bni-github.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE"
sleep 1

NGX=/etc/nginx/sites-enabled/hopetech
if ! grep -q 'location /github-webhook' "$NGX" 2>/dev/null; then
  python3 - "$NGX" <<'PY'
import sys, re
p = sys.argv[1]
src = open(p).read()
block = """
    # BNI GitHub webhook
    location /github-webhook {
        proxy_pass http://127.0.0.1:18802;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30;
        proxy_connect_timeout 5;
    }
"""
new = re.sub(r'(\n\s*location\s*/\s*\{)', block + r'\1', src, count=1)
if new == src:
    new = src.rstrip() + "\n" + block + "\n"
open(p, 'w').write(new)
PY
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo "✓ nginx /github-webhook route added and reloaded"
  else
    echo "WARN: nginx -t failed; revert by editing $NGX manually"
  fi
else
  echo "✓ nginx /github-webhook route already present"
fi

echo "=== healthcheck ==="
curl -s --max-time 5 https://hopetech.me/github-webhook/healthz || echo "(curl failed — check logs)"
echo
echo "✓ Webhook URL for GitHub:  https://hopetech.me/github-webhook"
echo "  Secret:                   (the one you just entered)"
echo "  Content type:             application/json"
echo "  Events to subscribe:      Just the push event (the 'individual events' radio)"
echo "  Logs:                     journalctl -u $SERVICE -f   OR   tail -f /var/log/bni-github.log"
