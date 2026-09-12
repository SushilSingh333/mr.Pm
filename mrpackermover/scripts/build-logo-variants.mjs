/**
 * Cut the site's logo files out of the brand artwork.
 *
 * The brand pack ships three square JPEGs of the same lockup rendered on three
 * different grounds — black, brand blue, and white. That combination is what makes a
 * clean cut possible.
 *
 * Naive background removal keys on luminance, which cannot tell "half-transparent
 * white" from "solid grey" — it would make the grey tagline semi-transparent and
 * leave coloured fringing on every anti-aliased edge. Two renders of the same
 * artwork over two known grounds solve it exactly instead:
 *
 *     C1 = a*F + (1-a)*B1        (over black)
 *     C2 = a*F + (1-a)*B2        (over blue)
 *     C2 - C1 = (1-a)*(B2 - B1)  ->  a = 1 - (C2-C1)/(B2-B1)
 *
 * With `a` known, the un-composited artwork follows from either render, so the same
 * mask un-composites the white-ground file too and yields the light colourway with
 * its true colours. No thresholds, no guessing, correct alpha on every edge pixel.
 *
 * Four files come out, matching what the site already references:
 *
 *   logo.png                 Blue wordmark, no tagline      — light surfaces (header)
 *   logo-inverse.png         White wordmark, no tagline     — blue/dark surfaces (footer)
 *   logo-lockup.png          Blue wordmark, with tagline
 *   logo-lockup-inverse.png  White wordmark, with tagline
 *
 * The tagline is split off by finding the blank row band between the wordmark and
 * the strapline, so the header mark stays legible at small sizes.
 *
 * Usage (from the repo root):  node scripts/build-logo-variants.mjs "D:/mr.Pm/logo new"
 */
import { writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('apps/cms/package.json'));
const sharp = require('sharp');

const SRC_DIR = process.argv[2] ?? 'D:/mr.Pm/logo new';
const OUT_DIR = path.join('apps', 'web', 'public');
const OUT_WIDTH = 640;

/** Pick the file whose name starts with a given word, case-insensitively. */
const files = await readdir(SRC_DIR);
const pick = (word) => {
  const hit = files.find((f) => f.toLowerCase().startsWith(word));
  if (!hit) throw new Error(`No source file starting with "${word}" in ${SRC_DIR}`);
  return path.join(SRC_DIR, hit);
};

const load = async (file) => {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, channels: info.channels };
};

const dark = await load(pick('dark'));
const blue = await load(pick('blue'));
const white = await load(pick('white'));

if (dark.w !== blue.w || dark.w !== white.w || dark.h !== blue.h || dark.h !== white.h) {
  throw new Error('The three renders are not the same size, so their pixels do not correspond.');
}

const { w, h } = dark;
const at = (img, i) => i * img.channels;
// Corner pixels are pure background in all three renders.
const bg = (img) => [img.data[0], img.data[1], img.data[2]];
const [, , darkB] = bg(dark);
const [, , blueB] = bg(blue);
const spread = blueB - darkB;
if (Math.abs(spread) < 40) {
  throw new Error('The black and blue grounds are too similar to separate alpha from colour.');
}

const alpha = new Float32Array(w * h);
for (let i = 0; i < w * h; i += 1) {
  const a = 1 - (blue.data[at(blue, i) + 2] - dark.data[at(dark, i) + 2]) / spread;
  alpha[i] = a < 0 ? 0 : a > 1 ? 1 : a;
}

/** Un-composite a render against its known flat ground, using the shared alpha. */
function uncomposite(img, ground) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    const a = alpha[i];
    const o = i * 4;
    out[o + 3] = Math.round(a * 255);
    if (a <= 0.002) continue;
    for (let c = 0; c < 3; c += 1) {
      const v = (img.data[at(img, i) + c] - (1 - a) * ground[c]) / a;
      out[o + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
    }
  }
  return out;
}

const lightArt = uncomposite(white, [255, 255, 255]);
const darkArt = uncomposite(dark, [0, 0, 0]);

// ── Find the artwork, and the gap above the tagline ──────────────────────────
const rowInk = new Float32Array(h);
const colInk = new Float32Array(w);
for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    const a = alpha[y * w + x];
    rowInk[y] += a;
    colInk[x] += a;
  }
}
const INK = 0.5; // a row/column with less than this much total alpha is empty
const firstRow = rowInk.findIndex((v) => v > INK);
const lastRow = h - 1 - [...rowInk].reverse().findIndex((v) => v > INK);
const firstCol = colInk.findIndex((v) => v > INK);
const lastCol = w - 1 - [...colInk].reverse().findIndex((v) => v > INK);

// The strapline sits under the wordmark behind a clear blank band. Search upward
// from the bottom for the last run of empty rows and treat that as the divider.
let taglineTop = lastRow + 1;
let gapEnd = -1;
for (let y = lastRow; y > firstRow; y -= 1) {
  if (rowInk[y] <= INK) {
    if (gapEnd === -1) gapEnd = y;
  } else if (gapEnd !== -1) {
    taglineTop = gapEnd + 1;
    break;
  }
}
const wordmarkBottom = taglineTop - 1;

const crop = async (rgba, top, bottom, name) => {
  const height = bottom - top + 1;
  const width = lastCol - firstCol + 1;
  const image = sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: firstCol, top, width, height })
    .resize({ width: OUT_WIDTH })
    // The artwork is four flat brand colours plus anti-aliasing, which a palette
    // encodes far more efficiently than full RGBA — ~88% smaller for no visible
    // change. 128 entries leaves plenty of intermediate shades for clean edges.
    // Worth the care: the header mark loads eagerly on all 435 pages.
    .png({ compressionLevel: 9, palette: true, colours: 128, effort: 10 });
  const buf = await image.toBuffer();
  await writeFile(path.join(OUT_DIR, name), buf);
  const meta = await sharp(buf).metadata();
  console.info(
    `  ${name.padEnd(24)} ${meta.width}x${meta.height}  ` +
      `${(buf.length / 1024).toFixed(1)} KB  (ratio ${(meta.width / meta.height).toFixed(3)}:1)`,
  );
};

console.info(`  source artwork: ${w}x${h}, ink rows ${firstRow}-${lastRow}`);
console.info(`  wordmark ends at row ${wordmarkBottom}, tagline starts at ${taglineTop}\n`);

await crop(lightArt, firstRow, wordmarkBottom, 'logo.png');
await crop(darkArt, firstRow, wordmarkBottom, 'logo-inverse.png');
await crop(lightArt, firstRow, lastRow, 'logo-lockup.png');
await crop(darkArt, firstRow, lastRow, 'logo-lockup-inverse.png');
