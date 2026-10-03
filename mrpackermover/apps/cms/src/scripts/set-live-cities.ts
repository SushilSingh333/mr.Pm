/**
 * Choose which cities are live on the website. Every other city goes to draft.
 *
 * A draft city keeps everything - its copy, localities, rate card, reviews, the services
 * it offers - but the site builds nothing for it: no city page, no city × service pages,
 * no locality pages, and no link to any of them anywhere (every link on the site comes
 * from the manifest, which reads published cities only). Bringing one back is the
 * Publish button on the city in the CMS; its localities return with it, because they
 * are left exactly as they are here.
 *
 * Shows the plan and changes nothing unless `--apply` is given:
 *
 *   pnpm --filter @mpm/cms set-live-cities              # dry run: what would change
 *   pnpm --filter @mpm/cms set-live-cities -- --apply   # do it
 *
 * The live list defaults to LIVE below; pass slugs to use a different one:
 *
 *   pnpm --filter @mpm/cms set-live-cities -- --apply delhi noida gurgaon
 *
 * It only ever unpublishes. A city on the live list that is currently a draft is
 * reported, not published - publishing is an editor's decision, made in the CMS.
 */
import fs from 'node:fs';

// tsx does not load apps/cms/.env the way Next does, and the Payload config reads the
// environment when it is imported - so load the file first, then import (the same as
// build-manifest.ts). Real environment variables always win.
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

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');

/** Delhi NCR plus Meerut (3 Oct 2026). */
const LIVE = ['delhi', 'gurgaon', 'noida', 'greater-noida', 'faridabad', 'ghaziabad', 'meerut'];

interface CityDoc {
  id: string | number;
  slug?: string;
  name?: string;
  _status?: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const named = args.filter((a) => !a.startsWith('--'));
  const live = new Set(named.length > 0 ? named : LIVE);

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'locations',
    where: { type: { equals: 'city' } },
    limit: 1000,
    pagination: false,
    depth: 0,
    draft: true, // the latest version of each, so a city already in draft reads as draft
    overrideAccess: true,
  });
  const cities = docs as unknown as CityDoc[];

  const known = new Set(cities.map((c) => c.slug));
  const unknown = [...live].filter((s) => !known.has(s));
  if (unknown.length > 0) {
    // A typo here would silently take a city off the site, so stop instead.
    console.error(`No city with slug: ${unknown.join(', ')}. Nothing changed.`);
    process.exit(1);
  }

  const toDraft = cities.filter((c) => !live.has(c.slug ?? '') && c._status === 'published');
  const stayLive = cities.filter((c) => live.has(c.slug ?? '') && c._status === 'published');
  const liveButDraft = cities.filter((c) => live.has(c.slug ?? '') && c._status !== 'published');

  console.info(`Live (${stayLive.length}): ${stayLive.map((c) => c.name).join(', ') || '-'}`);
  if (liveButDraft.length > 0) {
    console.info(
      `On the live list but a draft - publish in the CMS if wanted: ${liveButDraft.map((c) => c.name).join(', ')}`,
    );
  }
  console.info(`To draft (${toDraft.length}): ${toDraft.map((c) => c.name).join(', ') || '-'}`);

  if (!apply) {
    console.info('\nDry run - nothing changed. Run again with --apply to make these drafts.');
    process.exit(0);
  }

  for (const c of toDraft) {
    await payload.update({
      collection: 'locations',
      id: c.id,
      data: { _status: 'draft' } as never,
      overrideAccess: true,
    });
    console.info(`  draft: ${c.name}`);
  }
  console.info(
    `\nDone: ${toDraft.length} made drafts. Rebuild the site (deploy/deploy.sh) to take their pages down.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
