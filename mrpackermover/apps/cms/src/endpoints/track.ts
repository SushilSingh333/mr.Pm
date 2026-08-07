import type { Endpoint } from 'payload';
import { json, queryParam } from './_lib.js';

/**
 * GET /api/track?ref= — shipment tracking lookup (noindex, disallowed in robots,
 * `private, no-store`). Wired to the ops shipments source when it exists; until then
 * it returns a clear "not found" rather than a fabricated status.
 */
export const trackEndpoint: Endpoint = {
  path: '/track',
  method: 'get',
  handler: (req) => {
    const ref = queryParam(req, 'ref');
    if (!ref) return json({ error: 'A job reference is required' }, 400);

    return json(
      {
        ref,
        status: 'unknown',
        message: 'We could not find that reference. Please check it or contact your coordinator.',
      },
      404,
    );
  },
};
