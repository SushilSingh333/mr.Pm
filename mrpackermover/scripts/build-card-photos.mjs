/**
 * Build the service-card photographs: real photos of each kind of job, cropped to the
 * card and stamped with the MrMoverPacker mark.
 *
 *   assets/card-photos/<slug>.jpg              originals, from Pexels
 *   assets/card-photos/SOURCES.md              where each came from (written here)
 *   apps/web/public/images/cards/<slug>.webp   600x375 (16:10), what the card shows
 *   apps/web/src/data/card-photos.json         alt text per card, read by ServicesGrid,
 *                                              so the words describing a photo live
 *                                              beside the crop that made it
 *
 * Choosing a photo: it must show the work, not someone's face, and not another moving
 * company - the Pexels licence allows commercial use but not implying that the people or
 * brands shown endorse us, and our mark on a rival's truck would say they're ours. Check
 * the uploader on the photo page too: a transport firm's own upload is their truck.
 *
 * The mark sits in a white badge in the top-right corner (the card's icon overlaps the
 * bottom-left), inset far enough that the card's 5% hover zoom never clips it.
 *
 * Idempotent. Usage (from the repo root):  node scripts/build-card-photos.mjs
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// sharp is a dependency of @mpm/cms; resolve it from there (see build-hero-variants.mjs).
const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const SRC = path.join('assets', 'card-photos');
const OUT = path.join('apps', 'web', 'public', 'images', 'cards');
const DATA = path.join('apps', 'web', 'src', 'data', 'card-photos.json');
const LOGO = path.join('apps', 'web', 'public', 'logo.png');
const W = 600;
const H = 375;
const QUALITY = 74;

/**
 * focus: the point the crop centres on (0..1 of the source); zoom: 1 = the widest 16:10
 * slice the photo allows, 1.4 = a 1.4x closer slice. source: the Pexels photo page.
 */
const CARDS = [
  {
    slug: 'home-shifting',
    focus: [0.5, 0.55],
    zoom: 1,
    alt: 'Packed and taped cartons, a suitcase and a sheet-covered armchair in a bright living room on moving day',
    by: 'Ketut Subiyanto',
    source: 'https://www.pexels.com/photo/4246119/',
  },
  {
    slug: 'office-shifting',
    focus: [0.45, 0.5],
    zoom: 1.05,
    alt: 'An office carton packed with files, folders, notebooks and scissors, carried out for the move',
    by: 'Anna Shvets',
    source: 'https://www.pexels.com/photo/4226206/',
  },
  {
    slug: 'car-transport',
    // No free stock photo shows car transport in India (the carriers on offer are in the
    // US and Australia), so this is our own generated image. It is portrait; the slice
    // sits high enough to keep both decks of cars in view.
    focus: [0.5, 0.4],
    zoom: 1,
    alt: 'Two cars loaded on the upper and lower decks of a closed car carrier, ramp down, ready for transport',
    by: 'MrMoverPacker (own brand image)',
    source: 'own image, supplied 3 Oct 2026',
  },
  {
    slug: 'bike-transport',
    // No free stock photo shows a bike being shifted in India, so this is our own
    // generated brand image. Replace it with a photo from a real job when there is one.
    // The bike fills the 16:9 frame, so the 16:10 slice is anchored right: the front
    // wheel stays whole, the tail is trimmed.
    focus: [1, 0.5],
    zoom: 1,
    alt: 'A motorcycle fully wrapped in cardboard and stretch film, sealed with MrMoverPacker tape, ready for transport',
    by: 'MrMoverPacker (own brand image)',
    source: 'own image, supplied 3 Oct 2026',
  },
  {
    slug: 'packing-unpacking',
    focus: [0.5, 0.5],
    zoom: 1,
    alt: 'Plates wrapped in bubble wrap being packed into a carton',
    by: 'SHVETS production',
    source: 'https://www.pexels.com/photo/7203848/',
  },
  {
    slug: 'loading-unloading',
    focus: [0.76, 0.52],
    zoom: 1.4,
    alt: 'Taped cartons stacked inside an open van, loaded and ready to go',
    by: 'Pavel Danilyuk',
    source: 'https://www.pexels.com/photo/6407553/',
  },
  {
    slug: 'international-relocation',
    focus: [0.5, 0.55],
    zoom: 1,
    alt: 'A container ship being loaded by cranes at a port, seen from above',
    by: 'Tom Fisk',
    source: 'https://www.pexels.com/photo/2231744/',
  },
];

/** The white badge carrying the wordmark, as a PNG buffer. */
async function badge() {
  const logoW = 112;
  const logo = await sharp(LOGO).resize({ width: logoW }).png().toBuffer();
  const { height: logoH } = await sharp(logo).metadata();
  const padX = 11;
  const padY = 7;
  const bw = logoW + padX * 2;
  const bh = logoH + padY * 2;
  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}">
       <rect width="${bw}" height="${bh}" rx="10" fill="#fff" fill-opacity="0.94"/>
     </svg>`,
  );
  return sharp(plate)
    .composite([{ input: logo, left: padX, top: padY }])
    .png()
    .toBuffer();
}

/** A soft shadow under the badge so it reads on a white wall as well as a dark road. */
async function shadow(bw, bh) {
  const pad = 14;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bw + pad * 2}" height="${bh + pad * 2}">
       <rect x="${pad}" y="${pad + 2}" width="${bw}" height="${bh}" rx="10" fill="#000" fill-opacity="0.28"/>
     </svg>`,
  );
  return { buf: await sharp(svg).blur(5).png().toBuffer(), pad };
}

/** A Markdown table padded the way Prettier pads it, so a rebuild leaves format:check green. */
function table(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  const line = (cells) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`;
  return [line(rows[0]), line(widths.map((w) => '-'.repeat(w))), ...rows.slice(1).map(line)];
}

await mkdir(OUT, { recursive: true });
const mark = await badge();
const { width: bw, height: bh } = await sharp(mark).metadata();
const sh = await shadow(bw, bh);
const INSET = 22;
const data = {};

for (const c of CARDS) {
  const src = path.join(SRC, `${c.slug}.jpg`);
  const { width, height } = await sharp(src).metadata();
  const ratio = W / H;
  const cw = Math.round(Math.min(width, height * ratio) / c.zoom);
  const ch = Math.round(cw / ratio);
  const left = Math.max(0, Math.min(width - cw, Math.round(c.focus[0] * width - cw / 2)));
  const top = Math.max(0, Math.min(height - ch, Math.round(c.focus[1] * height - ch / 2)));
  const out = path.join(OUT, `${c.slug}.webp`);
  await sharp(src)
    .extract({ left, top, width: cw, height: ch })
    .resize(W, H)
    .composite([
      { input: sh.buf, left: W - INSET - bw - sh.pad, top: INSET - sh.pad },
      { input: mark, left: W - INSET - bw, top: INSET },
    ])
    .webp({ quality: QUALITY })
    .toFile(out);
  data[c.slug] = { alt: c.alt };
  console.log(`cards/${c.slug}.webp  ${((await stat(out)).size / 1024).toFixed(0)} KB`);
}

await writeFile(DATA, JSON.stringify(data, null, 2) + '\n');
await writeFile(
  path.join(SRC, 'SOURCES.md'),
  [
    '# Service card photos',
    '',
    'Originals for `apps/web/public/images/cards/*.webp`, built by `scripts/build-card-photos.mjs`',
    '(which writes this file). Photos are from Pexels under the Pexels licence: free for',
    'commercial use and modification, no attribution required; it does not allow implying',
    'that the people or brands shown endorse us. A row whose source is a repo path is our',
    'own image.',
    '',
    ...table([['Card', 'Photographer', 'Source'], ...CARDS.map((c) => [c.slug, c.by, c.source])]),
    '',
  ].join('\n'),
);
console.log(`wrote ${DATA} and ${path.join(SRC, 'SOURCES.md')}`);
