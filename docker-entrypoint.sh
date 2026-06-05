#!/bin/sh
set -e

# ============================================================
# Skills setup: extract skills.zip to global skills dir
# ============================================================
SKILLS_DIR="/root/.pi/agent/skills"
SKILLS_ZIP="/tmp/skills.zip"

if [ -f "$SKILLS_ZIP" ]; then
  echo "[entrypoint] Installing global skills from skills.zip..."
  unzip -o "$SKILLS_ZIP" -d "$SKILLS_DIR" > /dev/null
  rm -f "$SKILLS_ZIP"
  echo "[entrypoint] Skills installed: $(ls -1 $SKILLS_DIR | wc -l) skill(s)"
  ls -1 "$SKILLS_DIR"
elif [ -d /skills ]; then
  # Mounted skills volume (pre-extracted)
  echo "[entrypoint] Using mounted skills from /skills"
  cp -r /skills/* "$SKILLS_DIR/" 2>/dev/null || true
else
  echo "[entrypoint] No skills.zip found, skipping skill installation"
fi

echo "[entrypoint] Starting pi-web-cn on port ${PORT:-30141}..."
exec "$@"
