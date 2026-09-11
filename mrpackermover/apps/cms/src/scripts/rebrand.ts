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
 *   emails     `admin@mrpackermover.local` is a login credential, not a mailbox.
 *              Changing it locks that person out, so it stays as it is. The public
 *              contact address moved to the new domain in code once the mailbox
 *              existed; nothing about it is stored here.
 *
 * Also clears the LinkedIn entry from `org-profile.sameAs`. sameAs is the list of
 * other profiles Google may check to confirm this business is real, so a link to a
 * profile we no longer publish is worse there than no link at all.
 *
 * Idempotent: every step matches on what it is replacing, so a second run is a no-op.
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

// ── Verified profiles ──────────────────────────────────────────────────────────
//
// The row shape is declared here rather than inferred from `org.sameAs`.
// payload-types.ts is generated, and a copy that has drifted from this one — a
// `generate:types` run on the server, say — can resolve the field to `any`, which
// makes these callback parameters implicitly `any` and fails the build's typecheck
// on that machine while passing on this one. Annotating the array keeps the script
// typechecking the same way everywhere, which for a one-shot migration script run
// on an unfamiliar box is worth more than the inference.
type SameAsRow = { url: string; id?: string | null };
const sameAs = (org.sameAs ?? []) as SameAsRow[];
const isLinkedIn = (url: string): boolean => url.toLowerCase().includes('linkedin.com');
const keptProfiles = sameAs.filter((row: SameAsRow) => !isLinkedIn(row.url));
if (keptProfiles.length !== sameAs.length) {
  for (const dropped of sameAs.filter((row: SameAsRow) => isLinkedIn(row.url))) {
    report('org-profile.sameAs', dropped.url, '(removed)');
  }
  if (!DRY) {
    await payload.updateGlobal({
      slug: 'org-profile',
      data: { sameAs: keptProfiles },
      overrideAccess: true,
    });
  }
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
