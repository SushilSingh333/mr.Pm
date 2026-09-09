/**
 * End-to-end lead lifecycle, exercised the way the business actually runs it.
 *
 * Posts a quote through the real HTTP endpoint the website calls, then walks the lead
 * from arrival to Won through the access layer as each role: handler assigns, salesperson
 * works it, raises a proposal, closes it. Everything runs with `overrideAccess: false`
 * so the permission rules apply exactly as they would in production.
 *
 * Self-contained: it clears its own leftovers first and removes everything afterwards,
 * so it can be run repeatedly.
 *
 * Needs the CMS running on http://localhost:3000 (override with CMS_URL).
 * Usage (from apps/cms):  npx tsx src/scripts/verify-lead-flow.ts
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
const CUSTOMER = 'Flow Test Customer';
const EMAILS = ['flow.handler@example.test', 'flow.sales@example.test'];

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

/** Remove anything a previous run left behind, so this is repeatable. */
async function sweep(): Promise<void> {
  const leads = (await payload.find({
    collection: 'leads',
    where: { name: { equals: CUSTOMER } } as never,
    overrideAccess: true,
    limit: 100,
  })) as { docs: { id: string | number }[] };
  for (const l of leads.docs) {
    const props = (await payload.find({
      collection: 'proposals',
      where: { lead: { equals: l.id } } as never,
      overrideAccess: true,
      limit: 100,
    })) as { docs: { id: string | number }[] };
    for (const p of props.docs)
      await payload.delete({ collection: 'proposals', id: p.id, overrideAccess: true });
    await payload.delete({ collection: 'leads', id: l.id, overrideAccess: true });
  }
  for (const email of EMAILS) {
    const events = (await payload.find({
      collection: 'login-events',
      where: { userEmail: { equals: email } } as never,
      overrideAccess: true,
      limit: 200,
    })) as { docs: { id: string | number }[] };
    for (const e of events.docs)
      await payload.delete({ collection: 'login-events', id: e.id, overrideAccess: true });
    const users = (await payload.find({
      collection: 'users',
      where: { email: { equals: email } } as never,
      overrideAccess: true,
    })) as { docs: { id: string | number }[] };
    for (const u of users.docs)
      await payload.delete({ collection: 'users', id: u.id, overrideAccess: true });
  }
}

await sweep();

try {
  const handler = (await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name: 'Flow Handler',
      email: EMAILS[0],
      password: 'FlowPass!2026x',
      role: 'handler',
    } as never,
  })) as never as { id: string | number };
  const sales = (await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name: 'Flow Sales',
      email: EMAILS[1],
      password: 'FlowPass!2026x',
      role: 'sales',
    } as never,
  })) as never as { id: string | number };
  const asHandler = { overrideAccess: false, user: handler as never };
  const asSales = { overrideAccess: false, user: sales as never };

  /* ── 1. The website submits a quote ─────────────────────────────────────── */
  const res = await fetch(`${BASE}/api/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify({
      name: CUSTOMER,
      phone: '9812345670',
      from: 'Gomti Nagar, Lucknow',
      to: 'Koregaon Park, Pune',
      service: 'Home Shifting',
      size: '17',
      email: 'flow.customer@example.test',
      notes: 'Piano on the 3rd floor, no service lift.',
    }),
  });
  check('the quote form is accepted', res.status === 200, `status ${res.status}`);

  const arrived = (await payload.find({
    collection: 'leads',
    where: { name: { equals: CUSTOMER } } as never,
    overrideAccess: true,
  })) as {
    docs: {
      id: string | number;
      status?: string;
      email?: string;
      customerNote?: string;
      moveSize?: string;
      pickup?: string;
      dropLocation?: string;
      sourceIp?: string;
    }[];
    totalDocs: number;
  };
  check('it becomes a lead in the CMS', arrived.totalDocs === 1);
  const lead = arrived.docs[0]!;
  check('status starts as New', lead.status === 'new', lead.status);
  check(
    'route captured',
    Boolean(lead.pickup?.includes('Lucknow') && lead.dropLocation?.includes('Pune')),
    `${lead.pickup} -> ${lead.dropLocation}`,
  );
  check('truck size captured', lead.moveSize === '17', lead.moveSize);
  check('email kept', lead.email === 'flow.customer@example.test', lead.email);
  check('what the customer wrote is kept', Boolean(lead.customerNote), lead.customerNote);
  check('originating IP recorded', lead.sourceIp === '203.0.113.9', lead.sourceIp);

  /* ── 2. Handler distributes it ──────────────────────────────────────────── */
  const inQueue = (await payload.find({
    collection: 'leads',
    where: { and: [{ assignedTo: { exists: false } }, { id: { equals: lead.id } }] } as never,
    ...asHandler,
  })) as { totalDocs: number };
  check('handler sees it awaiting an owner', inQueue.totalDocs === 1);

  const assigned = (await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { assignedTo: sales.id } as never,
    ...asHandler,
  })) as never as { status: string; assignedAt?: string; assignedBy?: unknown };
  check('assigning moves it to Assigned', assigned.status === 'assigned', assigned.status);
  check('when it was assigned is stamped', Boolean(assigned.assignedAt));
  check('who assigned it is recorded', Boolean(assigned.assignedBy));

  /* ── 3. Salesperson works it ────────────────────────────────────────────── */
  const mine = (await payload.find({
    collection: 'leads',
    where: { id: { equals: lead.id } } as never,
    ...asSales,
  })) as { docs: { acknowledgedAt?: string | null; customerNote?: string }[]; totalDocs: number };
  check('salesperson sees their lead', mine.totalDocs === 1);
  check('it is unacknowledged until worked', !mine.docs[0]?.acknowledgedAt);
  check('they can read the customer note', Boolean(mine.docs[0]?.customerNote));

  const worked = (await payload.update({
    collection: 'leads',
    id: lead.id,
    ...asSales,
    data: {
      status: 'contacted',
      noteLog: [{ body: 'Called. Piano needs four crew and a pulley.' }],
    } as never,
  })) as never as {
    status: string;
    acknowledgedAt?: string;
    noteLog?: { body: string; author?: unknown; at?: string }[];
  };
  check('they move it to Contacted', worked.status === 'contacted', worked.status);
  check('acting on it acknowledges it', Boolean(worked.acknowledgedAt));
  check('their note records an author', Boolean(worked.noteLog?.[0]?.author));
  check('their note records a time', Boolean(worked.noteLog?.[0]?.at));

  /* ── 4. Proposal ────────────────────────────────────────────────────────── */
  const proposal = (await payload.create({
    collection: 'proposals',
    ...asSales,
    data: { title: 'Lucknow to Pune', lead: lead.id, clientName: CUSTOMER } as never,
  })) as never as { id: string | number };
  const readBack = (await payload.find({
    collection: 'proposals',
    where: { id: { equals: proposal.id } } as never,
    ...asSales,
  })) as { totalDocs: number };
  check('they can raise a proposal on it', readBack.totalDocs === 1);

  const stored = (await payload.findByID({
    collection: 'proposals',
    id: proposal.id,
    overrideAccess: true,
  })) as never as { quoteNo?: string; createdBy?: unknown };
  check('the proposal gets a quote number', Boolean(stored.quoteNo), String(stored.quoteNo));
  check('the proposal records who raised it', Boolean(stored.createdBy));

  /* ── 5. Close, and the trail ────────────────────────────────────────────── */
  const won = (await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { status: 'won' } as never,
    ...asSales,
  })) as never as { status: string };
  check('they can close it Won', won.status === 'won');

  const versions = (await payload.findVersions({
    collection: 'leads',
    where: { parent: { equals: lead.id } } as never,
    overrideAccess: true,
    limit: 50,
  })) as { totalDocs: number };
  check('every change is in the version history', versions.totalDocs >= 3, `${versions.totalDocs}`);
} finally {
  await sweep();
}

console.info(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
