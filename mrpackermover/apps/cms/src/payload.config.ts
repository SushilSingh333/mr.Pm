import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { getDatabaseUrl } from '@mpm/db/env';
import { LIST_DATE_FORMAT } from './lib/date-display.js';
import { cloudinaryStorageAdapter } from './storage/cloudinary.js';

import { LoginEvents } from './collections/LoginEvents.js';
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
import { Blog } from './collections/Blog.js';
import { People } from './collections/People.js';
import { Pages } from './collections/Pages.js';
import { Leads } from './collections/Leads.js';
import { Jobs } from './collections/Jobs.js';
import { JobApplications } from './collections/JobApplications.js';
import { ContactMessages } from './collections/ContactMessages.js';
import { Proposals } from './collections/Proposals.js';
import { OrgProfile } from './globals/OrgProfile.js';
import { HomeContent } from './globals/HomeContent.js';
import { SeoDefaults } from './globals/SeoDefaults.js';
import { Integrations } from './globals/Integrations.js';
import { LeadRouting } from './globals/LeadRouting.js';
import { SalesMessages } from './globals/SalesMessages.js';
import { ScheduleSettings } from './globals/ScheduleSettings.js';
import { ServicesPage } from './globals/ServicesPage.js';
import { publicEndpoints } from './endpoints/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Cloudinary is used for Media only when all three secrets are present. Without them
// (local design/CI) Media falls back to Payload's local disk storage — nothing breaks.
const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

export default buildConfig({
  admin: {
    user: Users.slug,
    // Day first wherever Payload prints a date itself (lists, version history) - its
    // default reads "October 3rd 2026". See lib/date-display.ts.
    dateFormat: LIST_DATE_FORMAT,
    meta: { titleSuffix: '· MrMoverPacker CMS' },
    // Custom admin UI: analytics dashboard, branded sidebar quick-access, and brand logo.
    // Paths are resolved from `src` (importMap.baseDir); run `generate:importmap` after
    // adding/renaming any of these so Payload can bundle them.
    importMap: { baseDir: dirname },
    // Initials and name instead of Payload's grey silhouette - see AccountAvatar.
    avatar: { Component: '/components/nav/AccountAvatar#AccountAvatar' },
    components: {
      graphics: {
        Logo: '/components/graphics/BrandLogo#BrandLogo',
        Icon: '/components/graphics/BrandIcon#BrandIcon',
      },
      // Replace the default dashboard entirely (removes the redundant collection-group
      // cards — the sidebar already lists them) with our analytics + careers + inbox view.
      views: {
        dashboard: {
          Component: '/components/dashboard/Dashboard#Dashboard',
        },
        // The move calendar: every scheduled lead on its day. Its own admin page rather
        // than a mode of the Leads list, because a month grid is not a table.
        calendar: {
          Component: '/components/calendar/CalendarView#CalendarView',
          path: '/calendar',
          meta: { title: 'Calendar' },
        },
      },
      beforeNavLinks: ['/components/nav/SidebarNav#SidebarNav'],
      // App-wide violet "Dropify" theme — a provider wraps every admin page (incl. login
      // and account), injecting the global stylesheet. Presentation only.
      providers: ['/components/theme/AdminTheme#AdminTheme'],
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
    Blog,
    People,
    Media,
    // Careers
    Jobs,
    JobApplications,
    // Inbox (public form submissions)
    Leads,
    ContactMessages,
    // Sales
    Proposals,
    // Security
    LoginEvents,
    // Internal — never rendered (ADR-0004)
    OperatingBases,
    // System
    Users,
  ],
  globals: [
    OrgProfile,
    HomeContent,
    ServicesPage,
    SeoDefaults,
    Integrations,
    LeadRouting,
    SalesMessages,
    ScheduleSettings,
  ],

  // Public JSON endpoints served by the origin (mounted under /api): quote, search,
  // track. On the DigitalOcean origin these replace the old Cloudflare Functions.
  endpoints: publicEndpoints,

  // Media uploads → Cloudinary (signed server-side). Images are served from Cloudinary's
  // CDN and resized/format-converted on delivery via URL transforms. Enabled only when
  // the Cloudinary secrets are set; otherwise Media stays on local disk.
  plugins: cloudinaryEnabled
    ? [
        cloudStoragePlugin({
          collections: {
            media: {
              adapter: cloudinaryStorageAdapter({
                cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
                apiKey: process.env.CLOUDINARY_API_KEY!,
                apiSecret: process.env.CLOUDINARY_API_SECRET!,
                folder: process.env.CLOUDINARY_FOLDER || 'mrpackermover',
              }),
              disableLocalStorage: true,
              // Media is public (published crew/city photos), so skip the /api/media proxy
              // and link straight to Cloudinary's CDN.
              disablePayloadAccessControl: true,
            },
          },
        }),
      ]
    : [],

  graphQL: { disable: true },
  sharp: (await import('sharp')).default,
});
