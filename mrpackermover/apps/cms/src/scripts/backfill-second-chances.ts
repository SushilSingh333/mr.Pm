/**
 * Put each lead's record of who LOST it right, from the lead's own saved history.
 *
 * A loss is a lead at a lost stage (lost, call-not-picked, call-not-connected) leaving the
 * person who took it there - the rule in lib/loss-history.ts, shared with the live Leads
 * hook. Earlier code got this wrong in two ways, and this script corrects both:
 *
 *   MISSING  Before the second-chance work nothing recorded a loss, and its first version
 *            kept a single "lost with" name and only on one path.
 *   WRONG    That first version, and the first backfill built on it, named whoever held
 *            the lead at the moment it was handed on. The oldest code moved leads WITHOUT
 *            resetting the stage, so many sat "Lost" with a person who had only been
 *            passed them - and that person was blamed for leads they never touched.
 *
 * For every lead it reads the history (one snapshot per save, up to 50 kept per lead),
 * works out the real losses and the pass-ons, and reconciles the rows on record:
 *   - a real loss with no row          -> ADD it
 *   - a row that is really a pass-on   -> REMOVE it (it blames the wrong person)
 *   - a row that matches a real loss   -> keep
 *   - a row the history cannot explain -> keep (history pruned, or written live)
 * Matching is by person (id, or name ignoring case) and stage, counted - never by time.
 *
 * Safe:
 *   - a preview by default, listing every add and every removal; --apply to write;
 *   - only `secondChances` changes - never a status or an owner - and each lead's
 *     "last updated" time is put back, so no quote looks freshly worked;
 *   - running it again finds nothing more to do.
 *
 *   pnpm --filter @mpm/cms backfill-second-chances               # preview
 *   pnpm --filter @mpm/cms backfill-second-chances -- --apply    # write it
 *
 * Dates: "handed on" is when the lead left the person; "marked" is when it reached that
 * stage with them. Reviews filter by when the customer enquired, so neither moves a lead
 * between months on a review.
 */
import fs from 'node:fs';
// Type only - erased at build, so it does not load anything before .env is read.
import type { Loss } from '../lib/loss-history.js';

// tsx does not load apps/cms/.env the way Next does, and the Payload config reads the
// environment when it is imported - so load the file first, then import (the same as
// set-team.ts). Real environment variables always win.
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
const { sql } = await import('@payloadcms/db-postgres');
const { default: config } = await import('../payload.config.js');
const { statusMeta, personCase } = await import('../components/dashboard/lead-status.js');
const { readLosses, toSnap } = await import('../lib/loss-history.js');

const APPLY = process.argv.includes('--apply');

/** A row as stored on the lead. */
interface Row {
  from: string;
  owner: string;
  ownerName: string | null;
  byName: string | null;
  at: string;
}
interface Lead {
  id: string | number;
  name?: string;
  updatedAt?: string;
  revivedAt?: string | null;
  revivedFrom?: string | null;
  revivedFromOwnerName?: string | null;
  revivedByName?: string | null;
  secondChances?:
    | {
        from?: string | null;
        owner?: unknown;
        ownerName?: string | null;
        byName?: string | null;
        at?: string | null;
      }[]
    | null;
}

const idOf = (v: unknown): string =>
  v && typeof v === 'object'
    ? String((v as { id?: unknown }).id ?? '')
    : v == null
      ? ''
      : String(v);
const asId = (v: string): string | number | null =>
  v === '' ? null : /^\d+$/.test(v) ? Number(v) : v;
const norm = (v: string | null | undefined): string => (v ?? '').trim().toLowerCase();
const day = (iso: string): string => iso.slice(0, 10);

const payload = await getPayload({ config });

const users = await payload.find({
  collection: 'users',
  limit: 1000,
  pagination: false,
  depth: 0,
  overrideAccess: true,
});
const nameById = new Map<string, string>();
const idByName = new Map<string, string>();
for (const u of users.docs as { id: string | number; name?: string; email?: string }[]) {
  nameById.set(String(u.id), u.name || u.email || `User ${u.id}`);
  for (const k of [u.name, u.email]) if (k) idByName.set(norm(k), String(u.id));
}
const who = (owner: string, fallback?: string | null): string =>
  personCase(nameById.get(owner) ?? fallback ?? 'unknown');

/** Same person: by id, or by name where an early row kept only a name. */
const samePerson = (row: Row, owner: string): boolean =>
  (row.owner !== '' && row.owner === owner) ||
  (norm(row.ownerName) !== '' && norm(row.ownerName) === norm(nameById.get(owner)));

const leads = (
  await payload.find({
    collection: 'leads',
    limit: 100000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
).docs as unknown as Lead[];

interface Plan {
  lead: Lead;
  keep: Row[];
  add: Loss[];
  addByName: Row[];
  remove: { row: Row; passOn: Loss }[];
}
const plans: Plan[] = [];
const tally = { add: 0, remove: 0, right: 0, unexplained: 0, passOns: 0 };
const perPerson = new Map<string, { add: number; remove: number }>();
const bumpPerson = (name: string, k: 'add' | 'remove'): void => {
  const p = perPerson.get(name) ?? { add: 0, remove: 0 };
  p[k] += 1;
  perPerson.set(name, p);
};

for (const lead of leads) {
  const have: Row[] = (lead.secondChances ?? []).map((r) => ({
    from: String(r.from ?? ''),
    owner: idOf(r.owner),
    ownerName: r.ownerName ?? null,
    byName: r.byName ?? null,
    at: String(r.at ?? ''),
  }));

  const history = (
    await payload.findVersions({
      collection: 'leads',
      where: { parent: { equals: lead.id } } as never,
      sort: 'createdAt',
      limit: 200,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
  ).docs as Parameters<typeof toSnap>[0][];
  const { losses, passOns } = readLosses(history.map(toSnap));
  tally.passOns += passOns.length;

  // Each real loss claims one matching row; a loss with no row is missing.
  const used = new Set<number>();
  const add: Loss[] = [];
  for (const loss of losses) {
    const k = have.findIndex(
      (r, i) => !used.has(i) && r.from === loss.from && samePerson(r, loss.owner),
    );
    if (k >= 0) {
      used.add(k);
      tally.right += 1;
    } else add.push(loss);
  }
  // A row left over that is really a pass-on blames someone who never had the lead.
  const remove: Plan['remove'] = [];
  const claimed = new Set<number>();
  have.forEach((r, i) => {
    if (used.has(i)) return;
    const p = passOns.findIndex(
      (po, j) => !claimed.has(j) && po.from === r.from && samePerson(r, po.owner),
    );
    if (p >= 0) {
      claimed.add(p);
      remove.push({ row: r, passOn: passOns[p]! });
    } else tally.unexplained += 1;
  });
  const keep = have.filter((r) => !remove.some((x) => x.row === r));

  // A first-version second chance whose history has been pruned: its stored name.
  const addByName: Row[] = [];
  if (
    !losses.length &&
    !passOns.length &&
    !have.length &&
    lead.revivedAt &&
    lead.revivedFromOwnerName
  ) {
    const nm = lead.revivedFromOwnerName.trim();
    addByName.push({
      from: lead.revivedFrom ?? 'lost',
      owner: idByName.get(norm(nm)) ?? '',
      ownerName: nm,
      byName: lead.revivedByName ?? null,
      at: lead.revivedAt,
    });
  }

  if (!add.length && !remove.length && !addByName.length) continue;
  plans.push({ lead, keep, add, addByName, remove });
  tally.add += add.length + addByName.length;
  tally.remove += remove.length;
  for (const a of add) bumpPerson(who(a.owner), 'add');
  for (const a of addByName) bumpPerson(personCase(a.ownerName ?? 'unknown'), 'add');
  for (const r of remove) bumpPerson(who(r.row.owner, r.row.ownerName), 'remove');
}

// ── Preview ──────────────────────────────────────────────────────────────────────
payload.logger.info(
  `Leads to change: ${plans.length}. Losses to ADD: ${tally.add}. Wrong rows to REMOVE ` +
    `(passed on already lost - not that person's loss): ${tally.remove}. ` +
    `Rows already right: ${tally.right}. Rows kept that history cannot explain: ${tally.unexplained}. ` +
    `Pass-ons seen in history (never counted): ${tally.passOns}.`,
);
for (const [name, p] of [...perPerson.entries()].sort(
  (a, b) => b[1].add + b[1].remove - (a[1].add + a[1].remove),
)) {
  payload.logger.info(`  ${name}: +${p.add} lost, -${p.remove} lost`);
}
for (const { lead, add, addByName, remove } of plans) {
  const title = `#${lead.id} ${personCase(lead.name ?? '')}`;
  for (const a of add) {
    payload.logger.info(
      `    ${title}: + ${statusMeta(a.from).label} with ${who(a.owner)} - marked ${day(a.markedAt)}, handed on ${day(a.at)}`,
    );
  }
  for (const a of addByName) {
    payload.logger.info(
      `    ${title}: + ${statusMeta(a.from).label} with ${personCase(a.ownerName ?? 'unknown')} - from the stored name, handed on ${day(a.at)}`,
    );
  }
  for (const r of remove) {
    payload.logger.info(
      `    ${title}: - ${statusMeta(r.row.from).label} with ${who(r.row.owner, r.row.ownerName)} - it reached them already ${statusMeta(r.passOn.from).label} and was passed on ${day(r.passOn.at)}`,
    );
  }
}

if (!APPLY) {
  payload.logger.info('Preview only - nothing written. Run again with -- --apply to save it.');
  process.exit(0);
}

// ── Apply ────────────────────────────────────────────────────────────────────────
let written = 0;
for (const { lead, keep, add, addByName } of plans) {
  const rows = [
    ...keep,
    ...add.map((a) => ({
      from: a.from,
      owner: a.owner,
      ownerName: nameById.get(a.owner) ?? null,
      byName: a.byName,
      at: a.at,
    })),
    ...addByName,
  ]
    .sort((x, y) => x.at.localeCompare(y.at))
    .map((r) => ({ ...r, owner: asId(r.owner) }));
  await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { secondChances: rows as never },
    depth: 0,
    overrideAccess: true,
  });
  // Put "last updated" back: this is bookkeeping, not somebody working the lead, and the
  // quote-follow-up board reads that time.
  if (lead.updatedAt) {
    await (
      payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
    ).drizzle.execute(
      sql`UPDATE leads SET updated_at = ${lead.updatedAt} WHERE id = ${lead.id as number}`,
    );
  }
  written += 1;
}
payload.logger.info(`Saved: ${written} leads corrected.`);
process.exit(0);
