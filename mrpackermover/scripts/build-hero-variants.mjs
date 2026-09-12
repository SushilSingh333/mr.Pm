/**
 * Generate WebP variants of the hero photographs.
 *
 * The heroes are the Largest Contentful Paint element on nearly every page, and they
 * shipped as 1920px JPEGs of ~300 KB each — `home.jpg` alone is the LCP on 390 of the
 * 435 pages. On a throttled mobile connection that one download is the dominant cost
 * of the page appearing at all.
 *
 * Two variants per photo, both WebP:
 *
 *   <name>-full.webp     Identical dimensions to the JPEG, so the desktop rendering
 *                        is pixel-for-pixel what it was. Only the encoding changes.
 *   <name>-narrow.webp   Capped at 1280px for small viewports. 1280 still oversamples
 *                        a 412px viewport at 2.6x DPR (which needs ~1080px), so a
 *                        phone loads far fewer bytes without losing any detail it
 *                        could actually resolve.
 *
 * The suffixes are fixed words rather than pixel widths so the markup can reference
 * them without knowing each photo's dimensions — they are not all 1920 wide.
 *
 * The original .jpg files stay in place and remain the fallback for anything that
 * cannot parse `image-set()`, so no browser loses its hero.
 *
 * Idempotent: re-running regenerates both variants from the same JPEG sources.
 *
 * Usage (from the repo root):  node scripts/build-hero-variants.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// sharp is a dependency of @mpm/cms, not of the workspace root, and pnpm's strict
// node_modules means a root-level `import 'sharp'` will not resolve. Resolve it from
// the package that actually declares it rather than adding a second copy to the tree.
const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const SRC = path.join('apps', 'web', 'public', 'images', 'hero');
const QUALITY = 78;
const NARROW_WIDTH = 1280;

const sources = (await readdir(SRC)).filter((f) => f.endsWith('.jpg'));
if (sources.length === 0) {
  console.error('No .jpg files found in ' + SRC);
  process.exit(1);
}

let jpegBytes = 0;
let fullBytes = 0;
let narrowBytes = 0;

for (const file of sources) {
  const base = path.basename(file, '.jpg');
  const src = path.join(SRC, file);
  const { width } = await sharp(src).metadata();
  jpegBytes += (await stat(src)).size;

  const narrowWidth = Math.min(NARROW_WIDTH, width);
  for (const [suffix, w] of [
    ['narrow', narrowWidth],
    ['full', width],
  ]) {
    const out = path.join(SRC, base + '-' + suffix + '.webp');
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(out);
    const size = (await stat(out)).size;
    if (suffix === 'full') fullBytes += size;
    else narrowBytes += size;
  }
  console.info('  ' + base + ': ' + narrowWidth + 'w + ' + width + 'w');
}

const pct = (bytes) => (100 - (bytes / jpegBytes) * 100).toFixed(0) + '% smaller';
const kb = (bytes) => (bytes / 1024).toFixed(0).padStart(4) + ' KB';

console.info(
  '\n  ' +
    sources.length +
    ' photos\n' +
    '  JPEG originals : ' +
    kb(jpegBytes) +
    '\n' +
    '  WebP full      : ' +
    kb(fullBytes) +
    '   ' +
    pct(fullBytes) +
    ', identical dimensions\n' +
    '  WebP narrow    : ' +
    kb(narrowBytes) +
    '   ' +
    pct(narrowBytes) +
    ', what a phone loads',
);
