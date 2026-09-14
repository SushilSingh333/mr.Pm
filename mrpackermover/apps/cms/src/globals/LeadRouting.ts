import type { GlobalConfig } from 'payload';
import { isRole } from '../access/index.js';

/**
 * Who gets the next lead.
 *
 * Off by default, and deliberately so: until someone turns this on, every lead lands
 * unassigned and a handler decides where it goes. That is the right default because
 * routing is a judgement — a big corporate move and a two-wheeler transfer do not
 * belong with the same person, and nobody should discover that their pipeline is being
 * shared out by a setting they never chose.
 *
 * Once it is on, a new lead with no owner is handed to the next person in `members`,
 * in order, wrapping at the end. `lastAssignedTo` is the cursor rather than a count, so
 * adding or removing somebody mid-rotation does not skip anyone or start again from the
 * top: the next lead simply goes to whoever follows the last person served.
 *
 * Admin and handler, both directions. `read` matters as much as `update` here - this is
 * the REST rule as well as the screen, and a salesperson has no business reading, let
 * alone editing, how work is shared out.
 */
export const LeadRouting: GlobalConfig = {
  slug: 'lead-routing',
  label: 'Lead routing',
  admin: {
    group: 'Sales',
    hidden: ({ user }) => {
      const role = (user as { role?: string } | undefined)?.role;
      return role !== 'admin' && role !== 'handler';
    },
    description:
      'Share new leads out automatically instead of assigning each one by hand. Off unless you turn it on.',
  },
  access: {
    read: ({ req }) => isRole(req, 'admin', 'handler'),
    update: ({ req }) => isRole(req, 'admin', 'handler'),
  },
  fields: [
    {
      name: 'autoAssign',
      label: 'Share new leads automatically',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'When on, each new lead goes to the next person on the list. A lead that already has an owner is left alone.',
      },
    },
    {
      name: 'members',
      label: 'In the rotation',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      // The same pool the `assignedTo` field on a lead offers, so a person can never be
      // routed work they could not have been given by hand.
      filterOptions: () => ({ role: { in: ['handler', 'sales'] } }),
      admin: {
        description:
          'Leads go to these people in turn, then back to the first. The dashboard card is the easier way to change this.',
      },
    },
    {
      name: 'lastAssignedTo',
      label: 'Last lead went to',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'The rotation continues from here. Set automatically.',
      },
    },
    {
      name: 'assignedCount',
      label: 'Leads shared out',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, description: 'How many leads this has routed so far.' },
    },
  ],
};
