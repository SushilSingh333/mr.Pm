/**
 * Proves that signing in is fast and that the audit trail actually records it.
 *
 * Logs in over the real HTTP endpoint (not the Local API) with a throwaway account,
 * because the deadlock this guards against only happens inside a live request: the
 * login transaction holds a connection while `afterLogin` tries to open another.
 * Symptom was a ~54s 200 that never redirected and left the trail empty.
 *
 * Needs the CMS running on http://localhost:3000 (override with CMS_URL).
 * Usage (from apps/cms):  npx tsx src/scripts/verify-login-audit.ts
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

const BASE = process.env.CMS_URL ?? 'http://localhost:3000';
const SLOW_MS = 5000;

const { getPayload } = await import('payload');
const { default: config } = await import('../payload.config.js');
const payload = await getPayload({ config });

let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean, detail = ''): void => {
  if (ok) {
    pass += 1;
    console.info(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const stamp = Date.now();
const email = `audit.${stamp}@example.test`;
const password = `Au!${stamp}aA`;
let userId: string | number | undefined;

try {
  const user = (await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { name: 'Audit Probe', email, password, role: 'sales' } as never,
  })) as never as { id: string | number };
  userId = user.id;

  const before = Date.now();
  const res = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const elapsed = Date.now() - before;
  const body = (await res.json()) as { token?: string };

  check('login returns 200', res.status === 200, `status ${res.status}`);
  check('login is not blocked by the audit write', elapsed < SLOW_MS, `${elapsed}ms`);
  check('login returns a token', Boolean(body.token));

  // The write is scheduled for after the response, so give it a moment to land.
  let events = 0;
  for (let i = 0; i < 20 && events === 0; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
    events = (
      (await payload.find({
        collection: 'login-events',
        where: { userEmail: { equals: email } } as never,
        overrideAccess: true,
      })) as { totalDocs: number }
    ).totalDocs;
  }
  check('the sign-in was recorded in the trail', events > 0, `${events} row(s)`);

  if (events > 0) {
    const row = (
      (await payload.find({
        collection: 'login-events',
        where: { userEmail: { equals: email } } as never,
        overrideAccess: true,
        limit: 1,
      })) as { docs: { event?: string; ip?: string | null; userAgent?: string | null }[] }
    ).docs[0];
    check('the row is a login event', row?.event === 'login', String(row?.event));
    check('the row carries an IP', row?.ip != null, String(row?.ip));
  }
} finally {
  if (userId) {
    try {
      const rows = (await payload.find({
        collection: 'login-events',
        where: { userEmail: { equals: email } } as never,
        overrideAccess: true,
        limit: 100,
      })) as { docs: { id: string | number }[] };
      for (const r of rows.docs) {
        await payload.delete({ collection: 'login-events', id: r.id, overrideAccess: true });
      }
      await payload.delete({ collection: 'users', id: userId, overrideAccess: true });
    } catch {
      /* best effort */
    }
  }
}

console.info(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
