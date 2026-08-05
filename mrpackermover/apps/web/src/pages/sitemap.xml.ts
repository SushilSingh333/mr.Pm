import type { APIRoute } from 'astro';
import { manifest } from '../data/manifest.js';
import { SITE_ORIGIN } from '../lib/site.js';

/**
 * Sitemap index (Doc 02 §5). Lists only the shards that actually contain indexable
 * URLs; each shard is generated from the same manifest, so index ↔ shard ↔ site can
 * never drift. `lastmod` is the real max updated_at within the shard.
 */
export const GET: APIRoute = () => {
  const shards = new Map<string, string>();
  for (const page of manifest().pages) {
    if (page.noindex) continue;
    const current = shards.get(page.sitemapShard);
    if (!current || page.lastmod > current) shards.set(page.sitemapShard, page.lastmod);
  }

  const entries = [...shards.entries()]
    .map(
      ([shard, lastmod]) =>
        `  <sitemap><loc>${SITE_ORIGIN}/${shard}</loc><lastmod>${lastmod}</lastmod></sitemap>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
