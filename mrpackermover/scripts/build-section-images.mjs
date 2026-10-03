/**
 * Cut the photographs shown beside page sections from the hero originals in
 * public/images/hero/*.jpg. (The service cards use real photos instead - see
 * build-card-photos.mjs.)
 *
 * The heroes are wide banners (~2.4:1) at 1920px. A side image shows a far smaller,
 * squarer slice, and reusing the 1280px `-narrow.webp` there would cost ~100 KB for a
 * picture drawn ~400px wide. These are cropped to the shape they are shown in and sized
 * for it at 2x.
 *
 * Each crop has its own horizontal focal point, so the slice lands on the action (the
 * sofa being carried, the bubble wrap) rather than the middle of the banner.
 *
 *   images/sections/<name>.webp          840x630 (4:3)   - beside a section
 *
 * Idempotent. Usage (from the repo root):  node scripts/build-section-images.mjs
 */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// sharp is a dependency of @mpm/cms; resolve it from there (see build-hero-variants.mjs).
const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const PUBLIC = path.join('apps', 'web', 'public', 'images');
const HERO = path.join(PUBLIC, 'hero');
const QUALITY = 70;

/** [output name, source hero, focal x (0 = left edge, 1 = right edge)] */
const SECTIONS = [
  // Home "How it works": the crew carrying a sofa out while the family watches.
  ['steps-home', 'home-shifting', 0.36],
  // Home "How we pack": crockery going into a carton, the wrapped sofa, bubble wrap.
  ['packing-detail', 'packing-unpacking', 0.42],
  // Services "What every service includes": the crew at work in a living room.
  ['crew-at-work', 'packing-unpacking', 0.74],
];

async function crop(src, focal, ratio, outW, out) {
  const { width, height } = await sharp(src).metadata();
  const cropW = Math.min(width, Math.round(height * ratio));
  const left = Math.max(0, Math.min(width - cropW, Math.round(focal * width - cropW / 2)));
  await sharp(src)
    .extract({ left, top: 0, width: cropW, height })
    .resize(outW, Math.round(outW / ratio))
    .webp({ quality: QUALITY })
    .toFile(out);
  return (await stat(out)).size;
}

await mkdir(path.join(PUBLIC, 'sections'), { recursive: true });

for (const [name, hero, focal] of SECTIONS) {
  const out = path.join(PUBLIC, 'sections', `${name}.webp`);
  const bytes = await crop(path.join(HERO, `${hero}.jpg`), focal, 4 / 3, 840, out);
  console.log(`sections/${name}.webp  ${(bytes / 1024).toFixed(0)} KB`);
}
