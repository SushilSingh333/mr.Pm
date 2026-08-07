#!/usr/bin/env bash
#
# Build the site from the CMS and publish it, then refresh the Cloudflare cache.
# Designed to run ON the droplet (where DATABASE_URL points at the local Postgres),
# triggered by the CMS publish webhook or by hand. For larger sites, move this to CI
# and expose Postgres to the runner via a Cloudflare Tunnel.
#
#   DEPLOY_PATH   where Caddy serves from   (default /var/www/mrpackermover)
#   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID   for the cache purge (optional)
#
# Usage:  DEPLOY_PATH=/var/www/mrpackermover bash deploy/deploy.sh
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/mrpackermover}"
cd "$(dirname "$0")/.."

# Load DATABASE_URL (for build-manifest) and CLOUDFLARE_* (for the purge) from the
# CMS env file, if present, so this script is self-contained on the droplet.
if [ -f apps/cms/.env ]; then
	set -a
	. ./apps/cms/.env
	set +a
fi

echo "→ Building the manifest from the CMS (publish gate)…"
pnpm build-manifest

echo "→ Building the static site…"
pnpm --filter @mpm/web build

echo "→ Publishing to ${DEPLOY_PATH}…"
mkdir -p "$DEPLOY_PATH"
rsync -a --delete apps/web/dist/ "$DEPLOY_PATH/"

echo "→ Refreshing the Cloudflare cache…"
node scripts/purge-cache.mjs

echo "✅ Deploy complete."
