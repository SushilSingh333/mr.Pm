/**
 * Build the share images: the picture WhatsApp, Facebook, LinkedIn and X show when
 * someone shares a link to the site. Most moving quotes in India are passed around on
 * WhatsApp, and a link with no og:image arrives as a bare grey box.
 *
 *   apps/web/public/images/hero/<name>.jpg   the banner photographs (source)
 *   apps/web/public/og/<name>.jpg            1200x630, what a shared link shows
 *
 * 1200x630 (1.91:1) is the size every one of those apps crops to. Each image is the page's
 * own banner photo, cropped to that shape, with the MrMoverPacker mark in a white badge in
 * the bottom-left corner, the same badge as the service cards (build-card-photos.mjs).
 * Which page uses which image is decided in apps/web/src/lib/share.ts.
 *
 * Idempotent. Usage (from the repo root):  node scripts/build-share-images.mjs
 */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// sharp is a dependency of @mpm/cms; resolve it from there (see build-card-photos.mjs).
const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const SRC = path.join('apps', 'web', 'public', 'images', 'hero');
const OUT = path.join('apps', 'web', 'public', 'og');
const LOGO = path.join('apps', 'web', 'public', 'logo.png');
const W = 1200;
const H = 630;
const QUALITY = 80;
const INSET = 40;

/** The banner photos, by name. `home` is the default for every page without its own. */
const IMAGES = [
  'home',
  'home-shifting',
  'office-shifting',
  'car-transport',
  'bike-transport',
  'international-relocation',
  'loading-unloading',
  'packing-unpacking',
];

/** The white badge carrying the wordmark, as a PNG buffer. */
async function badge() {
  const logoW = 230;
  const logo = await sharp(LOGO).resize({ width: logoW }).png().toBuffer();
  const { height: logoH } = await sharp(logo).metadata();
  const padX = 22;
  const padY = 14;
  const bw = logoW + padX * 2;
  const bh = logoH + padY * 2;
  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}">
       <rect width="${bw}" height="${bh}" rx="18" fill="#fff" fill-opacity="0.95"/>
     </svg>`,
  );
  return sharp(plate)
    .composite([{ input: logo, left: padX, top: padY }])
    .png()
    .toBuffer();
}

/** A soft shadow under the badge so it reads on a light wall as well as a dark road. */
async function shadow(bw, bh) {
  const pad = 24;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bw + pad * 2}" height="${bh + pad * 2}">
       <rect x="${pad}" y="${pad + 3}" width="${bw}" height="${bh}" rx="18" fill="#000" fill-opacity="0.3"/>
     </svg>`,
  );
  return { buf: await sharp(svg).blur(8).png().toBuffer(), pad };
}

await mkdir(OUT, { recursive: true });
const mark = await badge();
const { width: bw, height: bh } = await sharp(mark).metadata();
const sh = await shadow(bw, bh);

for (const name of IMAGES) {
  const out = path.join(OUT, `${name}.jpg`);
  await sharp(path.join(SRC, `${name}.jpg`))
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .composite([
      { input: sh.buf, left: INSET - sh.pad, top: H - INSET - bh - sh.pad },
      { input: mark, left: INSET, top: H - INSET - bh },
    ])
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(out);
  console.log(`og/${name}.jpg  ${((await stat(out)).size / 1024).toFixed(0)} KB`);
}
