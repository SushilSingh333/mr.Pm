import type { CollectionConfig } from 'payload';
import { leadsRead, leadsUpdate, leadsDelete, isRole } from '../access/index.js';

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
    defaultColumns: ['name', 'phone', 'service', 'status', 'assignedTo', 'createdAt'],
    description:
      'Every quote form and price check lands here. Newest first. Filter by date, status, owner or source.',
  },
  versions: { drafts: false, maxPerDoc: 50 },
  access: {
    // The public form must be able to create a lead; everything else is role-scoped.
    create: () => true,
    read: leadsRead,
    update: leadsUpdate,
    delete: leadsDelete,
  },
  hooks: {
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
        const ROUTING_STAGES = ['new', 'assigned', 'reassigned'];
        if (
          operation === 'update' &&
          isRole(req, 'sales') &&
          typeof data.status === 'string' &&
          ROUTING_STAGES.includes(data.status) &&
          data.status !== originalDoc?.status
        ) {
          throw new Error(
            'Only a handler can assign or reassign a lead. Move it to Contacted, Call not picked, Quoted, Won, Lost or Invalid lead.',
          );
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
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
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
    { name: 'moveDate', type: 'date' },
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
      options: [
        { label: 'Quote form', value: 'quote-form' },
        { label: 'Price check', value: 'price-check' },
        { label: 'Facebook ad', value: 'facebook-ad' },
        { label: 'Webhook', value: 'webhook' },
      ],
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
      options: [
        { label: 'New', value: 'new' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Reassigned', value: 'reassigned' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Call not picked', value: 'call-not-picked' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        // Not a lost deal - a lead that was never real: a wrong number, a test
        // submission, somebody's keyboard. Kept as its own stage rather than folded into
        // Lost so the win rate is not quietly dragged down by junk, and so a coordinator
        // can see how much of it is arriving.
        { label: 'Invalid lead', value: 'invalid' },
      ],
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
