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
};

export default withPayload(nextConfig);
