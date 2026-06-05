#!/bin/sh
set -e

# ============================================================
# Skills setup: extract skills.zip to global skills dir
# ============================================================
SKILLS_DIR="/root/.pi/agent/skills"
SKILLS_ZIP="/tmp/skills.zip"
SKILLS_DONE="/root/.pi/agent/.skills-installed"

if [ -f "$SKILLS_DONE" ]; then
  echo "[entrypoint] Skills already installed, skipping"
elif [ -f "$SKILLS_ZIP" ]; then
  echo "[entrypoint] Installing global skills from skills.zip..."
  unzip -o "$SKILLS_ZIP" -d "$SKILLS_DIR" > /dev/null
  touch "$SKILLS_DONE"
  echo "[entrypoint] Skills installed: $(ls -1 $SKILLS_DIR | wc -l) skill(s)"
  ls -1 "$SKILLS_DIR"
else
  echo "[entrypoint] No skills.zip found, skipping skill installation"
fi

echo "[entrypoint] Starting pi-web-cn on port ${PORT:-30141}..."
exec "$@"
