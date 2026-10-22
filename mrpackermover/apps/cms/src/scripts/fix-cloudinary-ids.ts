/**
 * One-off: repair Media uploaded to Cloudinary under an id with a dot in it.
 *
 * Payload converts uploads to WebP and keeps the old extension in the file name
 * ("Sector-128.jpg.webp"). The Cloudinary adapter used to strip only the last extension,
 * so the asset was stored as ".../Sector-128.jpg" - and Cloudinary reads a trailing
 * ".jpg" in a delivery URL as a format request, so that URL answers 404. In the CMS the
 * preview is a blank file icon; on the website the banner is black.
 *
 * The adapter now writes dot-free ids (storage/cloudinary.ts, cloudinaryIdFor). This
 * renames each affected asset ON CLOUDINARY to the id it would get today
 * (".../Sector-128-jpg") and points the Media record at it - no re-upload, no change to
 * the file. Then it loads every new URL to prove it works.
 *
 *   pnpm --filter @mpm/cms fix-cloudinary-ids               # preview: what is broken
 *   pnpm --filter @mpm/cms fix-cloudinary-ids -- --apply    # rename and repoint
 *
 * After --apply, rebuild the site (deploy.sh) so the pages pick up the new URLs.
 */
import fs from 'node:fs';

// tsx does not load apps/cms/.env the way Next does - load it first, then import (the
// same as set-team.ts). Real environment variables always win.
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

const APPLY = process.argv.includes('--apply');
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Cloudinary is not configured here (CLOUDINARY_* missing) - nothing to repair.');
  process.exit(1);
}

const { getPayload } = await import('payload');
const { v2: cloudinary } = await import('cloudinary');
const { default: config } = await import('../payload.config.js');
const { cldUrl, CLD_TRANSFORM } = await import('@mpm/shared');

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
const urlFor = (publicId: string): string =>
  `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
/** Does the URL the website uses (with the hero transform) actually load? */
const loads = async (url: string): Promise<number> => {
  try {
    const res = await fetch(cldUrl(url, CLD_TRANSFORM.hero), { method: 'HEAD' });
    return res.status;
  } catch {
    return 0;
  }
};

const payload = await getPayload({ config });
const media = (
  await payload.find({
    collection: 'media',
    limit: 10000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
).docs as unknown as {
  id: string | number;
  filename?: string;
  url?: string;
  cloudinaryPublicId?: string | null;
}[];

const broken: { id: string | number; filename: string; from: string; to: string }[] = [];
for (const m of media) {
  const fromUrl = m.url?.includes('/upload/') ? m.url.split('/upload/')[1] : undefined;
  const from = m.cloudinaryPublicId || fromUrl;
  if (!from) continue;
  const slash = from.lastIndexOf('/');
  const dir = slash >= 0 ? from.slice(0, slash + 1) : '';
  const last = from.slice(slash + 1);
  if (!last.includes('.')) continue;
  broken.push({
    id: m.id,
    filename: m.filename ?? '',
    from,
    to: dir + last.replace(/\./g, '-'),
  });
}

payload.logger.info(
  `Media checked: ${media.length}. With a dot in the Cloudinary id (broken links): ${broken.length}.`,
);
for (const b of broken) {
  const status = await loads(urlFor(b.from));
  payload.logger.info(
    `  #${b.id} ${b.filename}: ${b.from} -> ${b.to}  (current link answers ${status || 'no reply'})`,
  );
}

if (!APPLY) {
  payload.logger.info('Preview only - nothing changed. Run again with -- --apply to repair.');
  process.exit(0);
}

let fixed = 0;
let failed = 0;
for (const b of broken) {
  try {
    await cloudinary.uploader.rename(b.from, b.to, {
      invalidate: true,
      overwrite: false,
      resource_type: 'image',
    });
  } catch (err) {
    // Already renamed by an earlier run: carry on and repoint the record.
    const msg =
      (err as { message?: string; error?: { message?: string } })?.error?.message ??
      (err as { message?: string })?.message ??
      String(err);
    if (!/already exists/i.test(msg)) {
      payload.logger.error(`  #${b.id}: Cloudinary rename failed - ${msg}`);
      failed += 1;
      continue;
    }
  }
  await payload.db.updateOne({
    collection: 'media',
    id: b.id,
    data: { cloudinaryPublicId: b.to, url: urlFor(b.to) },
  });
  const status = await loads(urlFor(b.to));
  payload.logger.info(`  #${b.id} ${b.filename}: now ${urlFor(b.to)} -> ${status}`);
  if (status === 200) fixed += 1;
  else failed += 1;
}
payload.logger.info(
  `Repaired and loading: ${fixed}. Not loading: ${failed}. Rebuild the site (deploy.sh) next.`,
);
process.exit(failed ? 1 : 0);
