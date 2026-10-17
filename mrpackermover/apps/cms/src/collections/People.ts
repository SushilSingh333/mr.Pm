import type { CollectionConfig } from 'payload';
import { TEAM_GROUPS } from '@mpm/shared';
import { hideFromSalesRoles, isContentStaff, publicReadExceptSalesRoles } from '../access/index.js';

/**
 * Authors, ops managers, reviewers — real named people behind guides and jobs.
 *
 * The same records drive the public /company/team page. Not everyone belongs there
 * (a guide reviewer is not necessarily leadership), so a person appears only when
 * `showOnTeam` is ticked — opt-in, so adding an author never silently publishes them.
 *
 * On the team page each person is a card in their section (`teamGroup`). Without a
 * photo the card shows their name, job title and description; upload one and the card
 * becomes a photo card - nothing else to switch on. The person whose job title starts
 * with "Founder" also signs the home page intro and the about page.
 */
export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'role', 'teamGroup', 'showOnTeam'],
  },
  access: {
    read: publicReadExceptSalesRoles,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'text',
      required: true,
      label: 'Job title',
      admin: {
        description:
          'Shown on their card, e.g. "Sales Head". Write "Founder" for the founder: that name then signs the home page and the about page.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Two or three lines on what they do for a customer. Shown on their card.',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional. Leave empty and the card shows their name, job title and description; upload a photo (a clear head-and-shoulders shot, portrait) and it becomes a photo card.',
      },
    },
    {
      name: 'credentials',
      type: 'text',
      admin: { description: 'Credentials shown on guide bylines.' },
    },
    {
      name: 'linkedin',
      type: 'text',
      admin: { description: 'Optional LinkedIn profile URL, linked from the team card.' },
    },
    {
      type: 'collapsible',
      label: 'Team page',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'showOnTeam',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show on the public team page',
          admin: {
            description:
              'Off by default. Tick to put this person on /company/team. A photo is optional.',
          },
        },
        {
          name: 'teamGroup',
          type: 'select',
          label: 'Section',
          defaultValue: 'leadership',
          options: TEAM_GROUPS.map((g) => ({ label: g.label, value: g.key })),
          admin: {
            description: 'Which part of the team page their card sits in.',
            condition: (_, sibling) => Boolean(sibling?.showOnTeam),
          },
        },
        {
          name: 'teamOrder',
          type: 'number',
          admin: {
            description:
              'Lower numbers appear first in their section. Ties fall back to alphabetical by name.',
            condition: (_, sibling) => Boolean(sibling?.showOnTeam),
          },
        },
      ],
    },
  ],
};
