import type { Endpoint } from 'payload';
import { quoteEndpoint } from './quote.js';
import { searchEndpoint } from './search.js';
import { trackEndpoint } from './track.js';
import { applyEndpoint } from './apply.js';
import { contactEndpoint } from './contact.js';
import { routeDistanceEndpoint } from './route-distance.js';
import { leadWebhookEndpoint } from './lead-webhook.js';

/**
 * Public Node endpoints served by the origin (Payload/Next), mounted under `/api`:
 *   POST /api/quote    → capture a lead (quote form or price check) into Leads
 *   GET  /api/search   → typeahead over serviceable locations
 *   GET  /api/track    → shipment status (stub until ops source is wired)
 *   POST /api/apply    → capture a job application into Job Applications
 *   POST /api/contact  → capture a contact message into Contact Messages
 *   POST /api/lead-webhook → inbound leads from Facebook/Zapier (shared secret)
 *
 * Plus one staff-only route, mounted here because it shares the same plumbing:
 *   GET  /api/route-distance → driving km between two places, for the proposal editor
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
  routeDistanceEndpoint,
  leadWebhookEndpoint,
];
