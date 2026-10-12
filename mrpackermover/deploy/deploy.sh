#!/usr/bin/env bash
#
# Build the site from the CMS and publish it, then refresh the Cloudflare cache.
# Designed to run ON the droplet (where DATABASE_URL points at the local Postgres),
# triggered by the CMS publish webhook or by hand. For larger sites, move this to CI
# and expose Postgres to the runner via a Cloudflare Tunnel.
#
#   DEPLOY_PATH   where Caddy serves from   (default /var/www/mrpackermover)
#   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID   for the cache purge (optional)
#   INDEXNOW_KEY   tells Bing and others about new pages after each deploy (optional)
#   LOCALITY_RELEASE_START   first day of the locality release batches (geo-pages/release.ts)
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

# The SEO gates (sitemap parity, canonicals, inbound links, no dead links, duplicate
# titles…). A red gate stops here, so the site that is live stays live.
echo "→ Checking the build (SEO gates)…"
pnpm check

# Which pages are new or changed against what is live now, for IndexNow (step after the
# purge). The key file has to ship with the site: rsync --delete removes anything else.
INDEXNOW_LIST="$(mktemp)"
node scripts/indexnow.mjs diff "$DEPLOY_PATH" apps/web/dist "$INDEXNOW_LIST" || true
if [ -n "${INDEXNOW_KEY:-}" ]; then
	printf '%s' "$INDEXNOW_KEY" > "apps/web/dist/${INDEXNOW_KEY}.txt"
fi

echo "→ Publishing to ${DEPLOY_PATH}…"
mkdir -p "$DEPLOY_PATH"
rsync -a --delete apps/web/dist/ "$DEPLOY_PATH/"

echo "→ Refreshing the Cloudflare cache…"
node scripts/purge-cache.mjs

echo "→ Telling search engines about new pages (IndexNow)…"
node scripts/indexnow.mjs submit "$INDEXNOW_LIST" || true
rm -f "$INDEXNOW_LIST"

echo "✅ Deploy complete."
