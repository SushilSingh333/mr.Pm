import fs from 'node:fs';
import path from 'node:path';
import { parseManifest, type Manifest, type ManifestRow, type PageType } from '@mpm/shared';

/**
 * Load the build manifest (Doc 02 §1) — the ONLY source Astro reads. If the
 * pipeline has generated `manifest.json` (from Payload via the publish gate) we use
 * it; otherwise we fall back to the committed `manifest.sample.json` so the site
 * builds and the templates render without a database (useful for design + CI).
 *
 * The path is resolved from the app root (process.cwd() is apps/web during
 * dev/build) rather than import.meta.url, because Astro relocates this module into
 * dist/chunks when it bundles — which would break a module-relative path.
 *
 * Read once, cached in memory: getStaticPaths across every template shares this.
 */
const dataDir = path.resolve(process.cwd(), 'src/data');

function read(): Manifest {
  const generated = path.join(dataDir, 'manifest.json');
  const sample = path.join(dataDir, 'manifest.sample.json');
  const file = fs.existsSync(generated) ? generated : sample;
  return parseManifest(JSON.parse(fs.readFileSync(file, 'utf8')));
}

let cached: Manifest | null = null;
export function manifest(): Manifest {
  return (cached ??= read());
}

export function rowsOfType(type: PageType): ManifestRow[] {
  return manifest().pages.filter((p) => p.pageType === type);
}

export function rowByPath(p: string): ManifestRow | undefined {
  return manifest().pages.find((r) => r.path === p);
}

/** Narrow a row's `data` blob to a page-data shape (the CMS guarantees the shape). */
export function dataOf<T>(row: ManifestRow): T {
  return row.data as T;
}
