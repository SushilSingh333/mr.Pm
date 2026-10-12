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
            width: '25%',
            description: 'Leave blank for a comparison table ("| | Train | Carrier |").',
          },
        },
        {
          name: 'h2',
          type: 'text',
          label: 'Column 2 heading',
          required: true,
          admin: { width: '25%' },
        },
        {
          name: 'h3',
          type: 'text',
          label: 'Column 3 heading',
          admin: { width: '25%', description: 'Blank for a two-column table.' },
        },
        {
          name: 'h4',
          type: 'text',
          label: 'Column 4 heading',
          admin: { width: '25%', description: 'Blank for two or three columns.' },
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
            { name: 'c1', type: 'text', required: true, admin: { width: '25%' } },
            { name: 'c2', type: 'textarea', required: true, admin: { width: '25%', rows: 2 } },
            { name: 'c3', type: 'textarea', admin: { width: '25%', rows: 2 } },
            { name: 'c4', type: 'textarea', admin: { width: '25%', rows: 2 } },
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

/**
 * Locations → "Page content": a city or locality page below the hero, in the shape of
 * the owner's city briefs (packages/shared/src/geo-pages). Same blocks and the same
 * rule as the service pages - blank is the brief, a list with rows replaces it whole.
 * The hero keeps its banner and price check; only its words come from here.
 */
export const geoPageField: Field = {
  name: 'body',
  type: 'group',
  label: 'Page content',
  admin: {
    description:
      'Everything on the city or locality page below the heading. Leave a field blank, or a list empty, to show the text from the page brief.',
    condition: (data) => data?.type === 'city' || data?.type === 'locality',
  },
  fields: [
    {
      name: 'subhead',
      type: 'textarea',
      label: 'Line under the heading',
      admin: { rows: 3 },
    },
    {
      name: 'trust',
      type: 'array',
      label: 'Trust points under the price check',
      maxRows: 6,
      labels: { singular: 'Point', plural: 'Points' },
      fields: [{ name: 'item', type: 'text', required: true }],
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
          admin: { description: 'Blank for opening paragraphs with no heading.' },
        },
        {
          name: 'blocks',
          type: 'blocks',
          label: 'Content',
          minRows: 1,
          blocks: [textBlock, stepsBlock, listBlock, tableBlock],
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
      name: 'reviewsHeading',
      type: 'text',
      label: 'Reviews heading',
      admin: { description: 'Blank shows "What customers in <place> say".' },
    },
    {
      name: 'reviews',
      type: 'array',
      label: 'Customer reviews',
      labels: { singular: 'Review', plural: 'Reviews' },
      admin: {
        initCollapsed: true,
        description:
          'Real reviews only, shown with the customer’s permission. The page shows a reviews section only when at least one review is here; with none, there is no section at all.',
        components: { RowLabel: '/components/fields/RowLabels#ReviewRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Customer name',
              required: true,
              admin: { width: '50%', description: 'As they agreed to be shown, e.g. "Priya S."' },
            },
            {
              name: 'move',
              type: 'text',
              label: 'Their move',
              admin: { width: '50%', description: 'e.g. "2 BHK, Rohini to Dwarka"' },
            },
          ],
        },
        { name: 'text', type: 'textarea', label: 'Review', required: true, admin: { rows: 3 } },
        {
          type: 'row',
          fields: [
            {
              name: 'rating',
              type: 'select',
              label: 'Stars',
              options: ['5', '4', '3', '2', '1'].map((v) => ({ label: `${v} stars`, value: v })),
              admin: { width: '33%' },
            },
            {
              name: 'date',
              type: 'text',
              label: 'When',
              admin: { width: '33%', description: 'e.g. "March 2026"' },
            },
            {
              name: 'source',
              type: 'select',
              label: 'First posted on',
              options: ['Google', 'Justdial', 'Facebook', 'Direct'].map((v) => ({
                label: v === 'Direct' ? 'Sent to us directly' : v,
                value: v,
              })),
              admin: { width: '34%' },
            },
          ],
        },
      ],
    },
    {
      name: 'servicesHeading',
      type: 'text',
      label: 'Services heading',
      admin: { description: 'The service links under it are built from the live pages.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'nearbyHeading', type: 'text', label: 'Nearby heading', admin: { width: '50%' } },
        { name: 'nearbyIntro', type: 'text', label: 'Nearby line', admin: { width: '50%' } },
      ],
    },
    {
      name: 'routes',
      type: 'array',
      label: 'Popular routes (plain text)',
      labels: { singular: 'Route', plural: 'Routes' },
      admin: {
        description: 'Shown as text, e.g. "Delhi to Bangalore", until each route has a page.',
      },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      type: 'row',
      fields: [
        { name: 'ctaHeading', type: 'text', label: 'Closing heading', admin: { width: '50%' } },
        { name: 'ctaText', type: 'text', label: 'Closing line', admin: { width: '50%' } },
      ],
    },
  ],
};
