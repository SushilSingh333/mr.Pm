import type { Endpoint } from 'payload';
import { json } from './_lib.js';
import { lostBy } from '../lib/lost-by.js';

/**
 * GET /api/leads/lost-by-me - the signed-in person's own lost leads that were handed on
 * to a colleague (see lib/lost-by.ts for exactly what each row holds, and why it is so
 * little). Drawn on a salesperson's Leads page as "Leads you lost".
 *
 * Only ever their own: the user id comes from the session, never from the request.
 */
export const lostByMeEndpoint: Endpoint = {
  path: '/lost-by-me',
  method: 'get',
  handler: async (req) => {
    const id = (req.user as { id?: string | number } | null | undefined)?.id;
    if (req.user?.collection !== 'users' || id == null) return json({ error: 'Sign in' }, 401);
    try {
      return json({ rows: (await lostBy(req.payload, id)).slice(0, 200) });
    } catch (err) {
      req.payload.logger.error({ err }, 'lost-by-me: could not read');
      return json({ error: 'Could not load' }, 500);
    }
  },
};
