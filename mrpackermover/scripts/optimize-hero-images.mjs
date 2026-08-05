/**
 * Downscale + recompress the fetched hero photos so they're hero-appropriate
 * (max 1600px wide, mozjpeg q68). Run from the cms package so `sharp` resolves:
 *   pnpm --filter @mpm/cms exec node ../../scripts/optimize-hero-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = [
  path.join(ROOT, 'apps/web/public/images/hero'),
  path.join(ROOT, 'apps/web/public/images/hero/cities'),
];

let total = 0;
for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.jpg')) continue;
    const full = path.join(dir, file);
    const before = fs.statSync(full).size;
    const buf = await sharp(full)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 68, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(full, buf);
    total += 1;
    console.info(`  ${path.relative(ROOT, full)}  ${Math.round(before / 1024)}KB -> ${Math.round(buf.length / 1024)}KB`);
  }
}
console.info(`Optimised ${total} images.`);
