/**
 * Rename the brand in stored content: MrPackerMover -> MrMoverPacker.
 *
 * The site's brand name lives in the database, not only in code, so a source rename
 * alone does not change the live pages: `build-manifest` reads `org-profile` and the
 * blog byline straight from Postgres and writes them into manifest.json. Every
 * environment therefore needs this run once against its own database.
 *
 * Deliberately NOT touched:
 *
 *   proposals  Each row is a document already sent to a customer. Rewriting the
 *              company name on quote MPM-20260907-32 would make our archive disagree
 *              with the PDF in that customer's inbox. History stays as it was issued;
 *              only the default for NEW proposals changes, and that lives in code.
 *
 *   emails     `shiftwith@mrpackermover.com` is a mailbox that receives real mail, and
 *              `admin@mrpackermover.local` is a login credential. Renaming either
 *              breaks something real, so both are left for a deliberate decision.
 *
 * Idempotent: it matches on the old name, so a second run is a no-op.
 *
 * Usage (from apps/cms):  npx tsx src/scripts/rebrand.ts [--dry]
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

const OLD = 'MrPackerMover';
const NEW = 'MrMoverPacker';
const DRY = process.argv.includes('--dry');

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const payload = await getPayload({ config });

const swap = (value: unknown): string | null =>
  typeof value === 'string' && value.includes(OLD) ? value.split(OLD).join(NEW) : null;

let changes = 0;
const report = (what: string, from: string, to: string): void => {
  changes += 1;
  console.info(`  ${DRY ? 'would set' : 'set'} ${what}\n      ${from}\n   -> ${to}`);
};

// ── Organisation profile: feeds the header, footer, Terms, Privacy and JSON-LD ──
const org = await payload.findGlobal({ slug: 'org-profile', overrideAccess: true });
const orgPatch: { brandName?: string; legalName?: string } = {};
for (const field of ['brandName', 'legalName'] as const) {
  const current = org[field];
  const next = swap(current);
  if (next) {
    orgPatch[field] = next;
    report(`org-profile.${field}`, String(current), next);
  }
}
if (Object.keys(orgPatch).length && !DRY) {
  await payload.updateGlobal({ slug: 'org-profile', data: orgPatch, overrideAccess: true });
}

// ── Blog byline ────────────────────────────────────────────────────────────────
const posts = await payload.find({
  collection: 'posts',
  where: { author: { like: OLD } },
  limit: 500,
  depth: 0,
  overrideAccess: true,
});
for (const post of posts.docs) {
  const next = swap(post.author);
  if (!next) continue;
  report(`posts#${post.id}.author`, String(post.author), next);
  if (!DRY) {
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { author: next },
      overrideAccess: true,
    });
  }
}

console.info(
  changes === 0
    ? '\n  Nothing to change — already renamed.'
    : `\n  ${DRY ? 'Dry run:' : 'Done:'} ${changes} value(s).`,
);
process.exit(0);
