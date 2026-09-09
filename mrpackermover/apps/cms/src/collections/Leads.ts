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
            'Only a handler can assign or reassign a lead. Move it to Contacted, Call not picked, Quoted, Won or Lost.',
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
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'phone', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      name: 'email',
      type: 'email',
      admin: { description: 'Given on the form when the customer chose to.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'service', type: 'text', admin: { width: '50%' } },
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
      name: 'assignedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar', description: 'Who handed it over.' },
    },
    {
      name: 'assignedByName',
      label: 'Assigned by',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Kept as plain text so it shows without read access on the staff list.',
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
    { name: 'sourceIp', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'sourcePage', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
  ],
};

/** A relationship field is an id before population and an object after it. */
function idOf(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === 'object') return (value as { id?: string | number }).id ?? null;
  return value as string | number;
}
