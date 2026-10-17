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
  // Stylesheets inlined: each page's CSS is a few KB, and as separate files they were the
  // page's render-blocking requests (about a second on a mobile connection in PageSpeed).
  build: { format: 'file', inlineStylesheets: 'always' },
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
        // xfwd: pass the page's own host on as X-Forwarded-Host, as Caddy does, so the
        // account endpoints' same-origin check sees this page, not the CMS port.
        '/api': { target: CMS_ORIGIN, changeOrigin: true, xfwd: true },
        '/admin': { target: CMS_ORIGIN, changeOrigin: true, xfwd: true },
      },
    },
  },
  // Only three islands ever hydrate; keep the default zero-JS posture otherwise.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
