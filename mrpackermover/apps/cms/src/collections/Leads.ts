import type { CollectionConfig } from 'payload';
import { DAY_AND_TIME, DAY_ONLY, checkYear } from '../lib/date-display.js';
import { leadsRead, leadsUpdate, leadsDelete, isRole, leadsReadVersions } from '../access/index.js';
import {
  DATED_STAGES,
  FRESH_STAGES,
  LEAD_SOURCES,
  LEAD_STATUS,
  ROUTING_STAGES,
  SALES_SETTABLE,
  humanList,
} from '../components/dashboard/lead-status.js';

/**
 * Whether a where clause only lets dated stages through - see the `beforeOperation` hook.
 *
 * Only the AND side of the tree narrows a result, so only it is walked: a status
 * condition inside an OR is one alternative among others and restricts nothing. Any
 * single AND-ed condition that allows dated stages alone is enough, because everything
 * else is intersected with it.
 */
function onlyDatedStages(where: unknown): boolean {
  if (!where || typeof where !== 'object') return false;
  const node = where as Record<string, unknown>;
  const status = node.status as { equals?: unknown; in?: unknown } | undefined;
  if (status && typeof status === 'object') {
    const raw = status.in ?? status.equals;
    // `in` arrives as an array from the admin, and as "a,b" from a hand-typed URL.
    const values = (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [])
      .map((v) => String(v).trim())
      .filter(Boolean);
    if (values.length && values.every((v) => DATED_STAGES.includes(v))) return true;
  }
  return Array.isArray(node.and) && node.and.some(onlyDatedStages);
}

/**
 * Quote-form submissions. Created by the public `/quote` endpoint (create access is
 * open so the form can submit); read and worked by the sales hierarchy.
 *
 * Who sees what (enforced in access/index.ts, not just hidden in the UI):
 *   admin, handler — every lead. Distributing work requires seeing all of it.
 *   sales          — only leads assigned to them, as a query constraint, so the list,
 *                    the counts and every REST response filter identically.
 *
 * Assignment is tracked rather than merely stored: the status moves to `assigned` on
 * first assignment and `reassigned` when the lead changes hands, and `assignedAt` /
 * `assignedBy` record when and by whom. `acknowledgedAt` is what makes a lead "new to
 * me" on the salesperson's dashboard until they open it.
 *
 * Versions are on, so every change is attributed and reversible — that is the activity
 * trail an admin reads, with no bespoke logging.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    group: 'Inbox',
    // `dueAt` earns its column now that moves are booked on it: the Schedule button
    // lands here, and a schedule you cannot read the date off is not one. It is empty on
    // a lead with nothing promised, which is the honest answer rather than a gap.
    defaultColumns: ['name', 'dueAt', 'phone', 'service', 'status', 'assignedTo', 'createdAt'],
    // Sits directly above the table, next to the tick boxes it acts on. Routing a
    // selection in one go is the difference between covering for someone's leave in a
    // minute and doing it twenty times by hand.
    components: {
      beforeListTable: [
        // Filters first, then the bulk bar: you narrow the list, then act on what is
        // left, and that is the order they should appear in.
        '/components/leads/LeadFilters#LeadFilters',
        '/components/leads/BulkAssign#BulkAssign',
      ],
    },
    description:
      'Every quote form and price check lands here. Newest first. Filter by date, status, owner or source.',
  },
  versions: { drafts: false, maxPerDoc: 50 },
  access: {
    // The public form must be able to create a lead; everything else is role-scoped.
    create: () => true,
    read: leadsRead,
    // Version history is a second door onto the same rows; Payload leaves it open.
    readVersions: leadsReadVersions,
    update: leadsUpdate,
    delete: leadsDelete,
  },
  hooks: {
    /**
     * A list of promises reads in the order they come due.
     *
     * Filter the Leads list to Scheduled - which is exactly what the sidebar's Schedule
     * button does - and the rows used to arrive newest-first, so Thursday's move could
     * sit under next month's because it was booked earlier. Nobody reading a schedule
     * wants it in the order it was written.
     *
     * WHY HERE AND NOT IN THE LINK. A `sort` in the URL is saved as the reader's list
     * preference the moment the page renders, so a link that ordered by the move date
     * left the plain Leads list ordered that way for good. This runs only when NOBODY
     * asked for an order - no sort in the URL, none saved, none passed by the caller -
     * so a header somebody clicked still wins, the dashboard (which always names its
     * sort) is untouched, and the unfiltered list stays newest first.
     *
     * "Dated" means every status the query allows is a dated one. A mix of Scheduled and
     * Quoted is not a schedule - half of it has no date - so it keeps the normal order.
     */
    beforeOperation: [
      ({ args, operation }) => {
        if (operation !== 'read') return args;
        const a = args as { where?: unknown; sort?: unknown };
        if (a.sort || !a.where) return args;
        if (!onlyDatedStages(a.where)) return args;
        return { ...args, sort: ['dueAt', '-createdAt'] };
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        if (!data) return data;

        const meId = (req.user as { id?: string | number } | null)?.id ?? null;
        const before = idOf(originalDoc?.assignedTo);
        const after = idOf(data.assignedTo);
        // True when THIS save is the one handing the lead over. Acknowledgement must not
        // fire in the same breath as the assignment that created it.
        let handedOverNow = false;

        if (operation === 'update' && before !== after && after) {
          // Changing hands is materially different from a first assignment, and the
          // pipeline should say which. Status only moves while the lead is still in
          // its early stages: a lead already `quoted` must not be knocked backwards
          // because it was handed to someone else.
          const early = ['new', 'assigned', 'reassigned'];
          const current = (data.status ?? originalDoc?.status) as string | undefined;
          if (current && early.includes(current)) {
            data.status = before ? 'reassigned' : 'assigned';
          }
          data.assignedAt = new Date().toISOString();
          data.assignedBy = meId;
          // Store the name too. Displaying a relationship requires read access on the
          // target, and salespeople are not allowed to read the staff directory — without
          // this the lead would show "assigned by 3" instead of naming the handler.
          // It also survives the account later being deleted.
          data.assignedByName =
            (req.user as { name?: string; email?: string } | null)?.name ??
            (req.user as { email?: string } | null)?.email ??
            null;
          // The new owner has not seen it yet, whoever had it before.
          data.acknowledgedAt = null;
          handedOverNow = true;
        }

        // Clearing the owner returns the lead to the distribution queue.
        if (operation === 'update' && before && !after) {
          data.assignedAt = null;
          data.assignedBy = null;
          data.assignedByName = null;
          data.acknowledgedAt = null;
        }

        // The owner acting on their own lead is what clears "new to you". Deliberately
        // tied to a save rather than a page view: opening a lead and doing nothing is
        // not acknowledgement, and hooking reads reliably is not possible here anyway.
        const ownerNow = idOf(data.assignedTo ?? originalDoc?.assignedTo);
        if (
          operation === 'update' &&
          meId != null &&
          ownerNow != null &&
          String(ownerNow) === String(meId) &&
          !originalDoc?.acknowledgedAt &&
          // NOT `data.acknowledgedAt !== null`: in beforeChange `data` is the merged
          // document, so an unacknowledged lead always arrives here with null and that
          // test silently skipped every stamp. What we actually mean is "unless this
          // very save is the hand-over".
          !handedOverNow
        ) {
          data.acknowledgedAt = new Date().toISOString();
        }

        // `new`, `assigned` and `reassigned` are set by the assignment logic above, not
        // chosen by a person. A salesperson may keep whichever one their lead already
        // carries, but may not select one: it would be meaningless coming from them and
        // would misreport how the lead was routed. Hiding them in the UI is not enough,
        // because the REST API would still accept the value.

        if (
          operation === 'update' &&
          isRole(req, 'sales') &&
          typeof data.status === 'string' &&
          ROUTING_STAGES.includes(data.status) &&
          data.status !== originalDoc?.status
        ) {
          // Built from the stage list, not typed out. The hand-written version had to be
          // edited every time a stage was added, and a message naming the wrong options is
          // worse than none - it sends someone looking for a status that is not there.
          throw new Error(
            'Only a handler can assign or reassign a lead. Move it to ' +
              humanList(SALES_SETTABLE.map((x) => x.label)) +
              '.',
          );
        }

        /**
         * A stage change writes itself into the trail.
         *
         * This is what makes "What has happened" fill itself instead of depending on
         * somebody remembering to type. Moving a lead to "Call not picked" IS the record
         * that a call was not picked; asking for a note as well would get one of the two
         * done and leave the history lying by omission.
         *
         * THE APPEND MUST MERGE. `data` here is the INCOMING write, not the merged
         * document - true for the admin form, which submits every field, but false for
         * `payload.update({ data: { status: 'quoted' } })`, which Proposals already does.
         * And @payloadcms/drizzle deletes every child row of an array present in a write
         * before re-inserting what was supplied, so assigning a one-element array would
         * delete every earlier note on the lead. Falling back to `originalDoc.noteLog` is
         * the whole safety of this block.
         *
         * Skipped when the same save already carries a typed entry for the move, so
         * pressing a button that sets a stage AND writes its own note does not produce
         * two lines saying the same thing.
         */
        if (operation === 'update' && data.status && originalDoc?.status !== data.status) {
          const rows = (
            Array.isArray(data.noteLog) ? data.noteLog : (originalDoc?.noteLog ?? [])
          ) as Record<string, unknown>[];
          const explained = rows.some(
            (n) => n && !n.at && typeof n.kind === 'string' && n.kind !== 'note',
          );
          // Assignment already writes its own line from `assignedAt`, so the routing
          // stages would only repeat it.
          const routing = ROUTING_STAGES.includes(String(data.status));
          if (!explained && !routing) {
            const label =
              SALES_SETTABLE.find((x) => x.value === data.status)?.label ?? String(data.status);
            data.noteLog = [...rows, { kind: 'stage', body: label }];
          }
        }

        // Stamp author and time on any note that arrived without them.
        if (Array.isArray(data.noteLog)) {
          const now = new Date().toISOString();
          const myName =
            (req.user as { name?: string; email?: string } | null)?.name ??
            (req.user as { email?: string } | null)?.email ??
            null;
          data.noteLog = data.noteLog.map((n: Record<string, unknown>) =>
            n && !n.at
              ? { ...n, at: now, author: n.author ?? meId, authorName: n.authorName ?? myName }
              : n,
          );
        }

        /**
         * The waiting clock, stamped last in this hook.
         *
         * Last on purpose: the hand-over branch above moves the stage to `assigned` or
         * `reassigned`, and reading it before that ran would stamp the clock against a
         * stage the lead is about to leave.
         *
         * The routing hook that runs AFTER this one can also set a stage, but only ever
         * `new` -> `assigned` on a create. Both are stages where nobody has called yet,
         * so they take the same branch here and the stamp is unaffected either way.
         *
         * See the `waitingSince` field for why this is stored rather than derived. The
         * rule is the whole of it: a lead nobody has called yet is measured from when it
         * arrived, anything further along from this moment.
         */
        const stage = String(data.status ?? originalDoc?.status ?? 'new');

        /**
         * A date outlives its promise, so it is cleared when the promise ends.
         *
         * Left behind, a won lead keeps the date of the move it already completed, and
         * every "what is due" query on the board has to remember to exclude won, lost and
         * invalid leads forever. Clearing it once here means the date's presence IS the
         * promise, and nothing downstream needs to know the stage list.
         */
        /**
         * Except for a move's own day, which is history worth keeping.
         *
         * A move marked Won or Lost keeps its date, because the calendar shows what
         * happened on a day as well as what is still to happen: a Tuesday that ran three
         * moves should not go blank the moment all three are marked Won. Nothing that
         * asks "what is due" is affected - every such query already leaves out closed
         * leads.
         *
         * What IS still cleared is a callback's date. "Ring me Thursday" means nothing
         * once the lead is closed, and kept, it would put a phone call on the calendar
         * as though it were a move. So the date goes when a lead closes FROM Call later
         * or Follow up, and whenever a lead goes back into an open, undated stage.
         *
         * The first version kept the date only on the way out of Scheduled and dropped
         * it on every other save of a closed lead - so a Won lead that had lost its date
         * could never be given it back, not even by typing it in.
         */
        const was = String(originalDoc?.status ?? '');
        const closing = stage === 'won' || stage === 'lost';
        const fromCallback = (was === 'call-later' || was === 'follow-up') && was !== stage;
        // Only the callback time carried over is dropped. A date typed in the same save
        // that closes the lead is the move day, and is kept - otherwise "Won, moving on
        // the 12th" from a callback lost the 12th. Absent from the save = unchanged.
        const asTime = (v: unknown): number | null => (v ? new Date(String(v)).getTime() : null);
        const carriedOver =
          data.dueAt === undefined || asTime(data.dueAt) === asTime(originalDoc?.dueAt);
        if (!DATED_STAGES.includes(stage) && (!closing || (fromCallback && carriedOver))) {
          data.dueAt = null;
        }

        if (FRESH_STAGES.includes(stage)) {
          // `createdAt` is absent on create - the row does not exist yet - and on create
          // "now" and "arrived" are the same instant anyway.
          const arrived = (originalDoc?.createdAt ?? data.createdAt) as string | undefined;
          data.waitingSince = arrived ?? new Date().toISOString();
        } else {
          data.waitingSince = new Date().toISOString();
        }

        return data;
      },
      /**
       * Round-robin routing, when it is switched on.
       *
       * Runs on create only, and only when nobody has already been chosen: an explicit
       * owner always wins over the rotation, so a handler creating a lead for a
       * particular salesperson is never overridden.
       *
       * This sets the same four fields the hand-over branch above sets, because from the
       * lead's point of view nothing different has happened - it has an owner, it was
       * given one at a moment in time, and that owner has not looked at it yet. Leaving
       * `status` at `new` would have been the subtle version of this bug: the lead would
       * sit in a salesperson's queue while every count on the board still called it
       * unclaimed.
       *
       * `req` is passed to every call. A hook runs inside the caller's transaction, and a
       * Payload operation without it opens a second connection that waits on the first -
       * which is a deadlock, not a slow query.
       */
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data;
        if (data.assignedTo) return data;

        try {
          const routing = (await req.payload.findGlobal({
            slug: 'lead-routing',
            depth: 0,
            overrideAccess: true,
            req,
          })) as {
            autoAssign?: boolean;
            members?: unknown[];
            lastAssignedTo?: unknown;
            assignedCount?: number;
          };
          if (!routing?.autoAssign) return data;

          const configured = (routing.members ?? []).map(idOf).filter((v) => v != null);
          if (configured.length === 0) return data;

          // Re-read the pool rather than trusting the stored ids. A person who has left
          // may still be in the list, or may have been moved off the sales side
          // entirely, and routing a customer to an account nobody opens is worse than
          // leaving the lead unclaimed where a handler will see it.
          const eligible = await req.payload.find({
            collection: 'users',
            depth: 0,
            limit: 100,
            overrideAccess: true,
            req,
            where: {
              and: [{ id: { in: configured } }, { role: { in: ['handler', 'sales'] } }],
            } as never,
          });
          const live = new Set(eligible.docs.map((u) => String(u.id)));
          // Configured order, not query order - the list on screen is the rotation.
          const pool = configured.filter((id) => live.has(String(id)));
          if (pool.length === 0) return data;

          const lastId = idOf(routing.lastAssignedTo);
          const lastIndex = pool.findIndex((id) => String(id) === String(lastId));
          // -1 covers both "never run" and "the last person served has since left the
          // rotation"; either way the next lead starts the list again.
          const next = pool[(lastIndex + 1) % pool.length];
          if (next == null) return data;

          data.assignedTo = next;
          data.assignedAt = new Date().toISOString();
          data.assignedBy = null;
          data.assignedByName = 'Round robin';
          data.acknowledgedAt = null;
          data.status = 'assigned';

          await req.payload.updateGlobal({
            slug: 'lead-routing',
            data: {
              lastAssignedTo: next,
              assignedCount: Number(routing.assignedCount ?? 0) + 1,
            } as never,
            overrideAccess: true,
            req,
          });
        } catch (error) {
          // A lead that arrives unassigned is a lead a handler will pick up. A lead that
          // was never saved is gone, and the visitor who filled the form has no idea.
          //
          // This does NOT make the pre-migration window safe, and it would be comforting
          // to think it did: in Postgres an error inside a transaction aborts the whole
          // transaction, so if the lead_routing table is missing, catching the failure
          // here does not rescue the insert that follows it. The deploy order is what
          // covers that - migrate before restarting, so the new code never runs against
          // the old schema. See the runbook.
          req.payload.logger.error({ err: error }, 'lead-routing: could not auto-assign');
        }

        return data;
      },
    ],
  },
  fields: [
    {
      // Opens a new proposal pre-pointed at this lead. See components/leads/CreateProposal.
      name: 'createProposal',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/leads/CreateProposal#CreateProposal' },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            // On the mobile card this is the heading, and quote forms very often arrive
            // in capitals - which wraps onto two lines and reads as shouting.
            components: { Cell: '/components/leads/Cells#NameCell' },
          },
        },
        {
          name: 'phone',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            // The Phone column in the list becomes Call / WhatsApp buttons, so a lead
            // can be rung from the list rather than opened to copy a number out.
            components: { Cell: '/components/leads/PhoneActions#PhoneCell' },
          },
        },
      ],
    },
    {
      // Sits directly under the phone number, where the call actually gets made.
      name: 'phoneActions',
      type: 'ui',
      admin: { components: { Field: '/components/leads/PhoneActions#PhoneField' } },
    },
    {
      name: 'email',
      type: 'email',
      admin: { description: 'Given on the form when the customer chose to.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'service',
          type: 'text',
          // Empty is normal - a price check never names a service - and Payload's
          // "<No Service>" placeholder reads as a fault on the list card.
          admin: { width: '50%', components: { Cell: '/components/leads/Cells#ServiceCell' } },
        },
        { name: 'moveSize', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'pickup', type: 'text', admin: { width: '50%' } },
        { name: 'dropLocation', type: 'text', label: 'Drop location', admin: { width: '50%' } },
      ],
    },
    { name: 'moveDate', type: 'date', admin: { date: DAY_ONLY }, validate: checkYear },
    {
      /**
       * What the customer was actually shown.
       *
       * The quote form prices the move in the browser and displays a range, but that
       * figure was never sent anywhere - so a coordinator rang a customer who had a
       * number in their head, with no idea what it was. Anchoring is the whole problem:
       * if they saw 38,000 and you open at 52,000 the call is over before it starts.
       *
       * Read-only, and deliberately labelled as what the CUSTOMER SAW rather than as a
       * price we stand behind. It arrives from the browser, so it is informational; the
       * binding number is the one on the proposal.
       */
      type: 'collapsible',
      label: 'What the customer was shown',
      admin: { initCollapsed: false, condition: (data) => Boolean(data?.quotedLow) },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'quotedLow',
              label: 'Estimate shown (low)',
              type: 'number',
              admin: { readOnly: true, width: '33%' },
            },
            {
              name: 'quotedHigh',
              label: 'Estimate shown (high)',
              type: 'number',
              admin: { readOnly: true, width: '33%' },
            },
            {
              name: 'distanceKm',
              label: 'Distance (km)',
              type: 'number',
              admin: { readOnly: true, width: '34%' },
            },
          ],
        },
        {
          name: 'quoteBasis',
          label: 'Priced on',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Truck size, route type and packing grade the estimate assumed.',
          },
        },
      ],
    },
    {
      // What the customer typed into "Anything else we should know?". Read-only because
      // it is their words, not ours: staff notes belong in the log below. This was being
      // collected by the form and silently dropped before it ever reached the CMS.
      name: 'customerNote',
      label: 'What the customer told us',
      type: 'textarea',
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.customerNote),
        description: 'Straight from the quote form.',
      },
    },
    {
      name: 'noteLog',
      label: 'Notes',
      type: 'array',
      labels: { singular: 'Note', plural: 'Notes' },
      admin: {
        description:
          'Append a note. Author and time are stamped automatically and cannot be edited.',
      },
      fields: [
        { name: 'body', type: 'textarea', required: true },
        {
          /**
           * What KIND of thing happened, so the trail can be read at a glance instead of
           * as a wall of sentences. Written by the app, never chosen by hand: a plain
           * note defaults to `note`, and the hooks below stamp the rest.
           *
           * On the existing array rather than in a second one - `noteLog` already carries
           * author, name and time, already has its stamping hook, and already renders and
           * validates inside the native form. A parallel "events" array would have to
           * re-earn all four, and the two would drift.
           */
          name: 'kind',
          type: 'select',
          defaultValue: 'note',
          admin: {
            readOnly: true,
            description: 'Typed entries are written by the app.',
          },
          options: [
            { label: 'Note', value: 'note' },
            { label: 'Call — answered', value: 'call-answered' },
            { label: 'Call — no answer', value: 'call-no-answer' },
            { label: 'Call — ring back later', value: 'call-later' },
            { label: 'Quote sent', value: 'quote-sent' },
            { label: 'Competitor quote', value: 'competitor' },
            { label: 'Final price', value: 'price' },
            { label: 'Stage change', value: 'stage' },
            { label: 'Handover', value: 'handover' },
          ],
        },
        {
          name: 'amount',
          type: 'number',
          label: 'Amount (₹)',
          admin: { readOnly: true, description: 'The figure this entry is about, if any.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              admin: { readOnly: true, width: '50%' },
            },
            { name: 'authorName', type: 'text', admin: { readOnly: true, width: '50%' } },
            {
              name: 'at',
              type: 'date',
              admin: {
                readOnly: true,
                width: '50%',
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, h:mm a' },
              },
            },
          ],
        },
      ],
    },
    {
      /**
       * "What has happened" - the lead's history, directly under the notes that feed it.
       *
       * A `ui` field, so it renders inside Payload's own form and nothing about saving,
       * validation, access or the Versions tab changes. The component is a CLIENT
       * component by necessity: Payload renders a server `ui` field once and never again
       * (renderField.js stamps `lastRenderedPath` and skips re-renders), which would
       * freeze a widget whose entire job is showing what just happened.
       *
       * It reads three sources and stores none of them twice: the typed entries on
       * `noteLog` above, the proposals raised against this lead, and the lead's own
       * arrival and hand-over read straight off `createdAt` / `source` / `assignedAt`.
       * That last part is why every lead that already exists has a history today, with
       * no backfill.
       */
      name: 'leadTimeline',
      type: 'ui',
      admin: { components: { Field: '/components/leads/LeadTimeline#LeadTimeline' } },
    },
    {
      // The original free-text notes field, kept rather than migrated away. Dropping it
      // would mean a destructive column change that Postgres cannot distinguish from a
      // rename, and would put existing notes at risk on a live database for no real
      // gain. It is read-only and only appears on leads that actually have one.
      name: 'notes',
      label: 'Earlier notes',
      type: 'textarea',
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.notes),
        description: 'Written before authored notes existed. Kept for the record.',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'quote-form',
      admin: { position: 'sidebar', description: 'How this lead came in.' },
      // Derived, for the same reason the status options are: the dashboard and the
      // filter bar both read this list, and a hand-written copy here is a fourth place
      // for it to drift.
      options: LEAD_SOURCES.map((s) => ({ label: s.label, value: s.value })),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      admin: {
        position: 'sidebar',
        // Hides the routing stages from salespeople. Presentation only — the rule is
        // enforced in beforeChange above.
        components: { Field: '/components/fields/LeadStatusSelect#LeadStatusSelect' },
      },
      /**
       * Derived from the stage list, not typed out beside it.
       *
       * This was a hand-written copy of `LEAD_STATUS`, kept in step by a check in
       * verify-roles that failed loudly whenever the two drifted - which is a test
       * guarding a duplication rather than a reason to have one. Adding "Scheduled" was
       * the moment it stopped being free: the list, the select, the dashboard pills, the
       * next-step table and the WhatsApp templates all needed the same new value, and
       * eleven of those twelve lines existed only to be kept identical to another file.
       *
       * The stage list carries its own commentary on what each value means; this is now
       * just the shape Payload wants it in.
       */
      options: LEAD_STATUS.map((s) => ({ label: s.label, value: s.value })),
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      // A salesperson works their queue; they never hand a lead on. Only admins and
      // handlers route work.
      access: { update: ({ req }) => isRole(req, 'admin', 'handler') },
      filterOptions: () => ({ role: { in: ['handler', 'sales'] } }),
      admin: {
        position: 'sidebar',
        description: 'Setting this moves the lead to Assigned, or Reassigned if it changes hands.',
        // Payload renders an empty relationship as the literal "<No Assigned To>" - the
        // field name in angle brackets. An unclaimed lead is the most actionable thing
        // in the list, so it deserves a word a coordinator would use.
        components: { Cell: '/components/leads/Cells#OwnerCell' },
      },
    },
    {
      /**
       * The date this lead is promised for.
       *
       * One field, three meanings, decided by the stage: a callback time, a day to chase
       * a quote, or the day of the move itself. See `DATED_STAGES` for why it is not
       * three fields - the promise is already written in the stage, and a second field
       * asking what the date is for would be asking a question the screen can answer.
       *
       * Its whole point is that the lead goes QUIET until then. Without it a customer who
       * said "ring me Thursday" bled ember on the board all week, so the board was loudest
       * about the one lead where the right thing to do was nothing.
       */
      name: 'dueAt',
      type: 'date',
      index: true,
      // Spelled out rather than left to Payload's auto-label, so the heading reads the
      // same word the dashboard, the filter and the reminder all use for it.
      label: 'Due At',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, h:mm a' },
        // Shown on the dated stages and on every closed deal. On Won and Lost it is the
        // move day: the day the job ran, or the day it would have. Always shown there -
        // never only when already filled - because a lead closed straight from Quoted, or
        // from a callback (whose time is dropped), arrives with no date, and hiding the
        // empty field left it no way ever to get one: counted on the dashboard, absent
        // from the calendar.
        condition: (data) => {
          const s = String(data?.status ?? '');
          return DATED_STAGES.includes(s) || s === 'won' || s === 'lost';
        },
        description:
          'When this is due. A callback time, the day to chase a quote, or the day of the move. The lead stays quiet on the board until then. On a Won or Lost lead it is the day of the move, and puts it on the calendar.',
      },
      validate: (value: unknown, { data }: { data?: { status?: string } }) => {
        const year = checkYear(value);
        if (year !== true) return year;
        // Required for a booked move and nothing else. "Scheduled" with no date is a
        // contradiction - it is the date that makes it scheduled - while a callback with
        // no time is just today's work, which is how the board already treats it.
        if (String(data?.status ?? '') === 'scheduled' && !value) {
          return 'Give the move a date — that is what Scheduled means.';
        }
        return true;
      },
    },
    {
      /**
       * When this lead started waiting for someone. The board sorts on it.
       *
       * The waiting column used to be derived at render time - `createdAt` for a lead
       * nobody has called yet, `updatedAt` for one already in conversation - which is the
       * right rule and could not be sorted on. "Waiting longest" could only ask the
       * database for `updatedAt`, so a lead that had been assigned showed the time since
       * it ARRIVED and sorted on the time it was ASSIGNED: a lead waiting 48 days sat at
       * the bottom of the list, under rows showing 43.
       *
       * One stored field now answers both. It is a pure function of the stage and the
       * moment of the write, so it cannot drift from the number on screen:
       *
       *   still waiting for a first call  ->  when the enquiry arrived
       *   anything further along          ->  when a person last touched it
       *
       * Which is why re-stamping on every save is correct rather than sloppy: for a lead
       * in conversation, "last touched" IS the thing being measured.
       */
      name: 'waitingSince',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, h:mm a' },
        description:
          'When the clock in the dashboard’s Waiting column started. Stamped automatically.',
      },
    },
    {
      name: 'assignedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        // Day-and-time: for a hand-over the hour is the useful part, and the default
        // picker shows the date only.
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, h:mm a' },
        description: 'When this lead was handed to its current owner. Stamped automatically.',
      },
    },
    {
      // Kept for the record and for admin queries, but never shown: a salesperson cannot
      // read the handler's user record, so Payload rendered it as "Untitled - ID: 11".
      // `assignedByName` below carries the same fact as plain text and always resolves.
      name: 'assignedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar', hidden: true },
    },
    {
      name: 'assignedByName',
      label: 'Assigned by',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Who handed this lead to its current owner.',
      },
    },
    {
      name: 'acknowledgedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: DAY_AND_TIME,
        position: 'sidebar',
        description:
          'Set the first time the owner saves a change. Empty means they have not actioned it yet.',
      },
    },
    {
      name: 'sourceDetail',
      label: 'Campaign / form',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.sourceDetail),
        description: 'Which ad or form this came from, as the sender described it.',
      },
    },
    {
      /**
       * The sender's own id for this lead - Facebook's `leadgen_id`, say.
       *
       * Indexed and used to reject duplicates. Zapier retries a failed step, and
       * Facebook re-delivers on its own schedule, so the same lead arrives more than
       * once as a matter of course. Without this, two salespeople end up ringing the
       * same person about the same enquiry.
       */
      name: 'externalId',
      label: 'Sender reference',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => Boolean(data?.externalId),
      },
    },
    {
      /**
       * Everything the sender posted, verbatim.
       *
       * Ad platforms rename their fields without warning and Zapier mappings drift. When
       * a lead arrives with a blank city, this is the difference between guessing and
       * reading what was actually sent. Admin-only: it can contain whatever the form
       * asked for, which is personal data nobody in the sales hierarchy needs.
       */
      name: 'rawPayload',
      label: 'What the sender posted',
      type: 'json',
      access: { read: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin' },
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.rawPayload),
        description: 'Kept for diagnosing a mapping that has gone wrong.',
      },
    },
    { name: 'sourceIp', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'sourcePage', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      /**
       * Payload adds `createdAt` itself, but only when the collection has not declared
       * one (collections/config/sanitize.ts) - and there is no other way to give a
       * generated field a Cell component. Declared here purely so the list can show
       * "3d ago" instead of "September 12th 2026, 2:24 PM": on a phone-width card that
       * string is twenty-eight characters answering a question nobody asks while
       * triaging, and the age is the one they do.
       *
       * `type` and `index` are copied from Payload's own definition deliberately. They
       * are the only two properties here that reach the database - `index` in
       * particular, because createdAt is the default sort for every list view, and
       * dropping it would turn that into a full scan. `admin` is presentation only and
       * cannot affect the schema, so this adds a Cell without a migration.
       */
      name: 'createdAt',
      type: 'date',
      index: true,
      admin: {
        disableBulkEdit: true,
        hidden: true,
        components: { Cell: '/components/leads/Cells#AgeCell' },
      },
    },
  ],
};

/** A relationship field is an id before population and an object after it. */
function idOf(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === 'object') return (value as { id?: string | number }).id ?? null;
  return value as string | number;
}
