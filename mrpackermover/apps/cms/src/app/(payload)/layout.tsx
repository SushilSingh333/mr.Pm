/* THIS FILE IS THE STANDARD PAYLOAD ADMIN LAYOUT.
 * If your installed Payload minor version ships a different shape, regenerate with
 * `pnpm --filter @mpm/cms exec payload generate:importmap` and re-scaffold via the
 * Payload docs. It serves only the /admin panel; the public site is Astro.
 */
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import type { ServerFunctionClient } from 'payload';
import config from '../../payload.config.js';
import { importMap } from './admin/importMap.js';

import '@payloadcms/next/css';

type Args = { children: React.ReactNode };

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
