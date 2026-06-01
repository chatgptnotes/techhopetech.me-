#!/bin/bash
# BNI 121 — install the WhatsApp drip worker cron on this VPS.
# Run ONCE on the VPS. Idempotent.
#
#   curl -sL https://raw.githubusercontent.com/chatgptnotes/bni121/main/1backup/BNI%20121/install-drip-worker.sh | bash
#
# Reads the service-role key + OpenClaw token interactively (or from env
# vars SUPABASE_SERVICE_ROLE_KEY and OPENCLAW_TOKEN if already exported).

set -euo pipefail

ENV_FILE=/etc/bni-drip.env
WORKER=/usr/local/bin/bni-drip-worker.py
TARGET_PY=/var/www/bni/drip_worker.py
CRON_LINE="*/5 * * * * $WORKER >> /var/log/bni-drip.log 2>&1"

prompt_secret() {
  local var="$1" label="$2"
  local cur="${!var-}"
  if [ -z "$cur" ]; then
    # Read from the controlling terminal even when this script is piped
    # from curl (otherwise read sees EOF on stdin).
    read -r -s -p "$label: " val </dev/tty
    echo
    printf -v "$var" '%s' "$val"
    export "$var"
  fi
}

prompt_secret SUPABASE_SERVICE_ROLE_KEY "Supabase service-role key (eyJ…)"
prompt_secret OPENCLAW_TOKEN             "OpenClaw bearer token"

SUPABASE_URL="${SUPABASE_URL:-https://bvaefzcsgtgqwftczixb.supabase.co}"
OPENCLAW_HOST="${OPENCLAW_HOST:-https://hopetech.me/openclaw-api}"

umask 077
cat > "$ENV_FILE" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
OPENCLAW_HOST=$OPENCLAW_HOST
OPENCLAW_TOKEN=$OPENCLAW_TOKEN
EOF
chmod 600 "$ENV_FILE"
echo "✓ wrote $ENV_FILE (mode 600)"

# Symlink so cron runs the auto-deployed copy from the repo
[ -f "$TARGET_PY" ] || { echo "ERROR: $TARGET_PY not found — wait for the next deploy tick"; exit 2; }
chmod +x "$TARGET_PY"
ln -sf "$TARGET_PY" "$WORKER"
echo "✓ symlinked $WORKER → $TARGET_PY"

# Install/refresh cron line
( crontab -l 2>/dev/null | grep -v "bni-drip-worker" ; echo "$CRON_LINE" ) | crontab -
echo "✓ cron installed: $CRON_LINE"

# Smoke test
echo "=== smoke test (one manual run) ==="
"$WORKER" || true
echo "✓ done — log at /var/log/bni-drip.log"
