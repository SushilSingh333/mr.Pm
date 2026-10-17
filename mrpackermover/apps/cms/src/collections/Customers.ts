import type { CollectionConfig } from 'payload';
import { isAdmin } from '../access/index.js';
import { customerAdminEndpoints } from '../endpoints/customer-admin.js';
import { phoneCore } from '../lib/customer-auth.js';

/**
 * Website customer accounts: people who signed up on mrmoverpacker.com to follow their
 * moves (/account). Not CMS users - they cannot open the admin - and deliberately not a
 * Payload auth collection (see lib/customer-auth.ts for why).
 *
 * Admins only, for now: a handler or salesperson sees neither the list nor the "Customer"
 * link on a lead. That can be opened up later by changing the access below.
 *
 * There is no OTP yet, so two things a customer would normally do alone are done here:
 *   - A forgotten password: "Reset password" in the "Password and sign-in" panel. It
 *     suggests an easy password, signs the customer out on every device, unlocks them, and
 *     lets you copy it or send it on WhatsApp. The panel also unlocks an account and signs
 *     a customer out everywhere (endpoints/customer-admin.ts).
 *   - "Phone verified": tick it once you have spoken to them on this number. Only then do
 *     their older quote requests (made before they signed up, matched by phone) appear in
 *     their account, so nobody can sign up with someone else's number and see their moves.
 *     WhatsApp OTP will set it by itself when it arrives.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  admin: {
    useAsTitle: 'name',
    group: 'Customers',
    defaultColumns: ['name', 'phone', 'city', 'phoneVerified', 'lastLoginAt', 'createdAt'],
    listSearchableFields: ['name', 'phone', 'email'],
    description:
      'People who signed up on the website. Open one to reset a forgotten password ("Password and sign-in"). Tick "Phone verified" after a call to show their older quote requests in their account.',
    hidden: ({ user }) => (user as { role?: string } | undefined)?.role !== 'admin',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  endpoints: customerAdminEndpoints,
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        if (typeof data.phone === 'string') {
          const core = phoneCore(data.phone);
          if (!core) throw new Error('Enter a 10-digit Indian mobile number.');
          data.phone = core;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'phone',
          type: 'text',
          label: 'Mobile number',
          required: true,
          unique: true,
          index: true,
          admin: { width: '50%', description: '10 digits. This is what they sign in with.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email (optional)',
          admin: { width: '50%' },
        },
        { name: 'city', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'phoneVerified',
      type: 'checkbox',
      label: 'Phone verified',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Tick after confirming the number on a call. Their earlier quote requests on this number then show in their account.',
      },
    },
    {
      // Reset password, unlock, sign out everywhere: one panel, under their details.
      name: 'security',
      type: 'ui',
      admin: { components: { Field: '/components/customers/CustomerSecurity#CustomerSecurity' } },
    },
    {
      name: 'addresses',
      type: 'array',
      labels: { singular: 'Address', plural: 'Saved addresses' },
      maxRows: 10,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'select',
              defaultValue: 'home',
              options: [
                { label: 'Home', value: 'home' },
                { label: 'Office', value: 'office' },
                { label: 'Other', value: 'other' },
              ],
              admin: { width: '25%' },
            },
            {
              name: 'line',
              type: 'text',
              label: 'House, building, street',
              required: true,
              admin: { width: '75%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'area', type: 'text', label: 'Area or society', admin: { width: '35%' } },
            { name: 'city', type: 'text', admin: { width: '25%' } },
            { name: 'pincode', type: 'text', admin: { width: '20%' } },
            { name: 'floor', type: 'text', admin: { width: '20%' } },
          ],
        },
        { name: 'hasLift', type: 'checkbox', label: 'Lift available' },
        { name: 'isDefault', type: 'checkbox', label: 'Default address' },
      ],
    },
    {
      name: 'leads',
      type: 'join',
      collection: 'leads',
      on: 'customer',
      label: 'Quote requests from their account',
      admin: { defaultColumns: ['name', 'service', 'status', 'createdAt'] },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      label: 'Last signed in',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    // Internal: never shown and never readable over the API. Writable only by an admin (the
    // collection is admin-only) and by the hooks and account endpoints.
    {
      name: 'passwordHash',
      type: 'text',
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'sessionVersion',
      type: 'number',
      defaultValue: 0,
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'failedLogins',
      type: 'number',
      defaultValue: 0,
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'lockedUntil',
      type: 'date',
      access: { read: () => false },
      admin: { hidden: true },
    },
    // When the password was last set, and by which admin (empty when the customer changed
    // it themselves). Shown in the "Password and sign-in" panel.
    {
      name: 'passwordChangedAt',
      type: 'date',
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: 'passwordChangedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { read: () => false },
      admin: { hidden: true },
    },
  ],
};
