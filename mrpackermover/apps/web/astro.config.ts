import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

const SITE = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
/** Where the Payload/Node app (CMS admin + /api/* endpoints) runs during local dev. */
const CMS_ORIGIN = process.env.CMS_ORIGIN ?? 'http://localhost:3000';

/**
 * Pure static output (Doc 02 §1): everything Googlebot can reach is SSG, served by
 * Caddy on the origin and hard-cached at Cloudflare. The only dynamic surfaces —
 * /api/quote, /api/track, /api/search — are served by the Payload/Node app on the
 * same origin (Caddy proxies /api/* and /admin* to it), so no adapter is needed here.
 */
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact({ compat: false })],
  vite: {
    plugins: [tailwindcss()],
    // In local dev the static site (this server) and the Payload app run on different
    // ports, so a relative POST to /api/quote would hit the wrong server and never reach
    // the CMS. Proxy the dynamic surfaces to Payload so forms and the admin behave exactly
    // like production, where Caddy proxies /api/* and /admin* to the origin. No effect on
    // the static build — this only configures the dev server.
    server: {
      proxy: {
        '/api': { target: CMS_ORIGIN, changeOrigin: true },
        '/admin': { target: CMS_ORIGIN, changeOrigin: true },
      },
    },
  },
  // Only three islands ever hydrate; keep the default zero-JS posture otherwise.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
