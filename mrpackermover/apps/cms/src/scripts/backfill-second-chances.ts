/**
 * One-off: put every PAST loss on record, so whoever lost a lead keeps it as Lost in
 * their performance - including leads moved on before that was recorded at all.
 *
 * A loss is a lead at a lost stage (lost, call-not-picked, call-not-connected) leaving its
 * owner: handed to someone else, or unassigned. Since the second-chance work, the Leads
 * hook writes a `secondChances` row whenever that happens. Before it, nothing did:
 *   - the very first code left the lead at its lost stage with the new owner;
 *   - the first second-chance version kept only one "lost with" NAME (revivedFromOwnerName);
 *   - a hand-over that picked a stage in the same save recorded nothing.
 *
 * This reads each lead's version history (every save keeps a snapshot, up to 50 per lead)
 * and finds those moments: a snapshot at a lost stage with owner X, followed by one where
 * X no longer owns it. Each becomes a `secondChances` row for X - the stage, when, and who
 * handed it on. Where the history has been pruned, a first-version lead still gets its
 * row from the stored name.
 *
 * Safe:
 *   - a preview by default; nothing is written without --apply;
 *   - a loss already on record (same person, same stage, within 10 minutes) is skipped,
 *     so it can run any number of times;
 *   - only `secondChances` changes - never a status or an owner - and each lead's
 *     "last updated" time is put back afterwards, so no quote looks freshly touched.
 *
 *   pnpm --filter @mpm/cms backfill-second-chances               # preview
 *   pnpm --filter @mpm/cms backfill-second-chances -- --apply    # write it
 */
import fs from 'node:fs';

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
const { REVIVABLE_STAGES, statusMeta, personCase } =
  await import('../components/dashboard/lead-status.js');

const APPLY = process.argv.includes('--apply');
const SAME_LOSS_MS = 10 * 60 * 1000;

interface Row {
  from: string;
  owner: string | number | null;
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
  secondChances?: (Partial<Row> & { owner?: unknown })[] | null;
}
interface Snapshot {
  createdAt?: string;
  updatedAt?: string;
  version?: { status?: string; assignedTo?: unknown; assignedByName?: string | null };
}

const idOf = (v: unknown): string =>
  v && typeof v === 'object'
    ? String((v as { id?: unknown }).id ?? '')
    : v == null
      ? ''
      : String(v);
const asId = (v: string): string | number => (/^\d+$/.test(v) ? Number(v) : v);

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
  for (const k of [u.name, u.email]) if (k) idByName.set(k.trim().toLowerCase(), String(u.id));
}

const leads = (
  await payload.find({
    collection: 'leads',
    limit: 100000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
).docs as unknown as Lead[];

const perPerson = new Map<string, Map<string, number>>();
const changes: { lead: Lead; add: Row[] }[] = [];
let fromHistory = 0;
let fromName = 0;

for (const lead of leads) {
  const have: Row[] = (lead.secondChances ?? []).map((r) => ({
    from: String(r.from ?? ''),
    owner: idOf(r.owner) || null,
    ownerName: r.ownerName ?? null,
    byName: r.byName ?? null,
    at: String(r.at ?? ''),
  }));
  const add: Row[] = [];
  const known = (r: Row): boolean =>
    [...have, ...add].some(
      (h) =>
        h.from === r.from &&
        String(h.owner ?? h.ownerName ?? '') === String(r.owner ?? r.ownerName ?? '') &&
        Math.abs(new Date(h.at).getTime() - new Date(r.at).getTime()) < SAME_LOSS_MS,
    );

  // The history, oldest first.
  const snaps = (
    await payload.findVersions({
      collection: 'leads',
      where: { parent: { equals: lead.id } } as never,
      sort: 'createdAt',
      limit: 200,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
  ).docs as unknown as Snapshot[];

  for (let i = 0; i + 1 < snaps.length; i++) {
    const was = snaps[i]?.version;
    const next = snaps[i + 1]?.version;
    const stage = String(was?.status ?? '');
    const owner = idOf(was?.assignedTo);
    if (!REVIVABLE_STAGES.includes(stage) || !owner) continue;
    if (idOf(next?.assignedTo) === owner) continue;
    const row: Row = {
      from: stage,
      owner: asId(owner),
      ownerName: nameById.get(owner) ?? null,
      // Whoever the save names as handing it over - blank when it was only unassigned.
      byName: next?.assignedTo ? (next.assignedByName ?? null) : null,
      at: String(snaps[i + 1]?.createdAt ?? snaps[i + 1]?.updatedAt ?? ''),
    };
    if (!known(row)) {
      add.push(row);
      fromHistory += 1;
    }
  }

  // A first-version second chance whose history has been pruned: its stored name.
  if (lead.revivedAt && lead.revivedFromOwnerName && !have.length && !add.length) {
    const nm = lead.revivedFromOwnerName.trim();
    const owner = idByName.get(nm.toLowerCase()) ?? null;
    const row: Row = {
      from: lead.revivedFrom ?? 'lost',
      owner: owner ? asId(owner) : null,
      ownerName: nm,
      byName: lead.revivedByName ?? null,
      at: lead.revivedAt,
    };
    if (!known(row)) {
      add.push(row);
      fromName += 1;
    }
  }

  if (!add.length) continue;
  changes.push({ lead, add });
  for (const r of add) {
    const who = r.ownerName ?? 'Unknown';
    const m = perPerson.get(who) ?? new Map<string, number>();
    m.set(r.from, (m.get(r.from) ?? 0) + 1);
    perPerson.set(who, m);
  }
}

// ── The preview, by person - what each one's Lost will go up by. ──
const lines = [...perPerson.entries()]
  .map(([who, m]) => {
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    const parts = [...m.entries()].map(([v, n]) => `${statusMeta(v).label} ${n}`).join(', ');
    return { who, total, text: `  ${personCase(who)}: +${total} lost (${parts})` };
  })
  .sort((a, b) => b.total - a.total);
payload.logger.info(
  `Past losses found: ${fromHistory + fromName} on ${changes.length} leads ` +
    `(${fromHistory} from version history, ${fromName} from a stored name).`,
);
for (const l of lines) payload.logger.info(l.text);
for (const { lead, add } of changes) {
  for (const r of add) {
    payload.logger.info(
      `    #${lead.id} ${personCase(lead.name ?? '')}: ${statusMeta(r.from).label} with ` +
        `${personCase(r.ownerName ?? 'unknown')}, ${r.at.slice(0, 10)}`,
    );
  }
}

if (!APPLY) {
  payload.logger.info('Preview only - nothing written. Run again with -- --apply to save it.');
  process.exit(0);
}

let written = 0;
for (const { lead, add } of changes) {
  const merged = [
    ...(lead.secondChances ?? []).map((r) => ({
      from: r.from,
      owner: idOf(r.owner) ? asId(idOf(r.owner)) : null,
      ownerName: r.ownerName ?? null,
      byName: r.byName ?? null,
      at: r.at,
    })),
    ...add,
  ].sort((x, y) => String(x.at).localeCompare(String(y.at)));
  await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { secondChances: merged as never },
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
payload.logger.info(`Saved: ${written} leads now carry their past losses.`);
process.exit(0);
