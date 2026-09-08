import { withPayload } from '@payloadcms/next/withPayload';

/**
 * `next dev` and `next build` both wrote to `.next`, so running a build (directly, or
 * via `turbo run build` / `pnpm check`) while the dev server was up overwrote the
 * chunks dev was serving. Dev then threw MODULE_NOT_FOUND out of
 * `.next/server/pages/_document.js` and every admin route and API route 500'd until
 * `.next` was deleted and the server restarted.
 *
 * Giving dev its own directory removes the collision. Production is untouched: `next
 * build` and `next start` both still use `.next`, so nothing about the droplet deploy
 * changes.
 */
const distDir = process.env.NODE_ENV === 'development' ? '.next-dev' : '.next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir,
  // Payload runs inside Next's App Router. The public site is a separate Astro
  // app; this Next app serves ONLY the admin panel + the Local/REST API.
  // Workspace packages ship as TypeScript source, so Next must transpile them.
  transpilePackages: ['@mpm/shared', '@mpm/seo', '@mpm/db', '@mpm/ui-tokens'],
  // Skip ESLint during `next build` — type checking still runs, but lint rules (e.g. the
  // no-explicit-any in the admin field components and the ban-ts-comment on the verbatim
  // PDF port) should not fail a production build. Tracked here so it isn't hand-applied on
  // the droplet each deploy.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    reactCompiler: false,
  },
  // The Payload scaffold (`app/(payload)/**`) and our workspace packages author imports
  // with explicit `.js` extensions (ESM style, `moduleResolution: bundler`). Next's
  // webpack does not map `.js` → `.ts` by default, so `payload.config.js` and
  // `importMap.js` fail to resolve and the whole admin 500s. Teach webpack the mapping.
  // Order matters: prefer a real `.js` when it exists (the Payload-generated
  // `importMap.js`, which registers custom admin components), then fall back to the
  // `.ts` source (`payload.config.ts`, which has no `.js` sibling).
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ...(webpackConfig.resolve.extensionAlias ?? {}),
      '.js': ['.js', '.jsx', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
    };
    return webpackConfig;
  },
};

export default withPayload(nextConfig);
