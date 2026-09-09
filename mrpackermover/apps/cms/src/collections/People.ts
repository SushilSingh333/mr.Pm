import type { CollectionConfig } from 'payload';
import { hideFromSalesRoles, isContentStaff, publicReadExceptSalesRoles } from '../access/index.js';

/**
 * Authors, ops managers, reviewers — real named people behind guides and jobs.
 *
 * The same records drive the public /company/team page. Not everyone belongs there
 * (a guide reviewer is not necessarily leadership), so a person appears only when
 * `showOnTeam` is ticked — opt-in, so adding an author never silently publishes them.
 */
export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'role'],
  },
  access: {
    read: publicReadExceptSalesRoles,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'bio', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
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
              'Off by default. Tick to publish this person on /company/team, needs a role, and a photo looks best.',
          },
        },
        {
          name: 'teamOrder',
          type: 'number',
          admin: {
            description: 'Lower numbers appear first. Ties fall back to alphabetical by name.',
            condition: (_, sibling) => Boolean(sibling?.showOnTeam),
          },
        },
      ],
    },
  ],
};
