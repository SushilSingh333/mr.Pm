/**
 * Re-encode already-uploaded media as WebP.
 *
 * `Media.upload` now applies `resizeOptions` + `formatOptions`, so anything uploaded
 * from here on is normalised on the way in. Files that were uploaded before that are
 * still sitting on disk exactly as they arrived — including the home page hero, a
 * 2.1 MB PNG straight out of an image generator, which was the Largest Contentful
 * Paint on the most important page of the site. Re-encoding it to WebP at the same
 * dimensions removed 92% of the bytes with nothing visible changed.
 *
 * Every environment stores its own files, so this has to run once per environment,
 * the same as the rebrand script.
 *
 * What it does per row: re-encode to WebP (capped at 1920 wide, never enlarged),
 * write the new file beside the old one, update `filename` / `mimeType` / `filesize`
 * / `width` / `height`, then delete the original. Documents reference media by id,
 * not by filename, so the URL changing is picked up by the next manifest build and
 * nothing needs re-linking.
 *
 * Skips anything already WebP, so a second run is a no-op. Leaves SVGs alone —
 * they are vector and sharp would rasterise them.
 *
 * Usage (from apps/cms):  npx tsx src/scripts/optimize-media.ts [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
for (const rawLine of envFile.split('\n')) {
  const line = rawLine.trim();
  const eq = line.indexOf('=');
  if (!line || line.startsWith('#') || eq < 1) continue;
  const key = line.slice(0, eq).trim();
  if (!/^[A-Z0-9_]+$/.test(key) || process.env[key] !== undefined) continue;
  process.env[key] = line
    .slice(eq + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const DRY = process.argv.includes('--dry');
const MAX_WIDTH = 1920;
const QUALITY = 80;
const MEDIA_DIR = path.resolve('media');

const { createRequire } = await import('node:module');
const require = createRequire(path.resolve('package.json'));
const sharp = require('sharp');

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const payload = await getPayload({ config });

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(0)} KB`;

const all = await payload.find({
  collection: 'media',
  limit: 1000,
  depth: 0,
  overrideAccess: true,
});

let before = 0;
let after = 0;
let changed = 0;

for (const doc of all.docs) {
  const filename = typeof doc.filename === 'string' ? doc.filename : null;
  if (!filename) continue;
  if (/\.(webp|svg)$/i.test(filename)) continue;

  const source = path.join(MEDIA_DIR, filename);
  if (!fs.existsSync(source)) {
    console.info(`  skipped (file missing): ${filename}`);
    continue;
  }

  const sourceBytes = fs.statSync(source).size;
  const target = `${filename.replace(/\.[^.]+$/, '')}.webp`;
  const targetPath = path.join(MEDIA_DIR, target);

  const output = await sharp(source)
    .resize({ width: MAX_WIDTH, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer({ resolveWithObject: true });

  before += sourceBytes;
  after += output.info.size;
  changed += 1;

  const saving = (100 - (output.info.size / sourceBytes) * 100).toFixed(0);
  console.info(
    `  ${DRY ? 'would convert' : 'converted'} ${filename}\n` +
      `      ${kb(sourceBytes)} -> ${kb(output.info.size)}  (${saving}% smaller, ` +
      `${output.info.width}x${output.info.height})`,
  );

  if (DRY) continue;

  fs.writeFileSync(targetPath, output.data);
  await payload.update({
    collection: 'media',
    id: doc.id,
    data: {
      filename: target,
      mimeType: 'image/webp',
      filesize: output.info.size,
      width: output.info.width,
      height: output.info.height,
    },
    overrideAccess: true,
  });
  // Only after the record points at the new file, so a crash mid-run leaves the
  // original in place rather than a row referencing a file that is gone.
  if (targetPath !== source) fs.unlinkSync(source);
}

console.info(
  changed === 0
    ? '\n  Nothing to convert — all media is already WebP.'
    : `\n  ${DRY ? 'Dry run:' : 'Done:'} ${changed} file(s), ` +
        `${kb(before)} -> ${kb(after)} (${(100 - (after / before) * 100).toFixed(0)}% smaller).`,
);
process.exit(0);
