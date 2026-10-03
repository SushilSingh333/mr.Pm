import type { Field, GlobalConfig } from 'payload';
import { HOME_COPY, PAGE_TYPE_TO_SHARD } from '@mpm/shared';
import { hideFromSalesRoles, isContentStaff } from '../access/index.js';
import { triggerBuildForShard } from '../hooks/trigger-build.js';
import { blankNote, copyArea, copyLink, copyList, copyText } from '../fields/copy-fields.js';

/**
 * Editable copy for the home page. The site reads this via the manifest.
 *
 * "Home page sections" holds the text of the page as built from the owner's brief
 * (3 Oct 2026). Every field starts blank and shows the live text as its placeholder;
 * the page uses a filled-in field and the built-in text otherwise
 * (packages/shared/src/page-copy.ts). `{count}` becomes the number of live cities.
 *
 * The fields of the previous design (taglines, section headings, trust pillars) are
 * hidden rather than deleted: the page no longer reads them, and removing them would
 * drop their columns - and whatever production had saved in them - in a migration.
 */
const hidden = { condition: (): boolean => false };
const H = HOME_COPY;

const pageSections: Field = {
  name: 'page',
  type: 'group',
  label: 'Home page sections',
  admin: {
    description: `The page from top to bottom. ${blankNote} {count} = number of live cities.`,
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Hero',
      fields: [
        copyText('tagline', 'Tagline (above the heading)', H.tagline),
        copyText('h1', 'Main heading (H1)', H.h1),
        copyArea('subhead', 'Text under the heading', H.subhead),
        copyList('trust', 'Trust strip (under the form)', H.trust, [
          { name: 'text', type: 'text', required: true },
        ]),
      ],
    },
    {
      type: 'collapsible',
      label: 'Three promises',
      admin: { initCollapsed: true },
      fields: [
        copyText('promisesHeading', 'Heading', H.promisesHeading),
        copyList(
          'promises',
          'Cards',
          H.promises.map((p) => p.title),
          [
            { name: 'title', type: 'text', required: true },
            { name: 'text', type: 'textarea', required: true },
            copyLink(),
          ],
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'How it works (steps)',
      admin: { initCollapsed: true },
      fields: [
        copyText('stepsHeading', 'Heading', H.stepsHeading),
        copyList(
          'steps',
          'Steps',
          H.steps.map((s) => s.title),
          [
            { name: 'title', type: 'text', required: true },
            { name: 'text', type: 'textarea', required: true },
          ],
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Comparison table',
      admin: { initCollapsed: true },
      fields: [
        copyText('compareHeading', 'Heading', H.compareHeading),
        copyList(
          'compare',
          'Rows',
          H.compare.map((r) => r.label),
          [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '20%' } },
                {
                  name: 'them',
                  type: 'text',
                  label: 'Typical local mover',
                  required: true,
                  admin: { width: '40%' },
                },
                {
                  name: 'us',
                  type: 'text',
                  label: 'MrMoverPacker',
                  required: true,
                  admin: { width: '40%' },
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Overnight moves (photo band)',
      admin: { initCollapsed: true },
      fields: [
        copyText('nightHeading', 'Heading', H.nightHeading),
        copyArea('nightText', 'Text', H.nightText),
      ],
    },
    {
      type: 'collapsible',
      label: 'How we pack (table)',
      admin: { initCollapsed: true },
      fields: [
        copyText('packingHeading', 'Heading', H.packingHeading),
        copyList(
          'packing',
          'Rows',
          H.packing.map((r) => r.item),
          [
            {
              type: 'row',
              fields: [
                { name: 'item', type: 'text', required: true, admin: { width: '35%' } },
                {
                  name: 'how',
                  type: 'text',
                  label: 'How we pack it',
                  required: true,
                  admin: { width: '65%' },
                },
              ],
            },
          ],
        ),
      ],
    },
    {
      type: 'collapsible',
      label: 'Charges',
      admin: { initCollapsed: true },
      fields: [
        copyText('chargesHeading', 'Heading', H.chargesHeading),
        copyArea('chargesIntro', 'Intro', H.chargesIntro),
        copyList(
          'chargesFactors',
          'What decides the price',
          H.chargesFactors.map((f) => f.title),
          [
            {
              type: 'row',
              fields: [
                { name: 'title', type: 'text', required: true, admin: { width: '35%' } },
                { name: 'text', type: 'text', required: true, admin: { width: '65%' } },
              ],
            },
          ],
        ),
        copyArea('chargesIncluded', '"Always included" text', H.chargesIncluded),
        copyText('chargesPromise', 'Closing line', H.chargesPromise),
      ],
    },
    {
      type: 'collapsible',
      label: 'Services and cities',
      admin: { initCollapsed: true },
      fields: [
        copyText('servicesHeading', 'Services heading', H.servicesHeading),
        copyText('citiesHeading', 'Cities heading', H.citiesHeading),
        copyText('citiesIntro', 'Cities intro', H.citiesIntro),
      ],
    },
    {
      type: 'collapsible',
      label: 'FAQs',
      admin: { initCollapsed: true },
      fields: [
        copyText('faqHeading', 'Heading', H.faqHeading),
        copyList(
          'faqs',
          'Questions',
          H.faqs.map((f) => f.question),
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
        copyText('closingHeading', 'Heading', H.closingHeading),
        copyArea('closingText', 'Text', H.closingText),
      ],
    },
  ],
};

export const HomeContent: GlobalConfig = {
  slug: 'home-content',
  label: 'Home page content',
  admin: { group: 'Content', hidden: hideFromSalesRoles },
  access: { read: () => true, update: isContentStaff },
  hooks: { afterChange: [triggerBuildForShard(PAGE_TYPE_TO_SHARD.home)] },
  fields: [
    {
      type: 'collapsible',
      label: 'SEO  (optional, leave blank to use the built-in copy)',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta title',
          maxLength: 70,
          admin: {
            description:
              'The blue line in Google for the home page. Aim for 60 characters. Blank = the built-in title.',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta description',
          maxLength: 180,
          admin: {
            description:
              'The grey text under the title in Google. Aim for 140–160 characters. Blank = the built-in description.',
          },
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Hero photo',
      admin: {
        description:
          'Background photo for the home page hero banner. Uploaded to Cloudinary and served through the hero transform. Leave empty to use the built-in /images/hero/home.jpg file.',
      },
    },
    pageSections,
    // ── The previous design's fields: hidden, kept (see the note at the top). ──
    {
      type: 'row',
      admin: hidden,
      fields: [
        { name: 'taglineLine1', type: 'text', defaultValue: 'Shifting Aapki,' },
        { name: 'taglineLine2', type: 'text', defaultValue: 'Zimmedari Hamari.' },
        { name: 'heroSubtext', type: 'textarea' },
        { name: 'servicesHeading', type: 'text', defaultValue: 'What we move' },
        { name: 'servicesIntro', type: 'text' },
        {
          name: 'trustHeading',
          type: 'text',
          defaultValue: 'House Shifting you can actually verify',
        },
        { name: 'trustIntro', type: 'text' },
        { name: 'statsHeading', type: 'text', defaultValue: 'By the numbers' },
        { name: 'statsIntro', type: 'text' },
        { name: 'citiesHeading', type: 'text', defaultValue: 'Cities we serve' },
        { name: 'citiesIntro', type: 'text' },
        { name: 'faqHeading', type: 'text', defaultValue: 'Questions people ask' },
      ],
    },
    {
      name: 'pillars',
      type: 'array',
      label: 'Trust pillars ("why us")',
      admin: hidden,
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'fixed-quote',
          options: [
            'fixed-quote',
            'verified-crew',
            'claims',
            'insurance',
            'shield-check',
            'check',
            'clock',
          ].map((v) => ({ label: v, value: v })),
        },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Lead (wide)', value: 'lead' },
            { label: 'Dark (tall)', value: 'dark' },
          ],
        },
        {
          name: 'link',
          type: 'group',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text' },
                { name: 'href', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
