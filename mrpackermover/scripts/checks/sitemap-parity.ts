import { SITEMAP_SHARDS } from '@mpm/shared';
import { loadManifest, fail, type CheckResult } from './load.js';

/**
 * Sitemap parity (Doc 02 §5): every indexable manifest row belongs to exactly one
 * known shard. Since the sitemaps are generated FROM the manifest, this structural
 * check is what guarantees index ↔ shard ↔ site can never drift.
 */
export function checkSitemapParity(): CheckResult {
  const m = loadManifest();
  const validShards = new Set<string>(Object.values(SITEMAP_SHARDS));
  const messages: string[] = [];

  for (const page of m.pages) {
    if (page.noindex) continue;
    if (!validShards.has(page.sitemapShard)) {
      messages.push(`${page.path}: unknown sitemap shard "${page.sitemapShard}"`);
    }
  }
  return fail('sitemap-parity', messages);
}
