import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

const SITE = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

/**
 * Pure static output (Doc 02 §1): everything Googlebot can reach is SSG. The only
 * dynamic surfaces — /quote, /track, /search — are Cloudflare Pages Functions in
 * `functions/`, deployed alongside the static site, so no adapter is needed here.
 */
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact({ compat: false })],
  vite: { plugins: [tailwindcss()] },
  // Only three islands ever hydrate; keep the default zero-JS posture otherwise.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
