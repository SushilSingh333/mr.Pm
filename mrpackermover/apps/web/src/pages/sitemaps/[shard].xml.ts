import type { APIRoute, GetStaticPaths } from 'astro';
import { manifest } from '../../data/manifest.js';

/**
 * Per-family sitemap shard (Doc 02 §5). One shard per page family → per-family
 * indexation is readable in GSC. Only canonical, indexable, 200 URLs; lastmod is
 * the real updated_at; no priority/changefreq. CI asserts manifest ↔ shard parity.
 */
export const getStaticPaths: GetStaticPaths = () => {
  const shards = new Set<string>();
  for (const page of manifest().pages) {
    // sitemapShard looks like "sitemaps/core.xml"; the route param is "core.xml".
    shards.add(page.sitemapShard.replace(/^sitemaps\//, ''));
  }
  return [...shards].map((shard) => ({ params: { shard: shard.replace(/\.xml$/, '') } }));
};

export const GET: APIRoute = ({ params }) => {
  const shardFile = `sitemaps/${params.shard}.xml`;
  const urls = manifest()
    .pages.filter((p) => p.sitemapShard === shardFile && !p.noindex)
    .map((p) => `  <url><loc>${p.canonical}</loc><lastmod>${p.lastmod}</lastmod></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
