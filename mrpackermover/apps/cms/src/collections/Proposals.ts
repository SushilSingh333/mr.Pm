import type { CollectionConfig } from 'payload';
import { proposalsRead, proposalsWrite, isRole } from '../access/index.js';
import { DEFAULT_PROPOSAL_SERVICE, proposalServiceFor } from '../lib/proposal-service.js';

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
  { name: 'Professional packing, material & labour', amt: 18000 },
  { name: 'Transportation', amt: 24000 },
  { name: 'Loading & unloading', amt: 6000 },
  { name: 'Unpacking & basic rearrangement', amt: 4000 },
  { name: 'Toll, permits & state entry', amt: 3000 },
];
/**
 * What every new proposal starts with. Editable per proposal - this is the starting
 * point, not a fixed list.
 *
 * The GPS/live-location line was removed: it appeared on every quote by default and
 * promised tracking the business cannot yet deliver (/track is still a stub), which
 * makes it a commitment on a document the customer holds us to. Packing reads 3-layer
 * because that is what the crews actually wrap.
 *
 * Kept in step with `defaultServices` in components/proposal/proposal-pdf.ts.
 */
const DEFAULT_SERVICES = [
  { line: 'Professional packing, Premium 3-layer materials, room-wise labelling' },
  { line: 'Trained & verified crew, Uniformed, background-checked movers' },
  { line: 'Loading & unloading, Careful handling with floor & wall protection' },
  { line: 'Unpacking & rearrangement, Boxes opened and furniture placed' },
  { line: 'All-risk transit insurance, Optional cover on declared goods value' },
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
    create: proposalsWrite,
    read: proposalsRead,
    update: proposalsRead,
    delete: ({ req }) => isRole(req, 'admin', 'handler'),
  },
  hooks: {
    beforeValidate: [
      // `create` access can only check the role, not which lead is being attached, so a
      // salesperson could otherwise raise a proposal against someone else's lead. They
      // could never read it back (read is scoped by the lead's owner), but they could
      // still clutter another person's pipeline. Checked here, where the lead is known.
      async ({ data, req, operation }) => {
        if (!data || !isRole(req, 'sales')) return data;
        const leadId =
          data.lead && typeof data.lead === 'object'
            ? (data.lead as { id?: unknown }).id
            : data.lead;
        if (!leadId) return data;
        const me = (req.user as { id?: string | number } | null)?.id;
        const owned = await req.payload.find({
          collection: 'leads',
          where: { and: [{ id: { equals: leadId } }, { assignedTo: { equals: me } }] } as never,
          limit: 1,
          overrideAccess: true,
          depth: 0,
        });
        if (owned.totalDocs === 0) {
          throw new Error(
            `You can only ${operation === 'create' ? 'raise' : 'edit'} a proposal for a lead assigned to you.`,
          );
        }
        return data;
      },
    ],
    beforeChange: [
      /**
       * Fill anything still blank from the linked lead.
       *
       * The admin does this in the browser as you pick the lead, so you can see and edit
       * the values before saving. This is the backstop: form state is built
       * asynchronously and a custom component racing it is not something to bet a
       * customer's quote on. Whatever the UI managed, the saved document is right.
       *
       * Only fills EMPTY fields, so it can never overwrite what someone typed, and only
       * on create - editing a proposal later must not silently pull values back.
       */
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data) return data;
        const leadId = typeof data.lead === 'object' ? data.lead?.id : data.lead;
        if (!leadId) return data;
        try {
          // `req` keeps this inside the caller's transaction; a second connection here
          // would deadlock against the insert that is waiting on this hook.
          // The generated Lead type is used directly rather than cast to a loose record;
          // that way a renamed field breaks here instead of silently filling nothing.
          const lead = await req.payload.findByID({
            collection: 'leads',
            id: leadId as string,
            depth: 0,
            overrideAccess: true,
            req,
          });

          const blank = (v: unknown): boolean => v == null || v === '';
          data.customer = data.customer ?? {};
          data.move = data.move ?? {};
          const put = (obj: Record<string, unknown>, key: string, v: unknown): void => {
            if (blank(obj[key]) && !blank(v)) obj[key] = v;
          };
          put(data.customer, 'name', lead.name);
          put(data.customer, 'phone', lead.phone);
          put(data.customer, 'email', lead.email);
          put(data.move, 'from', lead.pickup);
          put(data.move, 'to', lead.dropLocation);
          put(data.move, 'date', lead.moveDate);
          // `svc` always has a default, so it is never "blank" - overwrite it only when
          // it is still untouched, and only when the lead maps to a known option.
          const mapped = proposalServiceFor(lead.service);
          if (mapped && (blank(data.move.svc) || data.move.svc === DEFAULT_PROPOSAL_SERVICE)) {
            data.move.svc = mapped;
          }
          if (typeof lead.distanceKm === 'number' && lead.distanceKm > 0) {
            put(data.move, 'dist', `${lead.distanceKm.toLocaleString('en-IN')} km`);
          }
          // The lead's estimate is deliberately not copied into charges - see the note
          // in LeadAutofill on why a rate-card guess must not become a fixed price.
        } catch (error) {
          req.payload.logger.error({ err: error }, 'proposal: could not fill from lead');
        }
        return data;
      },
      // Records the author so a proposal stays visible to whoever raised it, even
      // before a lead is attached. Set once, on create.
      ({ data, req, operation }) => {
        if (operation === 'create' && !data.createdBy) {
          data.createdBy = (req.user as { id?: string | number } | null)?.id ?? null;
        }
        return data;
      },
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
    afterChange: [
      /**
       * Move the linked lead to "Quoted".
       *
       * A proposal existing and the lead still reading "Contacted" is how two people end
       * up quoting the same customer different numbers. Rather than adding a column that
       * only the list view shows, this uses the pipeline stage that already exists - so
       * it shows up in the leads list, the dashboards, the sidebar badges and the date
       * filters at once, with no new machinery.
       *
       * Only ever forwards. `won` and `lost` are decisions a human made after quoting,
       * and re-saving a proposal must not drag a closed lead back into the pipeline.
       *
       * Both calls pass `req`. Without it Payload opens a SECOND database connection for
       * each one, while the proposal's own transaction is still open and waiting on this
       * hook - the two block each other until the pool times out. The first version of
       * this hook hung for five minutes on a one-row update, which is the same deadlock
       * the login audit hit (see Users.ts). Passing `req` joins the existing transaction.
       */
      async ({ doc, req, operation }) => {
        const OPEN_BEFORE_QUOTED = [
          'new',
          'assigned',
          'reassigned',
          'contacted',
          'call-not-picked',
        ];
        const leadId = typeof doc.lead === 'object' ? doc.lead?.id : doc.lead;
        if (!leadId || (operation !== 'create' && operation !== 'update')) return doc;
        try {
          const lead = await req.payload.findByID({
            collection: 'leads',
            id: leadId as string,
            depth: 0,
            overrideAccess: true,
            req,
          });
          if (!OPEN_BEFORE_QUOTED.includes(String(lead.status))) return doc;
          await req.payload.update({
            collection: 'leads',
            id: leadId as string,
            data: { status: 'quoted' } as never,
            overrideAccess: true,
            req,
          });
        } catch (error) {
          // Never fail saving a proposal because the lead could not be advanced; the
          // proposal is the thing being written, the stage is a convenience.
          req.payload.logger.error({ err: error }, 'proposal: could not mark lead quoted');
        }
        return doc;
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
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Who raised this proposal. Stamped automatically.',
      },
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
                  // Fills Distance from the From/To above. A proposal made from a lead
                  // already has it; this is for the ones taken over the phone.
                  name: 'measureDistance',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '/components/proposal/MeasureDistance#MeasureDistance',
                    },
                  },
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
                      admin: {
                        width: '25%',
                        description:
                          'Clear this field to quote without GST; the PDF then drops the GST line.',
                      },
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
              admin: { description: 'Use “Title, description” for a bold title + subtext.' },
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
          description: 'Header & footer branding, set once; it carries to every proposal you make.',
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
                      defaultValue: 'MrMoverPacker',
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
                      defaultValue: '+91 80903 43030',
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
                      defaultValue: 'shiftwith@mrmoverpacker.com',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'web',
                      type: 'text',
                      label: 'Website',
                      defaultValue: 'mrmoverpacker.com',
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
