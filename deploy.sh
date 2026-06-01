#!/bin/bash
# BNI 121 — one-shot deploy from GitHub to the Hostinger VPS.
#
#   Usage on the VPS (paste this single line in any terminal):
#     curl -sL https://raw.githubusercontent.com/chatgptnotes/bni121/main/1backup/BNI%20121/deploy.sh | bash
#
#   Edits the deploy target by setting BNI_TARGET=/path/to/bni before piping.
#   Default target: /var/www/bni
#
#   Cron-friendly: only redeploys when the remote main commit SHA differs
#   from the SHA recorded in $TARGET/.deployed-sha. Re-running with no new
#   commits exits silently.
#
# Auto-deploy install (runs deploy every minute when there's a new commit):
#     curl -sL .../deploy.sh | BNI_INSTALL_CRON=1 bash

set -euo pipefail

TARGET="${BNI_TARGET:-/var/www/bni}"
TMPDIR="${TMPDIR:-/tmp}/bni-deploy-$$"
REPO_URL="https://github.com/chatgptnotes/bni121.git"
RAW_BASE="https://raw.githubusercontent.com/chatgptnotes/bni121/main"
SUBDIR="1backup/BNI 121"
LOG="${BNI_LOG:-/var/log/bni-deploy.log}"

# ── auto-install cron mode ──────────────────────────────────────────────────
if [ "${BNI_INSTALL_CRON:-0}" = "1" ]; then
  SCRIPT_PATH="/usr/local/bin/bni-deploy.sh"
  echo "→ installing cron-driven auto-deploy"
  curl -sL "$RAW_BASE/1backup/BNI%20121/deploy.sh" -o "$SCRIPT_PATH"
  chmod +x "$SCRIPT_PATH"
  CRON_LINE="* * * * * BNI_TARGET=$TARGET $SCRIPT_PATH >> $LOG 2>&1"
  ( crontab -l 2>/dev/null | grep -v 'bni-deploy.sh' ; echo "$CRON_LINE" ) | crontab -
  echo "✓ cron installed:"
  echo "  $CRON_LINE"
  echo "  log: $LOG"
  echo "  uninstall: crontab -l | grep -v bni-deploy.sh | crontab -"
  exit 0
fi

if [ ! -d "$TARGET" ]; then
  echo "ERROR: target directory $TARGET does not exist"
  exit 1
fi

# ── self-update: pull the latest deploy.sh from GitHub on every run ─────────
# Lets the cron's local /usr/local/bin/bni-deploy.sh stay in sync with the
# repo without the user re-running BNI_INSTALL_CRON=1 every time the deploy
# logic changes. Skipped if BNI_NO_SELF_UPDATE=1 (used by the re-exec).
if [ "${BNI_NO_SELF_UPDATE:-0}" != "1" ] && [ -w "$0" ]; then
  LATEST="$(curl -sL --max-time 10 "$RAW_BASE/1backup/BNI%20121/deploy.sh" 2>/dev/null || true)"
  if [ -n "$LATEST" ]; then
    CUR="$(cat "$0" 2>/dev/null || true)"
    if [ "$LATEST" != "$CUR" ]; then
      printf '%s' "$LATEST" > "$0.new"
      chmod +x "$0.new"
      mv "$0.new" "$0"
      exec env BNI_NO_SELF_UPDATE=1 "$0" "$@"
    fi
  fi
fi

# ── only-deploy-on-change check (cheap remote SHA peek) ─────────────────────
REMOTE_SHA="$(git ls-remote "$REPO_URL" main 2>/dev/null | awk '{print $1}')"
LOCAL_SHA="$(cat "$TARGET/.deployed-sha" 2>/dev/null || true)"
if [ -n "$REMOTE_SHA" ] && [ "$REMOTE_SHA" = "$LOCAL_SHA" ]; then
  # No new commits — silent exit so cron output stays clean.
  exit 0
fi

echo "──────────────────────────────────────────────"
echo "BNI 121 deploy — $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "  source : $REPO_URL  (main @ ${REMOTE_SHA:0:8})"
echo "  target : $TARGET"
echo "──────────────────────────────────────────────"

mkdir -p "$TMPDIR"
trap 'rm -rf "$TMPDIR"' EXIT

git clone --depth 1 --quiet "$REPO_URL" "$TMPDIR/repo"
SRC="$TMPDIR/repo/$SUBDIR/"
[ -d "$SRC" ] || { echo "ERROR: $SUBDIR not in repo"; exit 2; }

if command -v rsync >/dev/null 2>&1; then
  # --exclude=index.html: the root index.html is the public hopetech.me
  # landing page, owned outside this repo. Never overwrite it.
  rsync -av --backup --suffix=.bak --exclude='index.html' "$SRC" "$TARGET/"
else
  # cp fallback — same exclusion via a temp filtered copy of $SRC.
  TMPSRC="$TMPDIR/sync"
  mkdir -p "$TMPSRC"
  cp -a "$SRC"/. "$TMPSRC/"
  rm -f "$TMPSRC/index.html"
  cp -av "$TMPSRC/." "$TARGET/"
fi

echo "$REMOTE_SHA" > "$TARGET/.deployed-sha"
echo
echo "✓ DEPLOYED  $(date '+%Y-%m-%d %H:%M:%S %Z')   sha=${REMOTE_SHA:0:8}"
echo "  Visit:  https://hopetech.me/bni/teams.html"
