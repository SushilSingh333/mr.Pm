import type { GlobalConfig } from 'payload';
import { hideFromSalesRoles, isContentStaff } from '../access/index.js';

/**
 * The SINGLE legal identity (ADR-0004). Rendered once as an `Organization` node
 * (referenced elsewhere by @id) and in the footer on every page: legalName, GSTIN
 * (taxID), CIN (identifier), registered office, and the single verified GBP link.
 * There is no per-city business entity anywhere.
 */
export const OrgProfile: GlobalConfig = {
  slug: 'org-profile',
  label: 'Organisation profile',
  admin: { group: 'Settings', hidden: hideFromSalesRoles },
  access: { read: () => true, update: isContentStaff },
  fields: [
    { name: 'brandName', type: 'text', required: true, defaultValue: 'MrMoverPacker' },
    { name: 'legalName', type: 'text', required: true },
    {
      name: 'tradeName',
      type: 'text',
      label: 'Trade name (GST)',
      admin: { description: 'As on the GST certificate. Blank shows the legal name.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'gstin',
          type: 'text',
          required: true,
          label: 'GSTIN',
          admin: {
            width: '50%',
            description:
              'All 15 characters, as on the GST certificate. A wrong check character is not shown on the site.',
          },
        },
        {
          name: 'cin',
          type: 'text',
          label: 'CIN or LLPIN',
          admin: {
            width: '50%',
            description:
              'For a company or LLP. Leave blank for a partnership firm or proprietorship.',
          },
        },
      ],
    },
    { name: 'yearsOperating', type: 'number', required: true },
    { name: 'insurancePartner', type: 'text' },
    { name: 'registeredOffice', type: 'textarea', required: true },
    {
      name: 'complaintSla',
      type: 'text',
      admin: { description: 'Published complaint SLA (e.g. "first response within 24 h").' },
    },
    {
      name: 'sameAs',
      type: 'array',
      admin: { description: 'Verified profiles: the single GBP, LinkedIn, directory listings.' },
      fields: [{ name: 'url', type: 'text', required: true }],
    },
    { name: 'phone', type: 'text' },
    { name: 'whatsapp', type: 'text' },
  ],
};
