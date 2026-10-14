/**
 * Correct the CMS copy the 13 Oct 2026 site review flagged: lines that said something
 * existed before it did. Claims data is published from the first quarterly report, not
 * yet; the insurer is not named on the site; the city pages carry an instant price check,
 * not "rate bands and real reviews"; the price check is accurate to about ±12%.
 *
 * The site's built-in copy was corrected in code. These are the same lines where an
 * editor's CMS copy (Home page content, Pages, Services) overrides it, so the code fix
 * alone would never reach the page. Each fix replaces one exact old phrase; text an editor
 * has since rewritten does not match and is left alone.
 *
 * Shows what it would change, and saves only with --apply:
 *   npx tsx src/scripts/fix-review-copy.ts
 *   npx tsx src/scripts/fix-review-copy.ts --apply
 * Then rebuild the site: bash deploy/deploy.sh
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

const apply = process.argv.includes('--apply');

/** [old phrase, new phrase]. Exact, case-sensitive substrings. */
const FIXES: [string, string][] = [
  // Home → the dark "claims" card.
  ['Claims settled, and published', 'Claims settled in writing'],
  [
    'Damage is rare, but when it happens we settle. And we publish our median settlement time on the claims page, an unflattering-but-honest number nobody else in this category shows.',
    'Damage is rare, but when it happens we settle it against the photos taken at pickup. From our first quarterly report, our median settlement time goes on the claims page, a number nobody else in this category shows.',
  ],
  // "Damage is rare" is not backed by any record yet, and no claims report is out: say
  // what happens instead (14 Oct 2026 review). Runs after the line above, so it also
  // catches that line's first version.
  [
    'Damage is rare, but when it happens we settle it against the photos taken at pickup. From our first quarterly report, our median settlement time goes on the claims page, a number nobody else in this category shows.',
    'If something is damaged, we settle it against the photos taken at pickup. From our first quarterly report, our median settlement time goes on the claims page.',
  ],
  ['See our claims data', 'See how claims work'],
  // Pages → Claims: the intro said the numbers are published; the first report is not out.
  [
    'Damage is rare — but pretending it never happens is how this industry lost your trust. So we do the opposite: a clear claims process, and the settlement numbers published in the open.',
    'Pretending damage never happens is how this industry lost your trust. So we do the opposite: a written claims process for every move, and our settlement numbers published here from our first quarterly report. That report is not out yet.',
  ],
  [
    'Damage is rare, but pretending it never happens is how this industry lost your trust. So we do the opposite: a clear claims process, and the settlement numbers published in the open.',
    'Pretending damage never happens is how this industry lost your trust. So we do the opposite: a written claims process for every move, and our settlement numbers published here from our first quarterly report. That report is not out yet.',
  ],
  // Services → Office shifting.
  [
    'Damage is rare, and when it happens we settle. Our median settlement time is on the [claims page](/claims).',
    'If something is damaged, we settle it. Our median settlement time goes on the [claims page](/claims) from our first quarterly report.',
  ],
  // Home → cities band: there are no rate bands or reviews on the city pages.
  [
    'local rate bands and real reviews, delivery goes anywhere in India.',
    'local access notes and an instant price check. Delivery goes anywhere in India.',
  ],
  // Home → trust chips and comparison, where an editor copied the brief in.
  ['Claims data published', 'Written claims process'],
  [
    'Written claims process, settlement data published',
    'Written claims process, settled against pickup photos',
  ],
  // Pages → Insurance: the insurer is not named on the site for now.
  [', backed by a named insurer, so you decide', ', so you decide'],
  // Services → Home shifting.
  ['About ±6%, a guide only', 'About ±12%, a guide only'],
  [
    'covers up to your declared value, from a licensed insurer named on your certificate. Ask for the certificate and its exclusions before loading day.',
    'covers up to your declared value, with the cover and its exclusions on your certificate. Ask for the certificate before loading day.',
  ],
  // 14 Oct 2026, the owner: drop every "from our first quarterly report" promise and say
  // what we do instead - free to raise, checked against the pickup photos, a first reply
  // within 24 hours, settled in writing. Last in the list, so it also catches the wording
  // the fixes above produce.
  [
    'If something is damaged, we settle it against the photos taken at pickup. From our first quarterly report, our median settlement time goes on the claims page.',
    'If something is damaged, raising a claim is free. We check it against the photos taken at pickup, reply within 24 hours and agree the settlement in writing.',
  ],
  [
    'Pretending damage never happens is how this industry lost your trust. So we do the opposite: a written claims process for every move, and our settlement numbers published here from our first quarterly report. That report is not out yet.',
    'Pretending damage never happens is how this industry lost your trust. So every move comes with a written claims process: free to raise, checked against the photos taken at pickup, a first reply within 24 hours, and a settlement agreed in writing.',
  ],
  [
    'If something is damaged, we settle it. Our median settlement time goes on the [claims page](/claims) from our first quarterly report.',
    'If something is damaged, raising a claim is free; see [how claims work](/claims).',
  ],
  [
    'From our first quarterly report we publish [our median claim settlement time](/claims), updated each reporting period.',
    'Every claim is closed in writing, with the settlement and the photos it was checked against. See [how claims work](/claims).',
  ],
  // Pages → Claims heading: "nobody else" is a claim about every competitor we cannot prove.
  [
    'The claims page nobody else in this category shows',
    'If something is damaged, here is exactly what happens',
  ],
  [
    'it is assessed against the pickup photos and settled, and from our first quarterly report we publish how fast.',
    'it is assessed against the pickup photos and settled in writing.',
  ],
];

type Json = unknown;
const SKIP = new Set(['id', 'createdAt', 'updatedAt', 'globalType', '_status']);

/** The value with every fix applied, and the before/after of each string it changed. */
function fix(v: Json, path: string, log: string[]): Json {
  if (typeof v === 'string') {
    let out = v;
    for (const [from, to] of FIXES) if (out.includes(from)) out = out.split(from).join(to);
    if (out !== v) log.push(`  ${path}\n    - ${v}\n    + ${out}`);
    return out;
  }
  if (Array.isArray(v)) return v.map((x, i) => fix(x, `${path}[${i}]`, log));
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, SKIP.has(k) ? x : fix(x, `${path}.${k}`, log)]),
    );
  }
  return v;
}

/** Only the top-level fields that changed, so nothing else on the record is rewritten. */
function changedFields(before: Record<string, Json>, after: Record<string, Json>) {
  return Object.fromEntries(
    Object.keys(after)
      .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map((k) => [k, after[k]]),
  );
}

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const payload = await getPayload({ config });

let records = 0;
for (const slug of ['home-content']) {
  const doc = (await payload.findGlobal({ slug: slug as never, overrideAccess: true })) as Record<
    string,
    Json
  >;
  const log: string[] = [];
  const data = changedFields(doc, fix(doc, slug, log) as Record<string, Json>);
  if (!log.length) continue;
  records += 1;
  console.info(`global ${slug}\n${log.join('\n')}`);
  if (apply)
    await payload.updateGlobal({ slug: slug as never, data: data as never, overrideAccess: true });
}
for (const collection of ['pages', 'services']) {
  const res = await payload.find({
    collection: collection as never,
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  });
  for (const doc of res.docs as Record<string, Json>[]) {
    const log: string[] = [];
    const data = changedFields(doc, fix(doc, `${collection}`, log) as Record<string, Json>);
    if (!log.length) continue;
    records += 1;
    console.info(`${collection} ${String(doc.key ?? doc.slug ?? doc.id)}\n${log.join('\n')}`);
    if (apply) {
      await payload.update({
        collection: collection as never,
        id: doc.id as string,
        data: data as never,
        overrideAccess: true,
      });
    }
  }
}

console.info(
  records === 0
    ? '\nNothing to change.'
    : apply
      ? `\nSaved ${records} record(s). Rebuild the site: bash deploy/deploy.sh`
      : `\nDRY RUN. ${records} record(s) would change. Add --apply to save.`,
);
process.exit(0);
