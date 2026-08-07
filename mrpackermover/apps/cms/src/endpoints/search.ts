import type { Endpoint } from 'payload';
import { json, queryParam } from './_lib.js';

/**
 * GET /api/search?q= — typeahead over serviceable cities/localities (noindex, and
 * disallowed in robots). Query params never mint indexable pages (Doc 02 §3); this
 * is JSON only. Reads published, serviceable locations through the local API.
 */
interface LocationHit {
  name: string;
  slug: string;
  type: 'state' | 'city' | 'locality';
  parent?: { slug?: string } | null;
}

export const searchEndpoint: Endpoint = {
  path: '/search',
  method: 'get',
  handler: async (req) => {
    const q = queryParam(req, 'q');
    if (q.length < 2) return json({ results: [] });

    try {
      const { docs } = await req.payload.find({
        collection: 'locations',
        depth: 1,
        limit: 10,
        sort: 'name',
        where: {
          and: [
            { isServiceable: { equals: true } },
            { _status: { equals: 'published' } },
            { name: { like: q } },
          ],
        },
      });

      const results = (docs as unknown as LocationHit[])
        .map((d) => ({
          name: d.name,
          path:
            d.type === 'city'
              ? `/packers-and-movers/${d.slug}`
              : d.parent?.slug
                ? `/packers-and-movers/${d.parent.slug}/${d.slug}`
                : null,
        }))
        .filter((r): r is { name: string; path: string } => r.path != null)
        // Cities first, then localities — matches the old ordering.
        .sort(
          (a, b) => Number(b.path.split('/').length === 3) - Number(a.path.split('/').length === 3),
        );

      return json({ results });
    } catch (error) {
      req.payload.logger.error({ err: error }, 'search failed');
      return json({ results: [], error: 'search unavailable' }, 500);
    }
  },
};
