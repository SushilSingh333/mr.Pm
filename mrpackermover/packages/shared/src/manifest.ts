import { z } from 'zod';
import { PAGE_TYPES } from './constants.js';

/**
 * The build manifest — the single source of truth (Doc 02 §1).
 *
 * `scripts/build-manifest.ts` runs the publish gate and emits one row per URL.
 * Astro's getStaticPaths, the sitemap shards, and the internal-link graph all
 * read from this file, so they cannot drift. Nothing renders a URL that is not
 * a row here; there is no fallback route.
 */

export const linkSchema = z.object({
  path: z.string(),
  anchor: z.string(),
  /** Grouping for related-link blocks (e.g. "siblings", "services", "routes", "guides"). */
  group: z.string().optional(),
  /** Optional Cloudinary image URL (e.g. a city card thumbnail); absent ⇒ static fallback. */
  image: z.string().optional(),
});
export type ManifestLink = z.infer<typeof linkSchema>;

export const manifestRowSchema = z.object({
  pageType: z.enum(PAGE_TYPES),

  /** Canonical relative path, lowercase, no trailing slash (built via `paths`). */
  path: z.string().regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/, 'invalid canonical path'),

  /** Absolute self-referencing canonical, from the manifest, never from the request. */
  canonical: z.string().url(),

  slug: z.string(),
  sitemapShard: z.string(),
  cacheTag: z.string(),

  /** Real updated_at from Postgres (W3C datetime) — never the build timestamp. */
  lastmod: z.string().datetime(),

  /** Head. Title ≤ 60 chars; meta 140–160 or omitted (a missing meta beats a duplicate one). */
  title: z.string().max(70),
  metaDescription: z.string().max(180).optional(),
  h1: z.string(),

  /** Default is index,follow. Emit noindex explicitly only where needed. */
  noindex: z.boolean().default(false),

  /** Precomputed in Postgres (Doc 02 §7). CI asserts length ≥ 3 for published pages. */
  inboundLinks: z.array(linkSchema).default([]),
  relatedLinks: z.array(linkSchema).default([]),
  breadcrumbs: z.array(linkSchema).default([]),

  /**
   * Page-type-specific render payload (rate cards, jobs_stats, reviews, faqs,
   * local operational notes, ...). Loosely typed at the manifest boundary; each
   * template narrows it. Kept as data (not prebuilt HTML) so JSON-LD and visible
   * markup are built from the same source and cannot disagree.
   */
  data: z.record(z.string(), z.unknown()).default({}),
});
export type ManifestRow = z.infer<typeof manifestRowSchema>;

/** The single legal identity (ADR-0004), carried once for Organization JSON-LD + footer. */
export const orgSchema = z.object({
  brandName: z.string(),
  legalName: z.string(),
  gstin: z.string(),
  cin: z.string(),
  yearsOperating: z.number(),
  insurancePartner: z.string().optional(),
  registeredOffice: z.string(),
  complaintSla: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  sameAs: z.array(z.string()).default([]),
});
export type Org = z.infer<typeof orgSchema>;

/** A careers posting (open role), rendered on /company/careers. */
export const jobSchema = z.object({
  title: z.string(),
  slug: z.string(),
  team: z.string().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  summary: z.string(),
});
export type JobPosting = z.infer<typeof jobSchema>;

/** A blog post (from the CMS `posts` collection), rendered on /blog. */
export const blogPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: z.string(),
  author: z.string(),
  /** ISO date (W3C) shown on the article and used to sort newest-first. */
  date: z.string(),
  readMins: z.number(),
  /** Cover image URL — a Cloudinary delivery URL or a static /images/... fallback. */
  cover: z.string(),
  coverAlt: z.string(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  /** Rendered HTML body (from the CMS rich-text renderer or authored in-repo). */
  body: z.string(),
  /** Per-post SEO overrides; blank falls back to the headline and excerpt. */
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});
export type BlogPost = z.infer<typeof blogPostSchema>;

/** CMS-editable copy for a hand-built editorial page, keyed by page key. */
export const editorialSchema = z.object({
  title: z.string().optional(),
  /** Meta title override; blank falls back to the page's built-in title. */
  metaTitle: z.string().optional(),
  eyebrow: z.string().optional(),
  intro: z.string().optional(),
  bodyHtml: z.string().optional(),
  seoDescription: z.string().optional(),
});
export type EditorialContent = z.infer<typeof editorialSchema>;

export const manifestSchema = z.object({
  generatedAt: z.string().datetime(),
  siteOrigin: z.string().url(),
  org: orgSchema.optional(),
  jobs: z.array(jobSchema).default([]),
  /** Editable copy for the hand-built editorial pages, keyed by page key. */
  editorial: z.record(z.string(), editorialSchema).default({}),
  /**
   * Editorial page keys the CMS has explicitly unpublished. The footer and header
   * drop their links, and the route de-indexes itself. Keys absent here fall back to
   * built-in copy and stay visible — so this is "unpublished", not merely "unset".
   */
  hiddenPages: z.array(z.string()).default([]),
  /** Blog posts (from the CMS `posts` collection), newest-first ordering applied by the site. */
  blog: z.array(blogPostSchema).default([]),
  pages: z.array(manifestRowSchema),
});
export type Manifest = z.infer<typeof manifestSchema>;

/** Parse + validate a manifest file (used by the build and the CI gates). */
export function parseManifest(raw: unknown): Manifest {
  return manifestSchema.parse(raw);
}
