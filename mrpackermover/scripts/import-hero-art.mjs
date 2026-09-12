/**
 * Bring a folder of supplied hero artwork into the site's hero slots.
 *
 * The brand photography is delivered as ~2.2 MB PNGs with human-readable names
 * ("office shifting (2).png"). The site addresses heroes by slot name — the value a
 * page passes to `<HeroShell image="...">` — and resolves them to
 * public/images/hero/<slot>.jpg plus the WebP variants built by
 * build-hero-variants.mjs. This maps one to the other.
 *
 * The JPEG written here is the *fallback* leg: it is served only to a browser that
 * cannot parse `image-set()`, and used for the small city-card thumbnails. The WebP
 * variants carry the real traffic, so the JPEG is encoded for size over fidelity.
 *
 * Run build-hero-variants.mjs afterwards to regenerate the WebP pair for each slot.
 *
 * Usage (from the repo root):  node scripts/import-hero-art.mjs "D:/mr.Pm/img"
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const SRC_DIR = process.argv[2] ?? 'D:/mr.Pm/img';
const OUT_DIR = path.join('apps', 'web', 'public', 'images', 'hero');
const WIDTH = 1920;
const QUALITY = 78;

/**
 * Supplied filename (lowercased, extension dropped) -> hero slot.
 *
 * Slot names are the site's vocabulary, not the photographer's: they match the
 * service slugs in lib/hero.ts so a page and its artwork are obviously the same
 * subject, which also makes the filename a useful signal to image search.
 */
const SLOT_BY_SOURCE = {
  'home page': 'home',
  'home shifting': 'home-shifting',
  'office shifting (2)': 'office-shifting',
  'car shifting': 'car-transport',
  'bike transport (2)': 'bike-transport',
  international: 'international-relocation',
  'loading and unloading (2)': 'loading-unloading',
  'packing and unpacking (2)': 'packing-unpacking',
  // Pixel-identical to "office shifting (2)", so it maps to the same slot rather
  // than shipping the same photograph twice. Replace with distinct corporate
  // artwork and give it its own slot when there is one.
  'corporate relocation': 'office-shifting',
};

const sources = (await readdir(SRC_DIR)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const unmapped = [];
let inBytes = 0;
let outBytes = 0;

for (const file of sources) {
  const key = path.basename(file, path.extname(file)).toLowerCase();
  const slot = SLOT_BY_SOURCE[key];
  if (!slot) {
    unmapped.push(file);
    continue;
  }
  const src = path.join(SRC_DIR, file);
  const out = path.join(OUT_DIR, `${slot}.jpg`);
  inBytes += (await stat(src)).size;

  await sharp(src)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(out);

  const size = (await stat(out)).size;
  outBytes += size;
  console.info(`  ${file.padEnd(32)} -> ${slot}.jpg  ${(size / 1024).toFixed(0)} KB`);
}

/**
 * A square thumbnail for the city cards.
 *
 * Cities without their own 240x240 artwork fell back to the full hero JPEG - a
 * 1920px, ~216 KB file rendered at 72x72, downloaded on top of the hero's own WebP.
 * One small crop of the same photograph costs a fraction of that and looks the same
 * at the size it is actually displayed.
 */
const heroSource = sources.find(
  (f) => SLOT_BY_SOURCE[path.basename(f, path.extname(f)).toLowerCase()] === 'home',
);
if (heroSource) {
  const thumb = path.join(OUT_DIR, 'cities', '_default.jpg');
  await sharp(path.join(SRC_DIR, heroSource))
    // The middle panel of the montage is the crew-and-carton shot, which reads best
    // as a small square; a centre crop of the full width would be mostly truck.
    .extract({ width: 809, height: 809, left: 560, top: 0 })
    .resize({ width: 240, height: 240 })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(thumb);
  console.info(`
  cities/_default.jpg  ${((await stat(thumb)).size / 1024).toFixed(0)} KB (card fallback)`);
}

if (unmapped.length) {
  console.info(`\n  Not mapped, so not imported: ${unmapped.join(', ')}`);
}

console.info(
  `\n  ${sources.length - unmapped.length} imported` +
    `\n  supplied : ${(inBytes / 1024 / 1024).toFixed(1)} MB` +
    `\n  written  : ${(outBytes / 1024).toFixed(0)} KB (JPEG fallback leg)` +
    `\n\n  Next: node scripts/build-hero-variants.mjs`,
);
