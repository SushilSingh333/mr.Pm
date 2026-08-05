import type { ManifestRow, ManifestLink, PageType, Org } from '@mpm/shared';
import { manifest } from '../data/manifest.js';

/**
 * Build a synthetic ManifestRow for a *standalone* page (About, Terms, Blog, …)
 * that is authored in-repo rather than generated from the CMS manifest.
 *
 * These pages still flow through BaseLayout → Seo, so they need the same head
 * contract as manifest pages: a self-referencing canonical (from the origin, never
 * the request), a title, and breadcrumbs. Everything else defaults sanely.
 */
const ORIGIN = manifest().siteOrigin.replace(/\/$/, '');

export interface StaticRowInput {
  path: string;
  title: string;
  h1: string;
  metaDescription?: string;
  pageType?: PageType;
  noindex?: boolean;
  breadcrumbs?: ManifestLink[];
  data?: Record<string, unknown>;
}

export function staticRow(input: StaticRowInput): ManifestRow {
  const { path } = input;
  return {
    pageType: input.pageType ?? 'core',
    path,
    canonical: path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}`,
    slug: path.split('/').filter(Boolean).pop() ?? '',
    sitemapShard: 'core',
    cacheTag: input.pageType ?? 'core',
    lastmod: manifest().generatedAt,
    title: input.title,
    metaDescription: input.metaDescription,
    h1: input.h1,
    noindex: input.noindex ?? false,
    inboundLinks: [],
    relatedLinks: [],
    breadcrumbs: input.breadcrumbs ?? [{ path: '/', anchor: 'Home' }],
    data: input.data ?? {},
  };
}

/** The single legal identity (ADR-0004). Used across company/legal pages. */
export function org(): Org | undefined {
  return manifest().org;
}
