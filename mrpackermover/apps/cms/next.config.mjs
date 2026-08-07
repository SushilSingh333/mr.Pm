import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Payload runs inside Next's App Router. The public site is a separate Astro
  // app; this Next app serves ONLY the admin panel + the Local/REST API.
  // Workspace packages ship as TypeScript source, so Next must transpile them.
  transpilePackages: ['@mpm/shared', '@mpm/seo', '@mpm/db', '@mpm/ui-tokens'],
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
