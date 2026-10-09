/**
 * Copy the service page briefs into the CMS, so editors start from the real text.
 *
 * The site already shows each brief (packages/shared/src/service-pages) wherever the
 * "Service page" fields are blank, so this changes nothing a visitor sees. What it changes
 * is the admin: without it every section, table and FAQ field is empty, and an editor who
 * wanted to fix one word would face a blank form. After it, the brief is there to edit.
 *
 * It also applies the briefs' notes on the "What costs extra" lists: car transport no
 * longer lists fuel or tolls as extras (tolls are in the quote, fuel is in the handover
 * checklist), and bike transport no longer lists draining the fuel as one.
 *
 * Safe by design:
 *   - Matched by slug; a service with no brief is left alone.
 *   - Fills only what is blank. A field or list an editor has filled is kept, unless you
 *     pass --force, which replaces the whole "Service page" group with the brief.
 *   - The extras lists lose only those exact lines, so anything an editor wrote stays.
 *   - Written through Payload, so versions and the build trigger behave as for a hand edit.
 *
 * Usage (from apps/cms):
 *   npx tsx src/scripts/import-service-pages.ts --dry-run
 *   npx tsx src/scripts/import-service-pages.ts
 *   npx tsx src/scripts/import-service-pages.ts --force
 */
import fs from 'node:fs';
import type { ServiceBlock, ServicePage } from '@mpm/shared';
import { SERVICE_PAGE_LABELS, SERVICE_PAGES } from '@mpm/shared';

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

/** Lines the briefs take off a service's "What costs extra" list. */
const DROP_EXTRAS: Record<string, string[]> = {
  'car-transport': ['Fuel in the tank (kept low for safety)', 'Toll / entry taxes at destination'],
  'bike-transport': ['Fuel drained for safe transit'],
};

/** A brief block in the shape the CMS stores it (Services → Service page → Sections). */
function toCmsBlock(b: ServiceBlock): Record<string, unknown> {
  switch (b.kind) {
    case 'text':
      return { blockType: 'svcText', body: b.body };
    case 'steps':
      return {
        blockType: 'svcSteps',
        items: b.items.map((i) => ({ title: i.title, body: i.body })),
      };
    case 'list':
      return { blockType: 'svcList', items: b.items.map((text) => ({ text })) };
    case 'table':
      return {
        blockType: 'svcTable',
        h1: b.columns[0] ?? '',
        h2: b.columns[1] ?? '',
        h3: b.columns[2] ?? '',
        rows: b.rows.map((r) => ({ c1: r[0] ?? '', c2: r[1] ?? '', c3: r[2] ?? '' })),
      };
    case 'scope':
      return { blockType: 'svcScope' };
  }
}

/** The whole "Service page" group, filled from the brief. */
function fromBrief(p: ServicePage): Record<string, unknown> {
  return {
    subhead: p.subhead,
    trust: p.trust.map((item) => ({ item })),
    quoteNote: p.quoteNote,
    sections: p.sections.map((s) => ({ heading: s.heading, blocks: s.blocks.map(toCmsBlock) })),
    faqHeading: p.faqHeading,
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    citiesHeading: p.citiesHeading,
    citiesIntro: p.citiesIntro,
    ctaHeading: p.ctaHeading,
    ctaText: p.ctaText,
    related: p.related.map((l) => ({ label: l.label, href: l.href })),
    // The shared labels, so the fields show the words rather than an empty box. The
    // photo is not copied: blank keeps the built-in one until an editor uploads another.
    ...SERVICE_PAGE_LABELS,
  };
}

const blank = (v: unknown): boolean =>
  v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

const payload = await getPayload({ config });
const found = await payload.find({
  collection: 'services',
  limit: 200,
  depth: 0,
  draft: true,
  overrideAccess: true,
});

type Row = { item?: string };
type Doc = {
  id: string | number;
  slug?: string;
  /** Services → "Service page". */
  body?: Record<string, unknown> | null;
  exclusions?: Row[] | null;
};

let changed = 0;
for (const doc of found.docs as Doc[]) {
  const slug = doc.slug ?? '';
  const brief = SERVICE_PAGES[slug];
  if (!brief) continue;

  const current = doc.body ?? {};
  const wanted = fromBrief(brief);
  const page: Record<string, unknown> = { ...current };
  const filled: string[] = [];
  for (const [key, value] of Object.entries(wanted)) {
    if (force || blank(current[key])) {
      page[key] = value;
      filled.push(key);
    }
  }

  const drop = DROP_EXTRAS[slug] ?? [];
  const extras = doc.exclusions ?? [];
  const keptExtras = extras.filter((r) => !drop.includes(String(r.item ?? '')));
  const removed = extras.length - keptExtras.length;

  if (!filled.length && !removed) {
    console.info(`service = ${slug}: already filled, nothing to do`);
    continue;
  }
  changed += 1;
  console.info(
    `service ~ ${slug}: ${filled.length ? `fill ${filled.join(', ')}` : 'page kept'}` +
      `${removed ? `; drop ${removed} extra line(s)` : ''}`,
  );
  if (dryRun) continue;
  await payload.update({
    collection: 'services',
    id: doc.id,
    overrideAccess: true,
    data: {
      body: page,
      ...(removed ? { exclusions: keptExtras.map((r) => ({ item: r.item })) } : {}),
    } as never,
  });
}

console.info(
  `\n${dryRun ? 'DRY RUN. Nothing written. Would update' : 'Updated'}: ${changed} service(s).`,
);
process.exit(0);
