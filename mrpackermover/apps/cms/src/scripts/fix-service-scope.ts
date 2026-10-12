/**
 * Correct two mistakes in the services' "What's included / What costs extra" lists
 * (Services → inclusions, exclusions), which every service and city × service page shows:
 *
 *   - transit insurance is optional, so it moves from "included" to "costs extra";
 *   - "Prohibited or restricted items" is not an extra (those cannot ship at all; the
 *     international page has its own "What cannot be shipped" section), so it goes.
 *
 * Only those exact lines are touched; every other item, and any edit made in the CMS, is
 * kept. Running it twice changes nothing the second time. `--dry-run` shows the plan.
 *
 *   npx tsx src/scripts/fix-service-scope.ts --dry-run
 *   npx tsx src/scripts/fix-service-scope.ts
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
/** An "included" line that is really an optional extra → how it reads under "costs extra". */
const OPTIONAL: Record<string, string> = {
  'Transit insurance option': 'Optional transit insurance, priced on your declared value',
  'Marine transit insurance option':
    'Optional marine transit insurance, priced on your declared value',
};
/** "Costs extra" lines that are not extras at all. */
const NOT_EXTRAS = new Set(['Prohibited or restricted items']);

type Item = { item: string };
type Svc = { id: string | number; slug: string; inclusions?: Item[]; exclusions?: Item[] };

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: 'services',
  limit: 200,
  pagination: false,
  overrideAccess: true,
});

let changed = 0;
for (const svc of docs as unknown as Svc[]) {
  const inclusions = svc.inclusions ?? [];
  const exclusions = svc.exclusions ?? [];
  const moved = inclusions.filter((i) => OPTIONAL[i.item.trim()]);
  const dropped = exclusions.filter((i) => NOT_EXTRAS.has(i.item.trim()));
  if (!moved.length && !dropped.length) continue;

  const extras = moved
    .map((i) => OPTIONAL[i.item.trim()]!)
    .filter((t) => !exclusions.some((e) => e.item.trim() === t));
  const nextIn = inclusions.filter((i) => !OPTIONAL[i.item.trim()]).map(({ item }) => ({ item }));
  const nextEx = [
    ...extras.map((item) => ({ item })),
    ...exclusions.filter((i) => !NOT_EXTRAS.has(i.item.trim())).map(({ item }) => ({ item })),
  ];
  changed += 1;
  console.info(
    `${svc.slug}: ${moved.map((i) => `"${i.item}" → costs extra`).join(', ')}` +
      `${moved.length && dropped.length ? '; ' : ''}${dropped.map((i) => `remove "${i.item}"`).join(', ')}`,
  );
  if (dryRun) continue;
  await payload.update({
    collection: 'services',
    id: svc.id,
    overrideAccess: true,
    data: { inclusions: nextIn, exclusions: nextEx, _status: 'published' } as never,
  });
}
console.info(`\n${dryRun ? 'DRY RUN. Would change' : 'Changed'} ${changed} service(s).`);
process.exit(0);
