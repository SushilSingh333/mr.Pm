/**
 * Take the "Which areas of <city> do you cover?" section out of each city's "Page content".
 *
 * The city pages used to answer that question with a table of zones and place names. The
 * page now answers it with its "Areas" cards instead - one card per area page, with a
 * search box - so the table repeated the same thing in two places. The city briefs no
 * longer carry it (packages/shared/src/geo-pages/cities); this removes the copy that
 * `import-geo-pages` put into the CMS, and nothing else.
 *
 * Safe by design: only a section whose heading starts "Which areas of" or "Which sectors
 * of" is removed; every other section, and every other field, is left as it is.
 *
 * Usage (from apps/cms):
 *   npx tsx src/scripts/drop-city-areas-section.ts --dry-run
 *   npx tsx src/scripts/drop-city-areas-section.ts
 */
import fs from 'node:fs';

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
const AREAS = /^Which (areas|sectors) of /i;

const payload = await getPayload({ config });
const found = await payload.find({
  collection: 'locations',
  where: { type: { equals: 'city' } },
  limit: 500,
  depth: 0,
  draft: true,
  overrideAccess: true,
  pagination: false,
});

type Section = { heading?: string | null; [k: string]: unknown };
type Doc = { id: string | number; slug?: string; body?: { sections?: Section[] | null } | null };

let changed = 0;
for (const doc of found.docs as Doc[]) {
  const sections = doc.body?.sections ?? [];
  const kept = sections.filter((s) => !AREAS.test(String(s.heading ?? '')));
  if (kept.length === sections.length) continue;
  changed += 1;
  console.info(
    `city ~ ${doc.slug}: remove "${sections.find((s) => AREAS.test(String(s.heading ?? '')))?.heading}"`,
  );
  if (dryRun) continue;
  await payload.update({
    collection: 'locations',
    id: doc.id,
    overrideAccess: true,
    data: { body: { ...doc.body, sections: kept } } as never,
  });
}
console.info(
  `\n${dryRun ? 'DRY RUN. Nothing written. Would update' : 'Updated'}: ${changed} cit${changed === 1 ? 'y' : 'ies'}.`,
);
process.exit(0);
