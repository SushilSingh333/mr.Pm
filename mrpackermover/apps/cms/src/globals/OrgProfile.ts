import type { GlobalConfig } from 'payload';
import { isAuthenticated } from '../access/index.js';

/**
 * The SINGLE legal identity (ADR-0004). Rendered once as an `Organization` node
 * (referenced elsewhere by @id) and in the footer on every page: legalName, GSTIN
 * (taxID), CIN (identifier), registered office, and the single verified GBP link.
 * There is no per-city business entity anywhere.
 */
export const OrgProfile: GlobalConfig = {
  slug: 'org-profile',
  label: 'Organisation profile',
  admin: { group: 'Settings' },
  access: { read: () => true, update: isAuthenticated },
  fields: [
    { name: 'brandName', type: 'text', required: true, defaultValue: 'MrPackerMover' },
    { name: 'legalName', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'gstin', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'cin', type: 'text', required: true, admin: { width: '50%' } },
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
