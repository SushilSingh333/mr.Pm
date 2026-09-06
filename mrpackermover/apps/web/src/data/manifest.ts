import fs from 'node:fs';
import path from 'node:path';
import {
  parseManifest,
  type Manifest,
  type ManifestRow,
  type PageType,
  type JobPosting,
} from '@mpm/shared';

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
let cachedMtimeMs = 0;

/**
 * In production the manifest is written once before the build, so it is read once and
 * kept in memory for the whole run.
 *
 * In dev the file is rewritten by `pnpm build-manifest` while the server is running,
 * and this module reads it with `fs` rather than importing it — so Vite has no idea it
 * is a dependency and never invalidates. The cache therefore held the manifest from
 * whenever the dev server booted, and CMS edits appeared to do nothing until it was
 * restarted. Re-stat the file per call in dev (a stat is ~microseconds, and dev is not
 * the hot path) and re-parse only when the mtime moves.
 */
export function manifest(): Manifest {
  if (!import.meta.env.DEV) return (cached ??= read());
  const generated = path.join(dataDir, 'manifest.json');
  const sample = path.join(dataDir, 'manifest.sample.json');
  const file = fs.existsSync(generated) ? generated : sample;
  const mtimeMs = fs.statSync(file).mtimeMs;
  if (!cached || mtimeMs !== cachedMtimeMs) {
    cached = read();
    cachedMtimeMs = mtimeMs;
  }
  return cached;
}

export function rowsOfType(type: PageType): ManifestRow[] {
  return manifest().pages.filter((p) => p.pageType === type);
}

export function rowByPath(p: string): ManifestRow | undefined {
  return manifest().pages.find((r) => r.path === p);
}

/** Open careers postings (from the CMS Jobs collection). */
export function jobs(): JobPosting[] {
  return manifest().jobs ?? [];
}

/** Narrow a row's `data` blob to a page-data shape (the CMS guarantees the shape). */
export function dataOf<T>(row: ManifestRow): T {
  return row.data as T;
}
