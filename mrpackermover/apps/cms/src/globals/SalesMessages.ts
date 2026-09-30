import type { GlobalConfig } from 'payload';
import { isRole } from '../access/index.js';
import { DEFAULT_TEMPLATES, MERGE_FIELDS } from '../lib/message-templates.js';

/**
 * The WhatsApp openers, editable without a deploy.
 *
 * A global of its own rather than a tab on Integrations, for one reason that decides it:
 * Integrations is admin-only in both directions, and the people who need to READ these
 * are salespeople. A template a salesperson cannot read is a template their WhatsApp
 * button cannot fill in.
 *
 * So: the sales hierarchy reads it, and the desk owns it - an admin or a handler edits
 * the wording, a salesperson does not. Wording is a house decision, and forty people
 * each rewriting the opener is the thing a shared template exists to prevent.
 */

const SIGNATURE = MERGE_FIELDS.map((f) => `${f.token} — ${f.meaning}`).join('\n');

const HELP =
  'Sent when the salesperson taps WhatsApp on a lead. It lands in their WhatsApp input ' +
  'box ready to edit, and nothing is sent until they press send.\n\n' +
  'Use *asterisks* around a word to make it bold in WhatsApp.\n\n' +
  'Placeholders you can use:\n' +
  SIGNATURE +
  '\n\nA line whose placeholder has no value is left out completely — so a lead with no ' +
  'drop city simply does not get that sentence, rather than getting a gap. Keep anything ' +
  'you cannot afford to lose on its own line.';

export const SalesMessages: GlobalConfig = {
  slug: 'sales-messages',
  label: 'WhatsApp messages',
  admin: {
    group: 'Sales',
    // A salesperson reads these through the WhatsApp button, never through this screen;
    // showing them a settings page they cannot save is worse than not showing it.
    hidden: ({ user }) => !['admin', 'handler'].includes((user as { role?: string })?.role ?? ''),
    description:
      'What the WhatsApp button writes for your team. One message for a first contact, ' +
      'one for chasing a quote, one for a booked move.',
  },
  access: {
    // Read by everyone who can work a lead — the button needs it.
    read: ({ req }) => isRole(req, 'admin', 'handler', 'sales'),
    // Edited by whoever runs the desk.
    update: ({ req }) => isRole(req, 'admin', 'handler'),
  },
  fields: [
    {
      /**
       * The sign-off, here rather than on the org profile.
       *
       * It is what the customer is told to visit, which makes it part of the message
       * rather than part of the company record - and the person editing the wording is
       * the person who should be able to change it, without needing rights to the legal
       * identity screen.
       */
      name: 'siteUrl',
      type: 'text',
      required: true,
      defaultValue: 'mrmoverpacker.com',
      label: 'Website shown in the sign-off',
      admin: {
        description:
          'Printed wherever a message uses {site}. No https:// — customers read it, they do not type it.',
      },
    },
    {
      name: 'firstContact',
      type: 'textarea',
      required: true,
      defaultValue: DEFAULT_TEMPLATES.firstContact,
      label: 'First contact',
      admin: {
        rows: 10,
        description:
          'The opener for a lead nobody has spoken to yet. ' +
          HELP.split('\n\n').slice(1).join('\n\n'),
      },
    },
    {
      name: 'quoteFollowUp',
      type: 'textarea',
      required: true,
      defaultValue: DEFAULT_TEMPLATES.quoteFollowUp,
      label: 'Chasing a quote',
      admin: {
        rows: 10,
        description:
          'Used once the lead has been quoted, so it does not re-introduce somebody the ' +
          'customer has already spoken to.',
      },
    },
    {
      name: 'booked',
      type: 'textarea',
      required: true,
      defaultValue: DEFAULT_TEMPLATES.booked,
      // Named by the stages it is sent for, the way every other screen names them. The
      // field keeps its name, so saved wording is untouched.
      label: 'Scheduled or Won',
      admin: {
        rows: 10,
        description: 'Sent for a lead that is Scheduled or Won — a confirmation, not a pitch.',
      },
    },
  ],
};
