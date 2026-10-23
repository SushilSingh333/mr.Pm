import type { GlobalConfig } from 'payload';
import { DAY_AND_TIME } from '../lib/date-display.js';
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
 * CONNECTIONS. One secret for everything meant one Zap, or every sender sharing a key:
 * no way to tell which one sent a lead, and no way to cut off one sender without
 * breaking the rest. Each connection now has its own name, secret, on/off switch and
 * lead count. They all post to the same address; the secret says which one is calling.
 *
 * Admin-only in both directions. A handler or salesperson has no reason to read a
 * credential that can write to the lead pipeline, and `read` on a global is what the
 * REST API checks too, not just the screen.
 */

/** 32 bytes of CSPRNG, hex-encoded: long enough that guessing is not a strategy. */
const mint = (): string => randomBytes(32).toString('hex');

/** Where a connection's leads are filed. "auto" spots Facebook / Instagram payloads. */
export const CONNECTION_SOURCES = [
  { label: 'Detect automatically', value: 'auto' },
  { label: 'Facebook ad', value: 'facebook-ad' },
  { label: 'Webhook (any other tool)', value: 'webhook' },
];

export const Integrations: GlobalConfig = {
  slug: 'integrations',
  label: 'Integrations',
  admin: {
    group: 'Settings',
    // Only admins manage integrations; everyone else should not see the nav entry.
    hidden: ({ user }) => (user as { role?: string } | undefined)?.role !== 'admin',
    description:
      'Receive leads from Facebook Lead Ads, Google Ads or anywhere else, through Zapier or any tool that can send a webhook. Add one connection per tool.',
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [
      ({ data }) => {
        let rows = (Array.isArray(data.leadSources) ? data.leadSources : []) as Record<
          string,
          unknown
        >[];
        // The first save after connections arrived: the single secret that existed
        // becomes the first connection, UNCHANGED, so a Zap already using it carries on
        // working. Once only - deleting every connection later is a choice, not a reset.
        if (!data.leadSourcesSeeded) {
          if (!rows.length) {
            rows = [
              {
                name: 'Main webhook',
                source: 'auto',
                enabled: true,
                secret: data.leadWebhookSecret || mint(),
              },
            ];
          }
          data.leadSourcesSeeded = true;
        }
        // A blank secret would make the connection reject everything with no
        // explanation, so one is minted whenever it is empty - on a new connection, or
        // after someone clears the box to rotate it.
        data.leadSources = rows.map((r) => (r.secret ? r : { ...r, secret: mint() }));
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
      label: 'Accept leads from connections',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'The master switch. Off stops every connection at once without changing any secret. Anything sent while it is off is rejected, not queued.',
      },
    },
    {
      name: 'leadSources',
      label: 'Connections',
      labels: { singular: 'Connection', plural: 'Connections' },
      type: 'array',
      admin: {
        initCollapsed: false,
        description:
          'One per tool or Zap - e.g. "Facebook - Delhi form", "Google Ads", "Partner site". Each gets its own secret, so you can see what each one sends and switch one off without touching the others.',
        components: { RowLabel: '/components/settings/ConnectionRow#ConnectionRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
                description: 'Shown on every lead it sends, under "Campaign / form".',
              },
            },
            {
              name: 'source',
              label: 'File leads as',
              type: 'select',
              defaultValue: 'auto',
              options: CONNECTION_SOURCES,
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'enabled',
          label: 'Accept leads from this connection',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'secret',
          type: 'text',
          admin: {
            description:
              'Send this as the header x-webhook-secret. Treat it like a password: anyone holding it can create leads. Clear the box and save to issue a new one, which immediately stops the old one working.',
          },
        },
        {
          name: 'connectionInfo',
          type: 'ui',
          admin: {
            components: { Field: '/components/settings/ConnectionRow#ConnectionInfo' },
          },
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
          'Why the most recent request was turned away. Usually a wrong secret, a connection that is switched off, or a payload with no phone number in it.',
      },
    },
    /*
     * The single-secret fields from before connections. Kept, hidden, so nothing is
     * dropped: the secret seeds the first connection, and the old count is shown as
     * "before connections" history. Written by nothing any more.
     */
    {
      name: 'leadWebhookSecret',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'leadWebhookLastAt',
      type: 'date',
      admin: { hidden: true, date: DAY_AND_TIME },
    },
    {
      name: 'leadWebhookCount',
      type: 'number',
      defaultValue: 0,
      admin: { hidden: true },
    },
    {
      name: 'leadSourcesSeeded',
      type: 'checkbox',
      admin: { hidden: true },
    },
  ],
};
