import type { GlobalConfig } from 'payload';
import { isRole } from '../access/index.js';

/**
 * How many moves the company can run in a day - the number the calendar's colours are
 * measured against.
 *
 * The month view shades each day by how full it is, so sales can offer a date while the
 * customer is still on the phone. "Full" only means something against a limit, and the
 * limit is a house decision that changes with the season and the headcount - so it lives
 * here, editable without a deploy, rather than as a constant in the calendar.
 *
 * One number for now, because one number is what exists: there is no crew or truck
 * register yet. When there is, this is the screen that grows per-day crew and truck
 * slots, leave and blackout dates, and the calendar keeps reading from the same place.
 */
export const ScheduleSettings: GlobalConfig = {
  slug: 'schedule-settings',
  // Not just "Calendar": the sidebar already has a Calendar button that opens the
  // calendar itself, and two entries with one name going to two places is a trap.
  label: 'Calendar settings',
  admin: {
    group: 'Sales',
    hidden: ({ user }) => !['admin', 'handler'].includes((user as { role?: string })?.role ?? ''),
    description: 'How the move calendar judges a day as quiet, filling up or full.',
  },
  access: {
    // Everyone who sees the calendar reads it - a salesperson offering dates needs to
    // know what "full" means as much as the desk does.
    read: ({ req }) => isRole(req, 'admin', 'handler', 'sales'),
    update: ({ req }) => isRole(req, 'admin', 'handler'),
  },
  fields: [
    {
      name: 'movesPerDay',
      type: 'number',
      required: true,
      min: 1,
      max: 200,
      defaultValue: 4,
      label: 'Moves you can run in a day',
      admin: {
        description:
          'Count every crew you can send out on a normal day. The calendar colours a day ' +
          'green below 60% of this, amber from 60% to 85%, and red above 85% - so sales ' +
          'can steer a customer to a quieter date before it is too late to.',
      },
    },
  ],
};
