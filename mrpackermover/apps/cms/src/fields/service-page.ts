import type { Block, Field } from 'payload';
import { SERVICE_PAGE_LABELS as L } from '@mpm/shared';

/**
 * Services → "Service page": everything on /services/<slug> below the heading, in the
 * shape of the owner's page briefs (packages/shared/src/service-pages).
 *
 * Blank is the brief. A text field left empty, or a list with no rows, shows the brief's
 * copy - so nothing here has to be filled in for the page to be complete, and an editor
 * changes one FAQ without retyping the page. `import-service-pages` copies the brief in so
 * editors start from the real text rather than an empty form.
 *
 * A list is replaced as a whole: once a list has rows, those rows ARE the list. That is
 * what lets an editor delete an FAQ - a list merged row by row with the brief would put it
 * back on the next build.
 */

const TEXT_HELP = 'A blank line starts a new paragraph. [words](/path) makes a link.';

const textBlock: Block = {
  slug: 'svcText',
  labels: { singular: 'Paragraphs', plural: 'Paragraphs' },
  fields: [
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: { rows: 5, description: TEXT_HELP },
    },
  ],
};

const stepsBlock: Block = {
  slug: 'svcSteps',
  labels: { singular: 'Numbered steps', plural: 'Numbered steps' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Step', plural: 'Steps' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { description: 'The bold start of the step, e.g. "Pickup".' },
        },
        { name: 'body', type: 'textarea', admin: { rows: 2, description: TEXT_HELP } },
      ],
    },
  ],
};

const listBlock: Block = {
  slug: 'svcList',
  labels: { singular: 'Bullet list', plural: 'Bullet lists' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Point', plural: 'Points' },
      fields: [{ name: 'text', type: 'textarea', required: true, admin: { rows: 2 } }],
    },
  ],
};

const tableBlock: Block = {
  slug: 'svcTable',
  labels: { singular: 'Table', plural: 'Tables' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'h1',
          type: 'text',
          label: 'Column 1 heading',
          admin: {
            width: '33%',
            description: 'Leave blank for a comparison table ("| | Train | Carrier |").',
          },
        },
        {
          name: 'h2',
          type: 'text',
          label: 'Column 2 heading',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'h3',
          type: 'text',
          label: 'Column 3 heading',
          admin: { width: '33%', description: 'Blank for a two-column table.' },
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Row', plural: 'Rows' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'c1', type: 'text', required: true, admin: { width: '33%' } },
            { name: 'c2', type: 'textarea', required: true, admin: { width: '33%', rows: 2 } },
            { name: 'c3', type: 'textarea', admin: { width: '33%', rows: 2 } },
          ],
        },
      ],
    },
  ],
};

const scopeBlock: Block = {
  slug: 'svcScope',
  labels: { singular: "What's included lists", plural: "What's included lists" },
  fields: [
    {
      name: 'note',
      type: 'text',
      admin: {
        readOnly: true,
        placeholder: 'Shows "What\'s included" and "What costs extra" from the fields above.',
      },
    },
  ],
};

export const servicePageField: Field = {
  // `body`, not `page`: the /services index is the `services-page` global, whose tables
  // are services_page_*. A group called `page` here made services_page_trust and
  // services_page_faqs again - the same table names - and broke reads of both.
  name: 'body',
  type: 'group',
  label: 'Service page',
  admin: {
    description:
      'Everything on the service page below the heading. Leave a field blank, or a list empty, to show the text from the page brief.',
  },
  fields: [
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Photo',
      admin: {
        description:
          'Shown in the strip at the top and under the heading. Wide (landscape) photos work best. Leave empty to keep the built-in photo for this service.',
      },
    },
    {
      name: 'chip',
      type: 'text',
      label: 'Chip on the photo strip',
      admin: {
        placeholder: L.chip,
        description: 'On a phone only the part before " · " shows.',
      },
    },
    {
      name: 'subhead',
      type: 'textarea',
      label: 'Line under the heading',
      admin: { rows: 3 },
    },
    {
      name: 'trust',
      type: 'array',
      label: 'Trust points under the form',
      maxRows: 6,
      labels: { singular: 'Point', plural: 'Points' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'cardTitle',
      type: 'text',
      label: 'Form card title',
      admin: { placeholder: L.cardTitle },
    },
    {
      name: 'quoteNote',
      type: 'textarea',
      label: 'Line under the form',
      admin: { rows: 2 },
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Sections',
      labels: { singular: 'Section', plural: 'Sections' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '/components/fields/RowLabels#SectionRowLabel' },
      },
      fields: [
        {
          name: 'heading',
          type: 'text',
          label: 'Heading (H2)',
          admin: { description: 'Blank for the opening paragraphs straight under the hero.' },
        },
        {
          name: 'blocks',
          type: 'blocks',
          label: 'Content',
          minRows: 1,
          blocks: [textBlock, stepsBlock, listBlock, tableBlock, scopeBlock],
        },
      ],
    },
    { name: 'faqHeading', type: 'text', label: 'FAQ heading' },
    {
      name: 'faqs',
      type: 'array',
      label: 'FAQs',
      labels: { singular: 'Question', plural: 'Questions' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '/components/fields/RowLabels#FaqRowLabel' },
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          admin: { rows: 3, description: TEXT_HELP },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'citiesHeading',
          type: 'text',
          label: 'Cities heading',
          admin: { width: '50%', description: '{count} = the number of live cities.' },
        },
        {
          name: 'citiesIntro',
          type: 'text',
          label: 'Cities line',
          admin: { width: '50%', description: '{count} = the number of live cities.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'ctaHeading', type: 'text', label: 'Closing heading', admin: { width: '50%' } },
        { name: 'ctaText', type: 'text', label: 'Closing line', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaCheck',
          type: 'text',
          label: 'Button: price',
          admin: { width: '33%', placeholder: L.ctaCheck },
        },
        {
          name: 'ctaCall',
          type: 'text',
          label: 'Button: call',
          admin: { width: '33%', placeholder: L.ctaCall },
        },
        {
          name: 'ctaWhatsapp',
          type: 'text',
          label: 'Button: WhatsApp',
          admin: { width: '33%', placeholder: L.ctaWhatsapp },
        },
      ],
    },
    {
      name: 'related',
      type: 'array',
      label: 'Related links (closing section)',
      labels: { singular: 'Link', plural: 'Links' },
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
            {
              name: 'href',
              type: 'text',
              required: true,
              admin: { width: '50%', placeholder: '/services/home-shifting' },
            },
          ],
        },
      ],
    },
  ],
};
