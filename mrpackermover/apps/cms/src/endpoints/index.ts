import type { Endpoint } from 'payload';
import { quoteEndpoint } from './quote.js';
import { searchEndpoint } from './search.js';
import { trackEndpoint } from './track.js';
import { applyEndpoint } from './apply.js';
import { contactEndpoint } from './contact.js';

/**
 * Public Node endpoints served by the origin (Payload/Next), mounted under `/api`:
 *   POST /api/quote    → capture a lead (quote form or price check) into Leads
 *   GET  /api/search   → typeahead over serviceable locations
 *   GET  /api/track    → shipment status (stub until ops source is wired)
 *   POST /api/apply    → capture a job application into Job Applications
 *   POST /api/contact  → capture a contact message into Contact Messages
 *
 * These replace the former Cloudflare Pages Functions now that the origin is a
 * single DigitalOcean droplet — no Workers, no Hyperdrive.
 */
export const publicEndpoints: Endpoint[] = [
  quoteEndpoint,
  searchEndpoint,
  trackEndpoint,
  applyEndpoint,
  contactEndpoint,
];
