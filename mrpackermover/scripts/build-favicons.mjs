/**
 * Build every site icon from the one source, apps/web/public/favicon.svg.
 *
 * Browsers are happy with the SVG alone. Google's search results are not: they showed a
 * grey globe beside mrmoverpacker.com, because Google wants a square raster icon in a
 * multiple of 48px, found from the home page or at /favicon.ico - and an SVG-only site
 * gives it neither. So the same pin is rendered to every size anything asks for:
 *
 *   favicon.ico            16 + 32 + 48 in one file - the address every crawler and old
 *                          browser tries first, and the 48px Google's minimum
 *   favicon-96x96.png      a multiple of 48, for Google's results page on sharp screens
 *   apple-touch-icon.png   180, full-bleed: iOS fills transparent corners with black
 *   icon-192.png, icon-512.png       for site.webmanifest (Android, "Add to home screen")
 *   icon-maskable-512.png  full-bleed, for launchers that cut their own shape; the pin
 *                          sits inside the 80% safe circle
 *
 * The SVG is rendered at high density and scaled down, so the small sizes stay crisp.
 *
 * Usage (repo root):  node scripts/build-favicons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// sharp is a dependency of @mpm/cms (see build-hero-variants.mjs for why it is resolved there).
const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const PUBLIC = path.join('apps', 'web', 'public');
const svg = await readFile(path.join(PUBLIC, 'favicon.svg'), 'utf8');
// The same icon with square corners, for the places that fill or cut corners themselves.
const fullBleed = svg.replace(/\srx="[^"]*"/, '');

const png = (source, size) =>
  sharp(Buffer.from(source), { density: 1200 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

/** An .ico holding PNG images - every browser and crawler since Vista reads this form. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const dir = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...images.map((i) => i.data)]);
}

const out = async (name, data) => {
  await writeFile(path.join(PUBLIC, name), data);
  console.log(`${name.padEnd(24)} ${String(data.length).padStart(6)} bytes`);
};

await out(
  'favicon.ico',
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(svg, size) })))),
);
await out('favicon-96x96.png', await png(svg, 96));
await out('apple-touch-icon.png', await png(fullBleed, 180));
await out('icon-192.png', await png(svg, 192));
await out('icon-512.png', await png(svg, 512));
await out('icon-maskable-512.png', await png(fullBleed, 512));
