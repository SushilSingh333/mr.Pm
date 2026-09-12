import type { Endpoint, PayloadRequest } from 'payload';
import { json, queryParam } from './_lib.js';

/**
 * Driving distance between two places, for the proposal editor.
 *
 * A proposal made from a lead inherits the distance the quote form already measured.
 * A proposal for someone who phoned in has no lead, so the distance was typed from
 * memory or left blank — and the DISTANCE line on the PDF is the one figure a customer
 * can check against their own map app.
 *
 * Server-side on purpose. The site's public Google key is referrer-restricted and
 * meant for the browser; the CMS holds an unrestricted server key, and sending that to
 * an admin page would leak a billable credential to anyone who opens devtools. The
 * key never leaves the droplet.
 *
 * Staff-only: the route is cheap but it is billed per call, so it is not left open to
 * the internet the way /api/quote has to be.
 */
export const routeDistanceEndpoint: Endpoint = {
  path: '/route-distance',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return json({ error: 'Sign in first' }, 401);

    const from = queryParam(req, 'from');
    const to = queryParam(req, 'to');
    if (!from || !to) return json({ error: 'Both a pickup and a drop are required' }, 400);

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return json({ error: 'No maps key is configured on this server' }, 501);

    const url =
      'https://maps.googleapis.com/maps/api/distancematrix/json' +
      `?origins=${encodeURIComponent(from)}` +
      `&destinations=${encodeURIComponent(to)}` +
      `&mode=driving&units=metric&region=in&key=${encodeURIComponent(key)}`;

    try {
      // Bounded: the proposal editor is waiting on this, and a hung upstream should
      // surface as "try again" rather than a spinner that never resolves.
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as {
        status?: string;
        rows?: Array<{ elements?: Array<{ status?: string; distance?: { value?: number } }> }>;
      };
      const el = data.rows?.[0]?.elements?.[0];
      if (data.status !== 'OK' || el?.status !== 'OK' || !el.distance?.value) {
        return json({ error: 'No driving route found between those places' }, 404);
      }
      return json({ km: Math.round(el.distance.value / 1000) });
    } catch (error) {
      req.payload.logger.error({ err: error }, 'route-distance: lookup failed');
      return json({ error: 'The distance lookup failed. Please try again.' }, 502);
    }
  },
};
