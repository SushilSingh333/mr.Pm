/**
 * One-off: move second chances given under the first version (one "lost with" name on the
 * lead) into `secondChances`, the list the dashboards count from - so whoever lost such a
 * lead keeps it as Lost in their performance, like every second chance since.
 *
 * Non-destructive and safe to run twice: a lead that already has a `secondChances` row is
 * skipped, and nothing else on the lead is touched. The owner is matched by name (or
 * email) against the staff list; a name that matches nobody is kept as a name only.
 * Run: `pnpm --filter @mpm/cms backfill-second-chances`.
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
const { default: config } = await import('../payload.config.js');

interface OldLead {
  id: string | number;
  revivedAt?: string | null;
  revivedFrom?: string | null;
  revivedFromOwnerName?: string | null;
  revivedByName?: string | null;
  secondChances?: unknown[] | null;
}

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  const users = await payload.find({
    collection: 'users',
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const byName = new Map<string, string | number>();
  for (const u of users.docs as { id: string | number; name?: string; email?: string }[]) {
    for (const k of [u.name, u.email]) if (k) byName.set(k.trim().toLowerCase(), u.id);
  }

  const leads = await payload.find({
    collection: 'leads',
    where: { revivedAt: { exists: true } },
    limit: 5000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  let moved = 0;
  let unmatched = 0;
  for (const l of leads.docs as OldLead[]) {
    if ((l.secondChances ?? []).length) continue;
    const name = l.revivedFromOwnerName?.trim() || null;
    const owner = name ? (byName.get(name.toLowerCase()) ?? null) : null;
    if (!owner) unmatched += 1;
    await payload.update({
      collection: 'leads',
      id: l.id,
      data: {
        secondChances: [
          {
            from: (l.revivedFrom ?? 'lost') as never,
            owner: owner as never,
            ownerName: name,
            byName: l.revivedByName ?? null,
            at: l.revivedAt,
          },
        ],
      },
      depth: 0,
      overrideAccess: true,
    });
    moved += 1;
  }

  payload.logger.info(
    `Second chances: ${moved} moved to the new list` +
      (unmatched ? `, ${unmatched} without a matching staff name (kept as a name only)` : '') +
      `, ${leads.docs.length - moved} already done.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
