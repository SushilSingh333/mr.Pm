import type { GlobalConfig } from 'payload';
import { PAGE_TYPE_TO_SHARD, SERVICES_PAGE_COPY } from '@mpm/shared';
import { hideFromSalesRoles, isContentStaff } from '../access/index.js';
import { triggerBuildForShard } from '../hooks/trigger-build.js';
import { blankNote, copyArea, copyLink, copyList, copyText } from '../fields/copy-fields.js';

/**
 * Editable copy for /services, the hub that lists every service.
 *
 * Built from the owner's Services Page brief (3 Oct 2026). Every field starts blank and
 * shows the live text as its placeholder; the page uses a filled-in field and the
 * built-in text otherwise (packages/shared/src/page-copy.ts). Each service's own card
 * text and page heading are on the service itself (Services → a service → "Heading and
 * cards"), so a service reads the same everywhere it appears.
 */
const S = SERVICES_PAGE_COPY;

export const ServicesPage: GlobalConfig = {
  slug: 'services-page',
  label: 'Services page',
  admin: {
    group: 'Content',
    hidden: hideFromSalesRoles,
    description: `The /services page, top to bottom. ${blankNote} {count} = number of live cities.`,
  },
  access: { read: () => true, update: isContentStaff },
  hooks: { afterChange: [triggerBuildForShard(PAGE_TYPE_TO_SHARD.core)] },
  fields: [
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        copyText('metaTitle', 'Meta title (aim for 60 characters)', S.metaTitle),
        copyArea(
          'metaDescription',
          'Meta description (aim for 140–160 characters)',
          S.metaDescription,
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Hero',
      fields: [
        copyText('h1', 'Main heading (H1)', S.h1),
        copyArea('intro', 'Text under the heading', S.intro),
        copyList('trust', 'Trust strip', S.trust, [{ name: 'text', type: 'text', required: true }]),
      ],
    },
    {
      type: 'collapsible',
      label: 'Service cards',
      admin: { initCollapsed: true },
      fields: [copyText('cardsHeading', 'Heading', S.cardsHeading)],
    },
    {
      type: 'collapsible',
      label: '"Which service do you need?" table',
      admin: { initCollapsed: true },
      fields: [
        copyText('chooserHeading', 'Heading', S.chooserHeading),
        copyList(
          'chooser',
          'Rows',
          S.chooser.map((r) => r.situation),
          [
            { name: 'situation', type: 'text', label: 'If you are…', required: true },
            {
              name: 'need',
              type: 'relationship',
              relationTo: 'services',
              hasMany: true,
              required: true,
              label: 'You need',
              admin: { description: 'Two or more services read as "A + B, one quote".' },
            },
          ],
        ),
        {
          type: 'row',
          fields: [
            copyText('chooserNoteLead', 'Note: start', S.chooserNoteLead, '25%'),
            copyText('chooserNoteLink', 'Note: WhatsApp link text', S.chooserNoteLink, '40%'),
            copyText('chooserNoteTail', 'Note: end', S.chooserNoteTail, '35%'),
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'What every service includes',
      admin: { initCollapsed: true },
      fields: [
        copyText('standardsHeading', 'Heading', S.standardsHeading),
        copyText('standardsIntro', 'Intro', S.standardsIntro),
        copyList(
          'standards',
          'Points',
          S.standards.map((p) => p.lead),
          [
            {
              type: 'row',
              fields: [
                {
                  name: 'lead',
                  type: 'text',
                  label: 'Bold start',
                  required: true,
                  admin: { width: '40%' },
                },
                {
                  name: 'rest',
                  type: 'text',
                  label: 'Rest',
                  required: true,
                  admin: { width: '60%' },
                },
              ],
            },
            copyLink(),
          ],
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Combine services (photo band)',
      admin: { initCollapsed: true },
      fields: [
        copyText('combineHeading', 'Heading', S.combineHeading),
        copyArea('combineText', 'Text', S.combineText),
        copyText('combineButton', 'Button text', S.combineButton),
      ],
    },
    {
      type: 'collapsible',
      label: 'FAQs',
      admin: { initCollapsed: true },
      fields: [
        copyText('faqHeading', 'Heading', S.faqHeading),
        copyList(
          'faqs',
          'Questions',
          S.faqs.map((f) => f.question),
          [
            { name: 'question', type: 'text', required: true },
            { name: 'answer', type: 'textarea', required: true },
            copyLink(),
          ],
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Closing call to action',
      admin: { initCollapsed: true },
      fields: [
        copyText('closingHeading', 'Heading', S.closingHeading),
        copyArea('closingText', 'Text', S.closingText),
      ],
    },
  ],
};
