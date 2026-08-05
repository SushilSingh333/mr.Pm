import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../lib/site.js';

/**
 * robots.txt (Doc 02 §6). Retrieval AI crawlers are ALLOWED (lead-gen upside);
 * only bandwidth-only scrapers are blocked at the edge. Dynamic/thin surfaces are
 * disallowed. Content-Signal opts out of training while allowing search/reference.
 */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /search
Disallow: /quote/thank-you
Disallow: /track/result
Disallow: /*?

# Retrieval assistants welcome; training opt-out only.
Content-Signal: search=yes, ai-train=no, use=reference

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
