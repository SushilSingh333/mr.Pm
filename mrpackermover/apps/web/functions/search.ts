import { json, pgClient, type Env } from './_lib.js';

/**
 * GET /search?q= — client-side search backend (noindex, disallowed in robots).
 * Returns matching serviceable cities/localities as links. Query parameters never
 * produce indexable pages (Doc 02 §3); this endpoint is JSON only.
 */
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const q = new URL(ctx.request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return json({ results: [] });

  const client = pgClient(ctx.env);
  try {
    await client.connect();
    const { rows } = await client.query<{
      name: string;
      slug: string;
      type: string;
      parent_slug: string | null;
    }>(
      `SELECT l.name, l.slug, l.type, p.slug AS parent_slug
       FROM locations l
       LEFT JOIN locations p ON p.id = l.parent_id
       WHERE l.is_serviceable AND l._status = 'published' AND l.name ILIKE $1
       ORDER BY (l.type = 'city') DESC, l.name
       LIMIT 10`,
      [`%${q}%`],
    );
    const results = rows.map((r) => ({
      name: r.name,
      path:
        r.type === 'city'
          ? `/packers-and-movers/${r.slug}`
          : `/packers-and-movers/${r.parent_slug}/${r.slug}`,
    }));
    return json({ results });
  } catch (error) {
    console.error('search failed', error);
    return json({ results: [], error: 'search unavailable' }, 500);
  } finally {
    ctx.waitUntil(client.end());
  }
};
