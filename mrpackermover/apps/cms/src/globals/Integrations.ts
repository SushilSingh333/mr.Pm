import type { GlobalConfig } from 'payload';
import { isAdmin } from '../access/index.js';
import { randomBytes } from 'node:crypto';

/**
 * Settings for leads that arrive from somewhere other than the website.
 *
 * The site's own forms post to /api/quote, which is open by necessity - a visitor has
 * no credentials. An inbound webhook is different: it is a URL that creates a lead in
 * the database, and an open one would be filled with junk within days of being
 * discovered. So it carries a shared secret, kept here rather than in an env file so
 * the person wiring up Zapier can read it, rotate it, and see whether anything has
 * actually arrived - without a deploy or an SSH session.
 *
 * Admin-only in both directions. A handler or salesperson has no reason to read a
 * credential that can write to the lead pipeline, and `read` on a global is what the
 * REST API checks too, not just the screen.
 */
export const Integrations: GlobalConfig = {
  slug: 'integrations',
  label: 'Integrations',
  admin: {
    group: 'Settings',
    // Only admins manage integrations; everyone else should not see the nav entry.
    hidden: ({ user }) => (user as { role?: string } | undefined)?.role !== 'admin',
    description:
      'Receive leads from Facebook Lead Ads, Google Ads or anywhere else, through Zapier or any tool that can send a webhook.',
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // A blank secret would leave the endpoint rejecting everything with no
        // explanation, so one is minted the first time this screen is saved. 32 bytes
        // of CSPRNG, hex-encoded: long enough that guessing is not a strategy.
        if (!data.leadWebhookSecret) data.leadWebhookSecret = randomBytes(32).toString('hex');
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'leadWebhookSetup',
      type: 'ui',
      admin: { components: { Field: '/components/settings/WebhookSetup#WebhookSetup' } },
    },
    {
      name: 'leadWebhookEnabled',
      label: 'Accept leads from the webhook',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Turn off to stop accepting inbound leads without changing the secret. Anything sent while this is off is rejected, not queued.',
      },
    },
    {
      name: 'leadWebhookSecret',
      label: 'Webhook secret',
      type: 'text',
      admin: {
        description:
          'Send this as the header x-webhook-secret. Treat it like a password: anyone holding it can create leads. Clear the box and save to issue a new one, which immediately stops the old one working.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'leadWebhookLastAt',
          label: 'Last lead received',
          type: 'date',
          admin: {
            readOnly: true,
            width: '50%',
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Blank means nothing has ever reached this endpoint.',
          },
        },
        {
          name: 'leadWebhookCount',
          label: 'Leads received',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      name: 'leadWebhookLastError',
      label: 'Last rejection',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.leadWebhookLastError),
        description:
          'Why the most recent request was turned away. Usually a wrong secret or a payload with no phone number in it.',
      },
    },
  ],
};
