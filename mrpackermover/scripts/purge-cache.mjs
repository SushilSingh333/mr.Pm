/**
 * Purge the Cloudflare cache after a deploy so visitors get the fresh HTML.
 *
 * On Cloudflare's Free/Pro plans, cache-tag and by-prefix purge are Enterprise-only,
 * so this purges either an explicit list of URLs (preferred — only the changed pages)
 * or everything (simple fallback; fine for a low-edit-frequency SEO site, and the
 * cold-cache burst is absorbed by `stale-while-revalidate`).
 *
 * Env:  CLOUDFLARE_API_TOKEN  (a token with the "Zone → Cache Purge" permission)
 *       CLOUDFLARE_ZONE_ID    (the zone id for the site's domain)
 *
 * Usage:
 *   node scripts/purge-cache.mjs                          # purge everything
 *   node scripts/purge-cache.mjs https://site/a https://site/b   # purge these URLs
 *   node scripts/purge-cache.mjs --file changed-urls.txt  # purge URLs from a file
 */
import fs from 'node:fs';

const token = process.env.CLOUDFLARE_API_TOKEN;
const zone = process.env.CLOUDFLARE_ZONE_ID;

if (!token || !zone) {
  const msg = 'Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID.';
  // Don't fail the deploy just because the cache token isn't wired yet, unless asked.
  if (process.env.PURGE_REQUIRED) {
    console.error(`${msg} (PURGE_REQUIRED set)`);
    process.exit(1);
  }
  console.warn(`${msg} Skipping cache purge.`);
  process.exit(0);
}

const args = process.argv.slice(2);
let urls = [];
const fileFlag = args.indexOf('--file');
if (fileFlag !== -1) {
  const file = args[fileFlag + 1];
  urls = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
} else {
  urls = args.filter((a) => a.startsWith('http'));
}

const endpoint = `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`;
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

async function purge(body) {
  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    console.error('Cloudflare purge failed:', JSON.stringify(data.errors ?? data));
    process.exit(1);
  }
}

if (urls.length === 0) {
  console.info('Purging everything…');
  await purge({ purge_everything: true });
} else {
  // Cloudflare accepts up to 30 URLs per purge request.
  for (let i = 0; i < urls.length; i += 30) {
    await purge({ files: urls.slice(i, i + 30) });
  }
  console.info(`Purged ${urls.length} URL(s).`);
}
console.info('✅ Cloudflare cache purged.');
