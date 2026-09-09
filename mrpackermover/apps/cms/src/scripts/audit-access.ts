/**
 * Prints what every role can actually do to every collection and global.
 *
 * Built by evaluating the real access functions from the loaded Payload config, not by
 * reading the source, so it reflects what the server will actually enforce. Reads are
 * additionally executed for real against the database, because an access rule that
 * returns a query constraint behaves differently from one returning true.
 *
 * Use it to spot a collection that was missed in a lockdown sweep. Nothing is written.
 *
 * Usage (from apps/cms):  npx tsx src/scripts/audit-access.ts
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
const payload = await getPayload({ config });

const ROLES = ['admin', 'editor', 'ops', 'handler', 'sales', null] as const;
const label = (r: (typeof ROLES)[number]): string => r ?? 'anon';
const VERBS = ['create', 'read', 'update', 'delete'] as const;

/** '.' allowed, 'x' denied, '~' allowed but filtered to a subset. */
async function evaluate(fn: unknown, role: (typeof ROLES)[number]): Promise<string> {
  if (typeof fn !== 'function') return '.'; // Payload's default is "authenticated"
  const user = role ? { id: 1, role, email: `${role}@x.test`, canCreateSalesUsers: true } : null;
  try {
    const out = await (fn as (a: unknown) => unknown)({
      req: { user, payload, headers: new Headers() },
      id: undefined,
      data: {},
    });
    if (out === true) return '.';
    if (out === false || out == null) return 'x';
    return '~';
  } catch {
    return '?';
  }
}

// Read the resolved config off the running instance: the module export is a promise.
const resolved = payload.config as unknown as {
  collections: { slug: string; access?: unknown }[];
  globals?: { slug: string; access?: unknown }[];
};
const collections = resolved.collections ?? [];
const globals = resolved.globals ?? [];

console.info('\n  COLLECTIONS         ' + ROLES.map((r) => label(r).padEnd(8)).join(''));
console.info('  ' + '-'.repeat(20 + ROLES.length * 8));

const rows: { slug: string; verb: string; cells: string[] }[] = [];
for (const c of collections) {
  for (const verb of VERBS) {
    const fn = (c.access as Record<string, unknown> | undefined)?.[verb];
    const cells: string[] = [];
    for (const role of ROLES) cells.push(await evaluate(fn, role));
    rows.push({ slug: c.slug, verb, cells });
  }
}

let current = '';
for (const r of rows) {
  const head = r.slug === current ? '' : r.slug;
  current = r.slug;
  console.info(
    `  ${head.padEnd(20)}`.slice(0, 22).padEnd(2) +
      `${head.padEnd(18)} ${r.verb.padEnd(7)} ` +
      r.cells.map((c) => c.padEnd(8)).join(''),
  );
}

console.info('\n  GLOBALS             ' + ROLES.map((r) => label(r).padEnd(8)).join(''));
console.info('  ' + '-'.repeat(20 + ROLES.length * 8));
for (const g of globals) {
  for (const verb of ['read', 'update'] as const) {
    const fn = (g.access as Record<string, unknown> | undefined)?.[verb];
    const cells: string[] = [];
    for (const role of ROLES) cells.push(await evaluate(fn, role));
    console.info(
      `  ${g.slug.padEnd(18)} ${verb.padEnd(7)} ` + cells.map((c) => c.padEnd(8)).join(''),
    );
  }
}

console.info('\n  legend: . = allowed   x = denied   ~ = allowed but filtered   ? = threw\n');

/* ── Flag anything the sales hierarchy can reach that it probably should not ── */
const SALES_MAY_TOUCH = new Set(['leads', 'proposals', 'users', 'media', 'login-events']);
const problems: string[] = [];
for (const r of rows) {
  if (SALES_MAY_TOUCH.has(r.slug)) continue;
  const handler = r.cells[3];
  const sales = r.cells[4];
  if (handler !== 'x' || sales !== 'x') {
    problems.push(`${r.slug}.${r.verb}  handler=${handler} sales=${sales}`);
  }
}
if (problems.length) {
  console.info('  REVIEW — sales hierarchy can reach these:');
  for (const p of problems) console.info(`    ${p}`);
} else {
  console.info('  No collection outside the sales scope is reachable by handler or sales.');
}
process.exit(0);
