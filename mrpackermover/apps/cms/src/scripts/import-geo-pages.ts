/**
 * Copy the city and locality page briefs into the CMS, so editors start from the real text.
 *
 * The site already shows each brief (packages/shared/src/geo-pages) wherever the
 * Locations → "Page content" fields are blank, so this changes nothing a visitor sees. What
 * it changes is the admin: without it every section, table and FAQ field is empty, and an
 * editor who wanted to fix one word would face a blank form. After it, the brief is there
 * to edit.
 *
 * It also creates the record for a locality whose brief has no place in the CMS yet (a
 * brief with a `name`, under a city that exists): published and serviceable, with its page
 * content filled in. Its page goes live with its release batch, not before
 * (packages/shared/src/geo-pages/release.ts), so running this never releases 76 pages
 * at once.
 *
 * Safe by design:
 *   - Matched by slug (a locality by its city's slug and its own); a place with no brief is
 *     left alone.
 *   - Fills only what is blank. A field or list an editor has filled is kept, unless you
 *     pass --force, which replaces the whole "Page content" group with the brief.
 *   - Written through Payload, so versions and the build trigger behave as for a hand edit.
 *
 * Usage (from apps/cms):
 *   npx tsx src/scripts/import-geo-pages.ts --dry-run
 *   npx tsx src/scripts/import-geo-pages.ts
 *   npx tsx src/scripts/import-geo-pages.ts --force
 */
import fs from 'node:fs';
import type { GeoPage } from '@mpm/shared';
import { CITY_PAGES, LOCALITY_PAGES } from '@mpm/shared';
import { blank, toCmsBlock } from '../lib/brief-blocks.js';

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

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

/** The whole "Page content" group, filled from the brief. */
function fromBrief(p: GeoPage): Record<string, unknown> {
  return {
    subhead: p.subhead,
    trust: p.trust.map((item) => ({ item })),
    sections: p.sections.map((s) => ({ heading: s.heading, blocks: s.blocks.map(toCmsBlock) })),
    faqHeading: p.faqHeading,
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    servicesHeading: p.servicesHeading,
    nearbyHeading: p.nearbyHeading,
    nearbyIntro: p.nearbyIntro,
    routes: p.routes.map((text) => ({ text })),
    ctaHeading: p.ctaHeading,
    ctaText: p.ctaText,
  };
}

const payload = await getPayload({ config });
const found = await payload.find({
  collection: 'locations',
  where: { type: { in: ['city', 'locality'] } },
  limit: 5000,
  depth: 0,
  draft: true,
  overrideAccess: true,
  pagination: false,
});

type Doc = {
  id: string | number;
  slug?: string;
  type?: string;
  parent?: string | number | { id: string | number } | null;
  /** Locations → "Page content". */
  body?: Record<string, unknown> | null;
};
const docs = found.docs as Doc[];
const slugById = new Map(docs.map((d) => [String(d.id), d.slug ?? '']));
const parentId = (d: Doc): string | null =>
  d.parent == null ? null : String(typeof d.parent === 'object' ? d.parent.id : d.parent);

let changed = 0;
const matched = new Set<string>();
for (const doc of docs) {
  const key =
    doc.type === 'city'
      ? (doc.slug ?? '')
      : `${slugById.get(parentId(doc) ?? '') ?? ''}/${doc.slug}`;
  const brief = doc.type === 'city' ? CITY_PAGES[key] : LOCALITY_PAGES[key];
  if (!brief) continue;
  matched.add(`${doc.type}:${key}`);

  const current = doc.body ?? {};
  const wanted = fromBrief(brief);
  const body: Record<string, unknown> = { ...current };
  const filled: string[] = [];
  for (const [field, value] of Object.entries(wanted)) {
    // Nothing to copy (a locality has no routes of its own): leave the field alone.
    if (blank(value) && !force) continue;
    if (force || blank(current[field])) {
      body[field] = value;
      filled.push(field);
    }
  }
  if (!filled.length) {
    console.info(`${doc.type} = ${key}: already filled, nothing to do`);
    continue;
  }
  changed += 1;
  console.info(`${doc.type} ~ ${key}: fill ${filled.join(', ')}`);
  if (dryRun) continue;
  await payload.update({
    collection: 'locations',
    id: doc.id,
    overrideAccess: true,
    data: { body } as never,
  });
}

// A locality brief with no record: create the place under its city, so its page exists
// once its release batch comes round.
const cityIdBySlug = new Map(
  docs.filter((d) => d.type === 'city').map((d) => [d.slug ?? '', d.id] as const),
);
let created = 0;
for (const [key, brief] of Object.entries(LOCALITY_PAGES)) {
  if (matched.has(`locality:${key}`)) continue;
  const [citySlug = '', slug = ''] = key.split('/');
  const cityId = cityIdBySlug.get(citySlug);
  if (!brief.name || cityId == null) {
    console.warn(
      `no locality record for brief "${key}"` +
        (brief.name ? ` (no city "${citySlug}")` : ' (the brief has no name)'),
    );
    continue;
  }
  created += 1;
  console.info(`locality + ${key}: create "${brief.name}"`);
  if (dryRun) continue;
  await payload.create({
    collection: 'locations',
    overrideAccess: true,
    draft: false,
    data: {
      name: brief.name,
      slug,
      type: 'locality',
      parent: cityId,
      isServiceable: true,
      _status: 'published',
      body: fromBrief(brief),
    } as never,
  });
}
// A city brief with no record is worth knowing about: its page shows only once the city
// exists in the CMS (and is live).
for (const key of Object.keys(CITY_PAGES))
  if (!matched.has(`city:${key}`)) console.warn(`no city record for brief "${key}"`);

console.info(
  `\n${dryRun ? 'DRY RUN. Nothing written. Would update' : 'Updated'}: ${changed} place(s); ` +
    `${dryRun ? 'would create' : 'created'} ${created} new localit${created === 1 ? 'y' : 'ies'}.`,
);
process.exit(0);
