#!/usr/bin/env bash
#
# Install the systemd units with paths that match THIS clone.
#
# systemd will not accept relative paths, so the committed unit files have to hardcode
# absolute ones. That broke repeatedly because the pnpm project is nested one level
# inside the repo (…/repo/mrpackermover), while the units assumed the project was the
# repo root. Rather than expecting everyone to hand-edit them on the server, this script
# derives the real paths from its own location and writes corrected units.
#
# Usage:  sudo bash deploy/install-units.sh
#         sudo systemctl daemon-reload
#         sudo systemctl enable --now mrpackermover-cms mrpackermover-deploy
#
# Re-run it after moving the clone; it simply rewrites the units.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"   # the pnpm workspace (has package.json)
UNIT_DEST="${UNIT_DEST:-/etc/systemd/system}"

# The path baked into the committed units. Everything below rewrites it to PROJECT_ROOT.
PLACEHOLDER='/srv/mrpackermover/repo/mrpackermover'

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
	echo "✗ $PROJECT_ROOT has no package.json — is deploy/ still inside the project?" >&2
	exit 1
fi

if [ ! -f "$PROJECT_ROOT/apps/cms/.env" ]; then
	echo "! Warning: $PROJECT_ROOT/apps/cms/.env does not exist yet." >&2
	echo "  Both units load it via EnvironmentFile and will fail to start without it." >&2
fi

if [ ! -d "$UNIT_DEST" ]; then
	echo "✗ $UNIT_DEST does not exist. Is this a systemd host?" >&2
	exit 1
fi

echo "→ Project root: $PROJECT_ROOT"
echo "→ Installing units into $UNIT_DEST"

for unit in mrpackermover-cms.service mrpackermover-deploy.service; do
	src="$DEPLOY_DIR/$unit"
	if [ ! -f "$src" ]; then
		echo "✗ Missing $src" >&2
		exit 1
	fi
	# Substitute the baked-in path for this clone's real one.
	sed "s#${PLACEHOLDER}#${PROJECT_ROOT}#g" "$src" > "$UNIT_DEST/$unit"
	echo "  installed $unit"
done

echo
echo "✅ Units installed. Now run:"
echo "     sudo systemctl daemon-reload"
echo "     sudo systemctl enable --now mrpackermover-cms mrpackermover-deploy"
