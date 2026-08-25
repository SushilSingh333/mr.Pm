#!/usr/bin/env bash
#
# Safe production build for the Payload/Next CMS.
#
# Why this exists: `next build` deletes `.next` before it starts compiling. If the build
# then fails, the droplet is left with no build output at all, so the systemd unit
# crash-loops and the admin panel goes down — a broken commit becomes an outage.
#
# This wrapper makes a failed build a no-op:
#   1. Typecheck first, so the common failure never touches `.next` at all.
#   2. Move the working `.next` aside instead of letting Next delete it.
#   3. Build. On success, drop the backup. On any failure, put the old build back.
#
# It exits non-zero on failure so the caller does NOT restart the service — the old
# build keeps serving. Run it from anywhere; paths resolve relative to this script.
#
# Usage:  bash deploy/build-cms.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CMS_DIR="$REPO_ROOT/apps/cms"
NEXT_DIR="$CMS_DIR/.next"
BACKUP_DIR="$CMS_DIR/.next.previous"

cd "$REPO_ROOT"

echo "→ Typechecking the CMS before touching the running build…"
if ! pnpm --filter @mpm/cms typecheck; then
	echo "✗ Typecheck failed. The running admin panel is untouched; nothing was rebuilt." >&2
	exit 1
fi

# Clear any backup left behind by a previous interrupted run.
rm -rf "$BACKUP_DIR"

RESTORED=0
restore_previous() {
	# Only meaningful if we actually moved a build aside.
	if [ "$RESTORED" -eq 0 ] && [ -d "$BACKUP_DIR" ]; then
		echo "✗ Build failed — restoring the previous build so the admin stays up." >&2
		rm -rf "$NEXT_DIR"
		mv "$BACKUP_DIR" "$NEXT_DIR"
		RESTORED=1
	fi
}
trap restore_previous EXIT

if [ -d "$NEXT_DIR" ]; then
	echo "→ Setting the current build aside (restored automatically if the build fails)…"
	mv "$NEXT_DIR" "$BACKUP_DIR"
fi

echo "→ Building the CMS…"
if ! pnpm --filter @mpm/cms build; then
	# The EXIT trap performs the restore.
	exit 1
fi

# Success: keep the new build, discard the backup, and disarm the trap.
RESTORED=1
trap - EXIT
rm -rf "$BACKUP_DIR"

echo "✅ CMS build complete. Safe to restart mrpackermover-cms."
