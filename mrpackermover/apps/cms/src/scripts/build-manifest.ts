/**
 * Build the manifest from Payload and write it where Astro reads it (Doc 02 §1).
 *
 * Pipeline: publish gate → eligible page manifest (JSON) → Astro getStaticPaths.
 * This is the ONE database pass; the web build then reads the file from memory.
 * Requires DATABASE_URL + PAYLOAD_SECRET. Run from the repo root: `pnpm build-manifest`
 * (which delegates to `pnpm --filter @mpm/cms build-manifest`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { getPayload } from 'payload';
import config from '../payload.config.js';
import { buildManifest } from '../lib/manifest.js';
import { rebuildInternalLinks } from '../lib/internal-links.js';

// cwd is apps/cms when run via the package script.
const OUT = path.resolve(process.cwd(), '../web/src/data/manifest.json');
const SITE = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  // Refresh the PostGIS-computed link graph (needs geo data; skipped gracefully otherwise).
  try {
    const count = await rebuildInternalLinks();
    console.info(`internal_links refreshed: ${count} edges`);
  } catch (error) {
    console.warn('internal-links refresh skipped:', (error as Error).message);
  }

  const manifest = await buildManifest(payload, SITE);
  fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
  console.info(`Wrote ${manifest.pages.length} pages → ${OUT}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('build-manifest failed:', error);
  process.exit(1);
});
