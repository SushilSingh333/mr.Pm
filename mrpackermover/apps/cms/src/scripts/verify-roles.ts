/**
 * Exercises the sales-hierarchy access rules against the real database.
 *
 * Creates a throwaway handler, salesperson and lead, then asserts what each role can
 * actually see and do through Payload's access layer (`overrideAccess: false`), which
 * is the only way to know the rules behave rather than merely compile. Everything it
 * creates is removed at the end, including on failure.
 *
 * Usage (from apps/cms):  npx tsx src/scripts/verify-roles.ts
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

let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean, detail = ''): void => {
  if (ok) {
    pass += 1;
    console.info(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const stamp = Date.now();
const made: { collection: string; id: string | number }[] = [];
const track = <T extends { id: string | number }>(collection: string, doc: T): T => {
  made.push({ collection, id: doc.id });
  return doc;
};

try {
  const handler = track(
    'users',
    (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: 'Test Handler',
        email: `handler.${stamp}@example.test`,
        password: `Hx!${stamp}aA`,
        role: 'handler',
        canCreateSalesUsers: true,
      } as never,
    })) as never as { id: string | number; role: string },
  );

  const salesA = track(
    'users',
    (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: 'Test Sales A',
        email: `salesa.${stamp}@example.test`,
        password: `Sa!${stamp}aA`,
        role: 'sales',
      } as never,
    })) as never as { id: string | number },
  );

  const salesB = track(
    'users',
    (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: 'Test Sales B',
        email: `salesb.${stamp}@example.test`,
        password: `Sb!${stamp}aA`,
        role: 'sales',
      } as never,
    })) as never as { id: string | number },
  );

  const lead = track(
    'leads',
    (await payload.create({
      collection: 'leads',
      overrideAccess: true,
      data: { name: `Test Lead ${stamp}`, phone: '9999999999', status: 'new' } as never,
    })) as never as { id: string | number; status: string },
  );

  const asUser = (u: unknown) => ({ overrideAccess: false, user: u as never });

  /* ── Assignment moves the status, and records who and when ─────────────── */
  const assigned = (await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { assignedTo: salesA.id } as never,
    ...asUser(handler),
  })) as never as { status: string; assignedAt?: string; assignedBy?: unknown };
  check('assignment sets status to "assigned"', assigned.status === 'assigned', assigned.status);
  check('assignment stamps assignedAt', Boolean(assigned.assignedAt));

  const reassigned = (await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { assignedTo: salesB.id } as never,
    ...asUser(handler),
  })) as never as { status: string };
  check(
    'handing over sets status to "reassigned"',
    reassigned.status === 'reassigned',
    reassigned.status,
  );

  /* ── A late-stage lead is not knocked backwards by a reassignment ───────── */
  await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { status: 'quoted' } as never,
    overrideAccess: true,
  });
  const late = (await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { assignedTo: salesA.id } as never,
    ...asUser(handler),
  })) as never as { status: string };
  check('reassigning a quoted lead keeps its status', late.status === 'quoted', late.status);

  /* ── Scoping: B must not see a lead owned by A ──────────────────────────── */
  const seenByB = (await payload.find({
    collection: 'leads',
    where: { id: { equals: lead.id } } as never,
    ...asUser(salesB),
  })) as { totalDocs: number };
  check('salesperson cannot see a lead owned by someone else', seenByB.totalDocs === 0);

  const seenByA = (await payload.find({
    collection: 'leads',
    where: { id: { equals: lead.id } } as never,
    ...asUser(salesA),
  })) as { totalDocs: number };
  check('salesperson sees their own lead', seenByA.totalDocs === 1);

  const seenByHandler = (await payload.find({
    collection: 'leads',
    where: { id: { equals: lead.id } } as never,
    ...asUser(handler),
  })) as { totalDocs: number };
  check('handler sees every lead', seenByHandler.totalDocs === 1);

  /* ── A salesperson cannot route work ────────────────────────────────────── */
  const afterSalesTriedToReassign = (await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { assignedTo: salesB.id } as never,
    ...asUser(salesA),
  })) as never as { assignedTo?: unknown };
  const ownerId =
    typeof afterSalesTriedToReassign.assignedTo === 'object'
      ? (afterSalesTriedToReassign.assignedTo as { id?: unknown })?.id
      : afterSalesTriedToReassign.assignedTo;
  check(
    'salesperson cannot reassign a lead away from themselves',
    String(ownerId) === String(salesA.id),
    `owner is now ${String(ownerId)}`,
  );

  /* ── Privilege escalation ───────────────────────────────────────────────── */
  let escalated = false;
  try {
    const sneaky = (await payload.create({
      collection: 'users',
      data: {
        name: 'Sneaky Admin',
        email: `sneak.${stamp}@example.test`,
        password: `Zz!${stamp}aA`,
        role: 'admin',
      } as never,
      ...asUser(handler),
    })) as never as { id: string | number; role: string };
    made.push({ collection: 'users', id: sneaky.id });
    escalated = sneaky.role === 'admin';
    check(
      'handler creating a user cannot choose the admin role',
      sneaky.role === 'sales',
      `got role="${sneaky.role}"`,
    );
  } catch {
    check('handler creating a user cannot choose the admin role', true, 'create refused');
  }
  if (escalated) console.error('  !! privilege escalation is possible');

  /* ── Content lockdown ───────────────────────────────────────────────────── */
  let contentBlocked = false;
  try {
    await payload.create({
      collection: 'services',
      data: { name: `Should Not Exist ${stamp}`, slug: `nope-${stamp}` } as never,
      ...asUser(salesA),
    });
  } catch {
    contentBlocked = true;
  }
  check('salesperson cannot create site content', contentBlocked);

  // Reading matters as much as writing: hiding a collection from the sidebar does not
  // stop the REST API, so each of these is a real query through the access layer.
  for (const [who, actor] of [
    ['handler', handler],
    ['salesperson', salesA],
  ] as const) {
    for (const collection of ['services', 'locations', 'posts', 'pages', 'reviews'] as const) {
      // Access returning `false` makes Payload throw 403 rather than return an empty
      // page, which is the stronger outcome: refused, not merely filtered.
      let denied = false;
      let seen = 0;
      try {
        const res = (await payload.find({
          collection: collection as never,
          limit: 1,
          ...asUser(actor),
        })) as { totalDocs: number };
        seen = res.totalDocs;
      } catch {
        denied = true;
      }
      check(`${who} cannot read ${collection}`, denied || seen === 0, `saw ${seen} rows`);
    }
  }

  // Content staff must be unaffected by the lockdown.
  const adminUser = (
    (await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } } as never,
      limit: 1,
      overrideAccess: true,
    })) as { docs: unknown[] }
  ).docs[0];
  if (adminUser) {
    const adminSees = (await payload.find({
      collection: 'services',
      limit: 1,
      ...asUser(adminUser),
    })) as { totalDocs: number };
    check('admin still reads site content', adminSees.totalDocs > 0);
  }

  // The draft-less content collections take a different access helper, so they need
  // their own assertions — the first sweep left these readable.
  for (const [who, actor] of [
    ['handler', handler],
    ['salesperson', salesA],
  ] as const) {
    for (const collection of ['faqs', 'people', 'content-blocks', 'jobs-stats'] as const) {
      let denied = false;
      let seen = 0;
      try {
        const res = (await payload.find({
          collection: collection as never,
          limit: 1,
          ...asUser(actor),
        })) as { totalDocs: number };
        seen = res.totalDocs;
      } catch {
        denied = true;
      }
      check(`${who} cannot read ${collection}`, denied || seen === 0, `saw ${seen} rows`);
    }
  }

  // A salesperson must not be able to hang a proposal off someone else's lead.
  let foreignProposalBlocked = false;
  try {
    const bad = (await payload.create({
      collection: 'proposals',
      data: { title: `Foreign ${stamp}`, lead: lead.id } as never,
      ...asUser(salesB),
    })) as never as { id: string | number };
    made.push({ collection: 'proposals', id: bad.id });
  } catch {
    foreignProposalBlocked = true;
  }
  check("salesperson cannot raise a proposal on another owner's lead", foreignProposalBlocked);

  // ...but must still be able to raise one on their own.
  let ownProposalOk = false;
  try {
    const good = (await payload.create({
      collection: 'proposals',
      data: { title: `Own ${stamp}`, lead: lead.id } as never,
      ...asUser(salesA),
    })) as never as { id: string | number };
    made.push({ collection: 'proposals', id: good.id });
    ownProposalOk = true;
  } catch {
    ownProposalOk = false;
  }
  check('salesperson can raise a proposal on their own lead', ownProposalOk);

  // A proposal saved before a lead is attached must stay visible to its author. This
  // is the admin's natural flow, and scoping on the lead alone made the CMS tell a
  // salesperson their own new document "could not be found" the moment they saved.
  const draft = (await payload.create({
    collection: 'proposals',
    data: { title: `Draft ${stamp}` } as never,
    ...asUser(salesA),
  })) as never as { id: string | number };
  made.push({ collection: 'proposals', id: draft.id });

  let draftReadable = false;
  try {
    await payload.findByID({ collection: 'proposals', id: draft.id, ...asUser(salesA) });
    draftReadable = true;
  } catch {
    draftReadable = false;
  }
  check('author can read back a proposal saved without a lead', draftReadable);

  const draftForOther = (await payload.find({
    collection: 'proposals',
    where: { id: { equals: draft.id } } as never,
    ...asUser(salesB),
  })) as { totalDocs: number };
  check('another salesperson cannot see that draft', draftForOther.totalDocs === 0);

  // Counts must obey the same rules as lists. Payload's Local API defaults to
  // overrideAccess:true, so a badge or KPI written without thinking shows totals the
  // person cannot open — the sidebar once told a salesperson "33 new leads" beside an
  // empty list.
  const salesCount = (await payload.count({
    collection: 'leads',
    overrideAccess: false,
    user: salesA as never,
  })) as { totalDocs: number };
  const everyLead = (await payload.count({
    collection: 'leads',
    overrideAccess: true,
  })) as { totalDocs: number };
  check(
    'a lead count run as a salesperson is scoped to their own',
    salesCount.totalDocs < everyLead.totalDocs,
    `sales sees ${salesCount.totalDocs} of ${everyLead.totalDocs}`,
  );

  // The staff directory is not browsable by the sales hierarchy. A salesperson sees
  // only themselves; a handler additionally sees salespeople, because they must pick
  // one to assign work to.
  const salesSeesUsers = (await payload.find({
    collection: 'users',
    limit: 100,
    ...asUser(salesA),
  })) as { docs: { id: string | number }[]; totalDocs: number };
  check(
    'salesperson sees only their own user record',
    salesSeesUsers.totalDocs === 1 && String(salesSeesUsers.docs[0]?.id) === String(salesA.id),
    `${salesSeesUsers.totalDocs} record(s)`,
  );

  const handlerSeesUsers = (await payload.find({
    collection: 'users',
    limit: 100,
    ...asUser(handler),
  })) as { docs: { role?: string }[]; totalDocs: number };
  const handlerSawOnlySalesOrSelf = handlerSeesUsers.docs.every(
    (u) => u.role === 'sales' || u.role === 'handler',
  );
  check('handler sees salespeople and themselves, nobody else', handlerSawOnlySalesOrSelf);
  check(
    'handler cannot see the admin account',
    !handlerSeesUsers.docs.some((u) => u.role === 'admin'),
  );

  // Names must still display without that access, or locking the directory would put
  // bare row ids back on every lead.
  const stamped = (await payload.findByID({
    collection: 'leads',
    id: lead.id,
    overrideAccess: true,
  })) as never as { assignedByName?: string };
  check(
    'the assigner name is stored on the lead itself',
    Boolean(stamped.assignedByName),
    String(stamped.assignedByName),
  );

  // Routing stages belong to the handler. Hiding them from the salesperson's dropdown
  // is presentation; this proves the server refuses them too, because the REST API does
  // not care what the browser rendered.
  let routingRefused = false;
  try {
    await payload.update({
      collection: 'leads',
      id: lead.id,
      data: { status: 'reassigned' } as never,
      ...asUser(salesA),
    });
  } catch {
    routingRefused = true;
  }
  check('salesperson cannot set a routing stage by hand', routingRefused);

  // ...but a working stage must still go through, or the lockdown blocks real work.
  let workingStageOk = false;
  try {
    const moved = (await payload.update({
      collection: 'leads',
      id: lead.id,
      data: { status: 'call-not-picked' } as never,
      ...asUser(salesA),
    })) as never as { status: string };
    workingStageOk = moved.status === 'call-not-picked';
  } catch {
    workingStageOk = false;
  }
  check('salesperson can move a lead to a working stage', workingStageOk);

  // Saving a lead without touching its status must not be rejected just because the
  // status happens to be a routing one.
  await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { status: 'reassigned' } as never,
    overrideAccess: true,
  });
  let resaveOk = false;
  try {
    await payload.update({
      collection: 'leads',
      id: lead.id,
      data: { status: 'reassigned', noteLog: [{ body: 'Left a voicemail.' }] } as never,
      ...asUser(salesA),
    });
    resaveOk = true;
  } catch {
    resaveOk = false;
  }
  check('salesperson can save a reassigned lead without changing its status', resaveOk);

  // A handler is unaffected.
  let handlerOk = false;
  try {
    await payload.update({
      collection: 'leads',
      id: lead.id,
      data: { status: 'assigned' } as never,
      ...asUser(handler),
    });
    handlerOk = true;
  } catch {
    handlerOk = false;
  }
  check('handler can still set a routing stage', handlerOk);

  // The dashboards render a chip per lead by looking the status up in their own list.
  // When that list falls behind the collection, the lookup misses and the lead is shown
  // under the wrong stage while the counts silently omit it. Assert they agree.
  const { LEAD_STATUS } = await import('../components/dashboard/lead-status.js');
  const statusField = (
    payload.config.collections.find((c) => c.slug === 'leads')?.fields as
      { name?: string; options?: { value: string }[] }[] | undefined
  )?.find((f) => f.name === 'status');
  const collectionValues = (statusField?.options ?? []).map((o) => o.value).sort();
  const dashboardValues = LEAD_STATUS.map((x: { value: string }) => x.value).sort();
  check(
    'dashboard status list matches the Leads collection',
    JSON.stringify(collectionValues) === JSON.stringify(dashboardValues),
    `collection=[${collectionValues.join(',')}] dashboard=[${dashboardValues.join(',')}]`,
  );

  // Globals were the gap the collection sweep missed: all three shipped with
  // `update: isAuthenticated`, so anyone signed in could rewrite the home page.
  for (const [who, actor] of [
    ['handler', handler],
    ['salesperson', salesA],
  ] as const) {
    for (const slug of ['home-content', 'org-profile', 'seo-defaults'] as const) {
      let denied = false;
      try {
        await payload.updateGlobal({
          slug: slug as never,
          data: {} as never,
          ...asUser(actor),
        });
      } catch {
        denied = true;
      }
      check(`${who} cannot edit the ${slug} global`, denied);
    }
  }

  // The public contract is unchanged: anonymous still reads published rows.
  const anon = (await payload.find({
    collection: 'services',
    limit: 1,
    overrideAccess: false,
  })) as { totalDocs: number };
  check('anonymous still reads published content', anon.totalDocs > 0);

  /* ── Proposals follow their lead ────────────────────────────────────────── */
  const proposal = track(
    'proposals',
    (await payload.create({
      collection: 'proposals',
      overrideAccess: true,
      data: { title: `Test Proposal ${stamp}`, lead: lead.id } as never,
    })) as never as { id: string | number },
  );
  const propsForA = (await payload.find({
    collection: 'proposals',
    where: { id: { equals: proposal.id } } as never,
    ...asUser(salesA),
  })) as { totalDocs: number };
  const propsForB = (await payload.find({
    collection: 'proposals',
    where: { id: { equals: proposal.id } } as never,
    ...asUser(salesB),
  })) as { totalDocs: number };
  check('salesperson sees the proposal for their own lead', propsForA.totalDocs === 1);
  check("salesperson cannot see another owner's proposal", propsForB.totalDocs === 0);

  /* ── Audit trail ────────────────────────────────────────────────────────── */
  const events = (await payload.find({
    collection: 'login-events',
    limit: 1,
    overrideAccess: true,
  })) as { totalDocs: number };
  check('login-events collection is queryable', typeof events.totalDocs === 'number');
} finally {
  for (const m of made.reverse()) {
    try {
      await payload.delete({ collection: m.collection as never, id: m.id, overrideAccess: true });
    } catch {
      /* best effort */
    }
  }
}

console.info(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
