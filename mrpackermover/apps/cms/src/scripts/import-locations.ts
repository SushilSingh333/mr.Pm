/**
 * Bulk location import — states, cities and localities from
 * `data/locations-import.json`, created through Payload so every hook
 * (slug validation, versions) runs exactly as it would for a CMS editor.
 *
 * Safe by design:
 *   - Idempotent: anything whose slug already exists is skipped, never
 *     overwritten, so re-running after a partial failure is harmless.
 *   - Coordinates come from the file, NOT the geocoder — the geocode hook
 *     queries by bare name and would drop "Sector 13" in the wrong city.
 *   - Creating locations does not create pages. Every page still has to clear
 *     the publish gate (rate card, reviews, jobs, 400+ words for a city hub),
 *     so importing here cannot flood production with thin URLs.
 *   - The per-record build webhook is debounced 10 minutes and dies with this
 *     process, so a bulk run does not hammer CI.
 *
 * Usage (from apps/cms):
 *   npx tsx src/scripts/import-locations.ts --dry-run   # report only
 *   npx tsx src/scripts/import-locations.ts             # create records
 */
import fs from 'node:fs';
import path from 'node:path';

// tsx does not load .env the way Next does; mirror build-manifest's loader so the
// script is self-contained on the droplet. Real env vars always win.
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

interface ImportState {
  name: string;
  slug: string;
}
interface ImportCity {
  name: string;
  slug: string;
  state: string;
  tier: 'A' | 'A-S' | 'B';
  serviceable: boolean;
  lat: number;
  lng: number;
  note: string[];
}
interface ImportLocality {
  name: string;
  slug: string;
  city: string;
  serviceable: boolean;
  lat: number;
  lng: number;
  note: string[];
}
interface ImportFile {
  states: ImportState[];
  linkExistingCityToState: Record<string, string>;
  cities: ImportCity[];
  localities: ImportLocality[];
}

/** Plain paragraphs → the Lexical richText shape Payload stores (same as seed.ts). */
function lex(paragraphs: string[]): unknown {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  };
}

const dryRun = process.argv.includes('--dry-run');
const file = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  'data/locations-import.json',
);
const data = JSON.parse(fs.readFileSync(file, 'utf8')) as ImportFile;

const payload = await getPayload({ config });

/** slug → id for every location already in the CMS (drafts included). */
async function existingBySlug(): Promise<Map<string, string | number>> {
  const map = new Map<string, string | number>();
  let page = 1;
  for (;;) {
    const res = await payload.find({
      collection: 'locations',
      limit: 200,
      page,
      depth: 0,
      draft: true,
      overrideAccess: true,
    });
    for (const doc of res.docs as Array<{ id: string | number; slug?: string }>) {
      if (doc.slug) map.set(doc.slug, doc.id);
    }
    if (!res.hasNextPage) break;
    page += 1;
  }
  return map;
}

const bySlug = await existingBySlug();
console.info(`Existing locations: ${bySlug.size}`);

// Every non-corporate service, offered by default in each new serviceable city
// (mirrors the seed; an editor deselects what a city does not do).
const services = await payload.find({
  collection: 'services',
  limit: 100,
  depth: 0,
  overrideAccess: true,
});
const publicServiceIds = (services.docs as Array<{ id: string | number; isCorporate?: boolean }>)
  .filter((s) => !s.isCorporate)
  .map((s) => s.id);
console.info(`Public services to offer in new cities: ${publicServiceIds.length}`);

const created = { states: 0, cities: 0, localities: 0 };
const skipped: string[] = [];

// ── States ──────────────────────────────────────────────────────────────────
for (const s of data.states) {
  if (bySlug.has(s.slug)) {
    skipped.push(`state ${s.slug}`);
    continue;
  }
  if (!dryRun) {
    const doc = await payload.create({
      collection: 'locations',
      overrideAccess: true,
      data: {
        name: s.name,
        slug: s.slug,
        type: 'state',
        isServiceable: false,
        _status: 'published',
      } as never,
    });
    bySlug.set(s.slug, doc.id);
  } else {
    bySlug.set(s.slug, `dry-${s.slug}`); // so children resolve in a dry run
  }
  created.states += 1;
  console.info(`state    + ${s.name}`);
}

// ── Cities ──────────────────────────────────────────────────────────────────
for (const c of data.cities) {
  if (bySlug.has(c.slug)) {
    skipped.push(`city ${c.slug}`);
    continue;
  }
  const stateId = bySlug.get(c.state);
  if (!dryRun) {
    const doc = await payload.create({
      collection: 'locations',
      overrideAccess: true,
      data: {
        name: c.name,
        slug: c.slug,
        type: 'city',
        parent: stateId ?? undefined,
        isServiceable: c.serviceable,
        lat: c.lat,
        lng: c.lng,
        populationTier: c.tier,
        servicesOffered: c.serviceable ? publicServiceIds : [],
        editorialNote: lex(c.note),
        _status: 'published',
      } as never,
    });
    bySlug.set(c.slug, doc.id);
  } else {
    bySlug.set(c.slug, `dry-${c.slug}`);
  }
  created.cities += 1;
  console.info(`city     + ${c.name} (${c.state}, tier ${c.tier}, serviceable ${c.serviceable})`);
}

// ── Link pre-existing cities to their new states (only when parent is empty) ─
for (const [citySlug, stateSlug] of Object.entries(data.linkExistingCityToState)) {
  const cityId = bySlug.get(citySlug);
  const stateId = bySlug.get(stateSlug);
  if (!cityId || !stateId) continue;
  const doc = (await payload.findByID({
    collection: 'locations',
    id: cityId,
    depth: 0,
    overrideAccess: true,
  })) as { parent?: unknown };
  if (doc.parent) continue; // an editor set something — leave it alone
  if (!dryRun) {
    await payload.update({
      collection: 'locations',
      id: cityId,
      overrideAccess: true,
      data: { parent: stateId } as never,
    });
  }
  console.info(`link     ~ ${citySlug} -> ${stateSlug}`);
}

// ── Localities ──────────────────────────────────────────────────────────────
for (const l of data.localities) {
  if (bySlug.has(l.slug)) {
    skipped.push(`locality ${l.slug}`);
    continue;
  }
  const cityId = bySlug.get(l.city);
  if (!cityId) {
    console.warn(`locality ! ${l.name}: parent city "${l.city}" not found, skipping`);
    continue;
  }
  if (!dryRun) {
    await payload.create({
      collection: 'locations',
      overrideAccess: true,
      data: {
        name: l.name,
        slug: l.slug,
        type: 'locality',
        parent: cityId,
        isServiceable: l.serviceable,
        lat: l.lat,
        lng: l.lng,
        editorialNote: lex(l.note),
        _status: 'published',
      } as never,
    });
  }
  created.localities += 1;
  console.info(`locality + ${l.name} (${l.city})`);
}

console.info(
  `\n${dryRun ? 'DRY RUN — nothing written. Would create' : 'Created'}: ` +
    `${created.states} states, ${created.cities} cities, ${created.localities} localities. ` +
    `Skipped (already exist): ${skipped.length}${skipped.length ? ` [${skipped.slice(0, 6).join(', ')}${skipped.length > 6 ? ', ...' : ''}]` : ''}`,
);
console.info(
  'Reminder: records are not pages. A city page publishes only after it has a rate card, ' +
    'reviews and enough local content to clear the publish gate.',
);
process.exit(0);
