import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { getDatabaseUrl } from '@mpm/db/env';

import { Users } from './collections/Users.js';
import { Media } from './collections/Media.js';
import { Locations } from './collections/Locations.js';
import { Services } from './collections/Services.js';
import { Lanes } from './collections/Lanes.js';
import { OperatingBases } from './collections/OperatingBases.js';
import { RateCards } from './collections/RateCards.js';
import { Reviews } from './collections/Reviews.js';
import { JobsStats } from './collections/JobsStats.js';
import { Faqs } from './collections/Faqs.js';
import { ContentBlocks } from './collections/ContentBlocks.js';
import { Guides } from './collections/Guides.js';
import { People } from './collections/People.js';
import { Pages } from './collections/Pages.js';
import { Leads } from './collections/Leads.js';
import { Jobs } from './collections/Jobs.js';
import { JobApplications } from './collections/JobApplications.js';
import { ContactMessages } from './collections/ContactMessages.js';
import { OrgProfile } from './globals/OrgProfile.js';
import { HomeContent } from './globals/HomeContent.js';
import { publicEndpoints } from './endpoints/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: '· MrPackerMover CMS' },
    // Custom admin UI: analytics dashboard, branded sidebar quick-access, and brand logo.
    // Paths are resolved from `src` (importMap.baseDir); run `generate:importmap` after
    // adding/renaming any of these so Payload can bundle them.
    importMap: { baseDir: dirname },
    components: {
      graphics: {
        Logo: '/components/graphics/BrandLogo#BrandLogo',
        Icon: '/components/graphics/BrandIcon#BrandIcon',
      },
      beforeDashboard: ['/components/dashboard/AnalyticsDashboard#AnalyticsDashboard'],
      beforeNavLinks: ['/components/nav/SidebarNav#SidebarNav'],
    },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  // Standard Postgres over the wire protocol → portable (Neon/Supabase/RDS/self).
  // `push: false` in production: schema changes go through versioned migrations.
  db: postgresAdapter({
    pool: { connectionString: getDatabaseUrl() },
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, '../migrations'),
  }),

  collections: [
    // Geography & catalogue
    Locations,
    Services,
    Lanes,
    // Pricing & trust
    RateCards,
    Reviews,
    JobsStats,
    // Content
    Pages,
    Faqs,
    ContentBlocks,
    Guides,
    People,
    Media,
    // Careers
    Jobs,
    JobApplications,
    // Inbox (public form submissions)
    Leads,
    ContactMessages,
    // Internal — never rendered (ADR-0004)
    OperatingBases,
    // System
    Users,
  ],
  globals: [OrgProfile, HomeContent],

  // Public JSON endpoints served by the origin (mounted under /api): quote, search,
  // track. On the DigitalOcean origin these replace the old Cloudflare Functions.
  endpoints: publicEndpoints,

  graphQL: { disable: true },
  sharp: (await import('sharp')).default,
});
