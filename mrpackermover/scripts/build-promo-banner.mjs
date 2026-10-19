/**
 * Build the home page's promotional banner from the artwork the owner supplies.
 *
 * The artwork is a finished banner - logo, headline, offer and button are part of the
 * picture - so it is shown whole, never cropped by CSS. Two compositions:
 *
 *   <name>-wide.webp / -wide-1280.webp / -wide.jpg
 *       The full banner for screens 760px and wider (1920 and 1280 wide, plus a JPEG
 *       for anything without WebP).
 *   <name>-tall.webp / -tall-480.webp
 *       Phones. The full banner would be ~160px tall on a phone, its text unreadable,
 *       so they get the left-hand text panel on its own (logo, headline, offer,
 *       button) - the artwork is laid out with that panel separate from the photo.
 *
 * The source is a 2 MB PNG; the outputs are what the site serves.
 *
 * Usage (repo root):
 *   node scripts/build-promo-banner.mjs "<source.png>" <name> [panelFraction]
 *   node scripts/build-promo-banner.mjs "D:/mr.Pm/img/A Brighter Start Begins at Home (1).png" diwali-2026 0.48
 *
 * panelFraction: how much of the width, from the left, is the text panel (default 0.48).
 */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// sharp is a dependency of @mpm/cms (see build-hero-variants.mjs for why it is resolved there).
const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const [src, name, fraction = '0.48'] = process.argv.slice(2);
if (!src || !name) {
  console.error('Usage: node scripts/build-promo-banner.mjs <source.png> <name> [panelFraction]');
  process.exit(1);
}
const OUT = path.join('apps', 'web', 'public', 'images', 'promo');
await mkdir(OUT, { recursive: true });

const meta = await sharp(src).metadata();
const W = meta.width ?? 0;
const H = meta.height ?? 0;
const panelW = Math.round(W * Number(fraction));

const jobs = [
  [
    'wide.webp',
    sharp(src)
      .resize({ width: Math.min(1920, W) })
      .webp({ quality: 80 }),
  ],
  ['wide-1280.webp', sharp(src).resize({ width: 1280 }).webp({ quality: 80 })],
  [
    'wide.jpg',
    sharp(src)
      .resize({ width: Math.min(1920, W) })
      .jpeg({ quality: 80, mozjpeg: true }),
  ],
  [
    'tall.webp',
    sharp(src)
      .extract({ left: 0, top: 0, width: panelW, height: H })
      .resize({ width: Math.min(900, panelW) })
      .webp({ quality: 82 }),
  ],
  [
    'tall-480.webp',
    sharp(src)
      .extract({ left: 0, top: 0, width: panelW, height: H })
      .resize({ width: 480 })
      .webp({ quality: 82 }),
  ],
];

console.log(`source ${W}x${H}, phone panel ${panelW}x${H}`);
for (const [suffix, pipe] of jobs) {
  const file = path.join(OUT, `${name}-${suffix}`);
  const info = await pipe.toFile(file);
  const kb = Math.round((await stat(file)).size / 1024);
  console.log(`${file}  ${info.width}x${info.height}  ${kb} KB`);
}
