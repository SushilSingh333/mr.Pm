import type { CollectionConfig } from 'payload';
import { isAuthenticated } from '../access/index.js';

/**
 * Moving proposals — a native CMS section. Click "Proposals" → the list of everything created;
 * "Create New" → this structured form (styled like the rest of the admin); fill it → Create →
 * the "Preview & PDF" tab shows the live 2-page A4 PDF (same design as the studio) with Download.
 * The record's own fields ARE the proposal (no raw JSON blob, no iframe). Staff-only; internal,
 * so no build-trigger hook.
 */

const PACK_OPTIONS = [
  'Standard Wrap',
  'Bubble Wrap',
  'Wooden Crate',
  'Original Box',
  'Blanket Wrap',
].map((v) => ({ label: v, value: v }));
// Truck size in feet — matches the website estimator's dropdown (10/12/14/15/16/17/19 ft).
const TRUCK_OPTIONS = ['10 ft', '12 ft', '14 ft', '15 ft', '16 ft', '17 ft', '19 ft'].map((v) => ({
  label: v,
  value: v,
}));
const SERVICE_OPTIONS = [
  'Domestic Household',
  'Local / Within City',
  'Office / Commercial',
  'Vehicle Transport',
  'International',
].map((v) => ({ label: v, value: v }));

const DEFAULT_INVENTORY = [
  { name: 'Sofa Set (3-Seater)', qty: 1, pack: 'Bubble Wrap', rem: '' },
  { name: 'LED Television', qty: 1, pack: 'Wooden Crate', rem: '' },
  { name: 'Refrigerator', qty: 1, pack: 'Bubble Wrap', rem: '' },
  { name: 'Washing Machine', qty: 1, pack: 'Bubble Wrap', rem: '' },
  { name: 'Air Conditioner (Split/Window)', qty: 1, pack: 'Standard Wrap', rem: 'De-install' },
  { name: 'Double Bed', qty: 1, pack: 'Standard Wrap', rem: '' },
  { name: 'Almirah (Big)', qty: 1, pack: 'Standard Wrap', rem: '' },
  { name: 'Dining Table + Chairs', qty: 1, pack: 'Bubble Wrap', rem: '' },
  { name: 'Cartons (Assorted)', qty: 10, pack: 'Standard Wrap', rem: 'Kitchen, books' },
];
const DEFAULT_CHARGES = [
  { name: 'Professional packing — material & labour', amt: 18000 },
  { name: 'Transportation', amt: 24000 },
  { name: 'Loading & unloading', amt: 6000 },
  { name: 'Unpacking & basic rearrangement', amt: 4000 },
  { name: 'Toll, permits & state entry', amt: 3000 },
];
const DEFAULT_SERVICES = [
  { line: 'Professional packing — Premium 5-layer materials, room-wise labelling' },
  { line: 'Trained & verified crew — Uniformed, background-checked movers' },
  { line: 'GPS-tracked transport — Dedicated container, live location on request' },
  { line: 'Loading & unloading — Careful handling with floor & wall protection' },
  { line: 'Unpacking & rearrangement — Boxes opened and furniture placed' },
  { line: 'All-risk transit insurance — Optional cover on declared goods value' },
];
const DEFAULT_TERMS = [
  {
    line: 'This proposal is valid for the number of days stated on page one from the date of issue.',
  },
  {
    line: 'Prices are inclusive of packing material, labour and standard transportation as itemised.',
  },
  {
    line: 'Transit insurance is optional and charged on the declared value of goods; claims are settled as per the insurer’s policy.',
  },
  {
    line: 'Handling beyond ground floor, long carry over 50 m, or lift-unavailability may attract additional charges, informed in advance.',
  },
  {
    line: 'A booking advance confirms the move; the balance is payable before unloading at destination.',
  },
  {
    line: 'Dismantling / re-fixing of modular furniture, ACs and geysers by technicians is chargeable at actuals unless stated.',
  },
  {
    line: 'The company is not liable for internal or mechanical damage to electronic items that are self-packed or undeclared.',
  },
  {
    line: 'Delivery timelines are good-faith estimates and may vary due to road, weather or regulatory conditions beyond our control.',
  },
  {
    line: 'Perishables, cash, jewellery, documents and hazardous materials are not accepted for transit.',
  },
  {
    line: 'Any dispute is subject to the jurisdiction of the courts at the company’s registered city.',
  },
];

export const Proposals: CollectionConfig = {
  slug: 'proposals',
  admin: {
    useAsTitle: 'title',
    group: 'Sales',
    defaultColumns: ['title', 'clientName', 'route', 'amount', 'status', 'updatedAt'],
    description:
      'All moving proposals. Create New → fill the form → the Preview & PDF tab shows the downloadable PDF.',
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.quoteNo) {
          const d = new Date();
          const p = (n: number): string => String(n).padStart(2, '0');
          data.quoteNo =
            'MPM-' +
            d.getFullYear() +
            p(d.getMonth() + 1) +
            p(d.getDate()) +
            '-' +
            p(((d.getHours() * 60 + d.getMinutes()) % 99) + 1);
        }
        const cust = data.customer?.name || '';
        const from = data.move?.from || '';
        const to = data.move?.to || '';
        data.clientName = cust;
        data.route = from || to ? `${from} → ${to}` : '';
        data.amount = (data.charges || []).reduce(
          (s: number, c: { amt?: number }) => s + (Number(c?.amt) || 0),
          0,
        );
        data.title = [cust, data.quoteNo].filter(Boolean).join(' · ') || data.quoteNo;
        return data;
      },
    ],
  },
  fields: [
    // ---- sidebar: status + auto summary (also the list columns) ----
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Lost', value: 'lost' },
      ],
    },
    {
      name: 'quoteNo',
      type: 'text',
      label: 'Quote no.',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
      admin: { position: 'sidebar', description: 'The lead this proposal is for (optional).' },
    },
    {
      name: 'leadAutofill',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/components/proposal/LeadAutofill#LeadAutofill' },
      },
    },
    { name: 'title', type: 'text', admin: { position: 'sidebar', readOnly: true, hidden: true } },
    {
      name: 'clientName',
      type: 'text',
      label: 'Customer',
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'route', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'amount',
      type: 'number',
      label: 'Quoted (base ₹)',
      admin: { position: 'sidebar', readOnly: true },
    },

    // ---- main form: tabs ----
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Customer & Move',
          fields: [
            {
              name: 'customer',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', admin: { width: '50%' } },
                    { name: 'phone', type: 'text', admin: { width: '50%' } },
                  ],
                },
                { name: 'email', type: 'text' },
              ],
            },
            {
              name: 'move',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'from', type: 'text', label: 'Origin city', admin: { width: '50%' } },
                    {
                      name: 'froms',
                      type: 'text',
                      label: 'Origin state / area',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'to',
                      type: 'text',
                      label: 'Destination city',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'tos',
                      type: 'text',
                      label: 'Destination state / area',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'date',
                      type: 'date',
                      label: 'Move date',
                      admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
                    },
                    {
                      name: 'house',
                      type: 'select',
                      label: 'Truck size',
                      defaultValue: '14 ft',
                      options: TRUCK_OPTIONS,
                      admin: { width: '33%' },
                    },
                    {
                      name: 'dist',
                      type: 'text',
                      label: 'Distance',
                      admin: { width: '34%', placeholder: '≈ 1,180 km' },
                    },
                  ],
                },
                {
                  name: 'svc',
                  type: 'select',
                  label: 'Service type',
                  defaultValue: 'Domestic Household',
                  options: SERVICE_OPTIONS,
                },
              ],
            },
          ],
        },
        {
          label: 'Inventory',
          fields: [
            {
              name: 'inventory',
              type: 'array',
              labels: { singular: 'Article', plural: 'Articles' },
              defaultValue: DEFAULT_INVENTORY,
              admin: { initCollapsed: false },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', label: 'Article', admin: { width: '45%' } },
                    {
                      name: 'qty',
                      type: 'number',
                      label: 'Qty',
                      defaultValue: 1,
                      admin: { width: '15%' },
                    },
                    {
                      name: 'pack',
                      type: 'select',
                      label: 'Packing',
                      defaultValue: 'Standard Wrap',
                      options: PACK_OPTIONS,
                      admin: { width: '40%' },
                    },
                  ],
                },
                { name: 'rem', type: 'text', label: 'Remarks' },
              ],
            },
          ],
        },
        {
          label: 'Costs',
          fields: [
            {
              name: 'charges',
              type: 'array',
              labels: { singular: 'Charge', plural: 'Charges' },
              defaultValue: DEFAULT_CHARGES,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: 'Charge description',
                      admin: { width: '70%' },
                    },
                    { name: 'amt', type: 'number', label: 'Amount (₹)', admin: { width: '30%' } },
                  ],
                },
              ],
            },
            {
              name: 'pricing',
              type: 'group',
              label: 'GST, insurance & terms',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'gstRate',
                      type: 'number',
                      label: 'GST rate (%)',
                      defaultValue: 18,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'goodsValue',
                      type: 'number',
                      label: 'Declared goods value (₹)',
                      admin: { width: '25%' },
                    },
                    {
                      name: 'insRate',
                      type: 'number',
                      label: 'Insurance rate (%)',
                      defaultValue: 0.3,
                      admin: { width: '25%', description: '0 to drop insurance' },
                    },
                    {
                      name: 'validDays',
                      type: 'number',
                      label: 'Validity (days)',
                      defaultValue: 15,
                      admin: { width: '25%' },
                    },
                  ],
                },
                {
                  name: 'pay',
                  type: 'text',
                  label: 'Payment terms',
                  defaultValue: '25% advance · balance before unloading',
                },
              ],
            },
          ],
        },
        {
          label: 'Services & Terms',
          fields: [
            {
              name: 'services',
              type: 'array',
              label: "What's included (page 2)",
              labels: { singular: 'Service', plural: 'Services' },
              defaultValue: DEFAULT_SERVICES,
              admin: { description: 'Use “Title — description” for a bold title + subtext.' },
              fields: [{ name: 'line', type: 'text' }],
            },
            {
              name: 'terms',
              type: 'array',
              label: 'Terms & conditions (page 2)',
              labels: { singular: 'Term', plural: 'Terms' },
              defaultValue: DEFAULT_TERMS,
              fields: [{ name: 'line', type: 'textarea' }],
            },
          ],
        },
        {
          label: 'Company',
          description:
            'Header & footer branding — set once; it carries to every proposal you make.',
          fields: [
            {
              name: 'company',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      defaultValue: 'MrPackerMover',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'tag',
                      type: 'text',
                      label: 'Tagline',
                      defaultValue: 'Trusted Household & Office Relocation',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'phone',
                      type: 'text',
                      label: 'Phone / WhatsApp',
                      defaultValue: '+91 99104 26834',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'mobile',
                      type: 'text',
                      label: 'Alternate mobile',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'email',
                      type: 'text',
                      defaultValue: 'shiftwith@mrpackermover.com',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'web',
                      type: 'text',
                      label: 'Website',
                      defaultValue: 'mrpackermover.com',
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'addr', type: 'text', label: 'Registered address' },
                {
                  type: 'row',
                  fields: [
                    { name: 'gst', type: 'text', label: 'GSTIN', admin: { width: '50%' } },
                    {
                      name: 'rep',
                      type: 'text',
                      label: 'Consultant / Prepared by',
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Preview & PDF',
          fields: [
            {
              name: 'pdf',
              type: 'ui',
              admin: { components: { Field: '/components/proposal/ProposalPdf#ProposalPdf' } },
            },
          ],
        },
      ],
    },
  ],
};
