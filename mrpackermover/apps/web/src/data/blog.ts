/**
 * Blog data for the static site. Posts now come from the CMS (`posts` collection) via
 * the build manifest. The in-repo FALLBACK_POSTS below are shown when the manifest has
 * no blog entries (design/CI with no database) and stay visible alongside CMS posts
 * unless a CMS post reuses their slug — so the blog is never empty and adding a post in
 * the CMS is purely additive. Bodies are trusted HTML (the CMS rich-text renderer, or
 * authored here). Covers reuse the self-hosted hero imagery in /public/images/hero.
 */
import { manifest } from './manifest.js';
import type { BlogPost } from '@mpm/shared';
import { FALLBACK_POSTS as SHARED_FALLBACK_POSTS } from '@mpm/shared/blog-fallback';

export type { BlogPost } from '@mpm/shared';
export type BlogCategory = 'Guides' | 'Pricing' | 'Safety' | 'Packing' | 'Business';

export const CATEGORIES: BlogCategory[] = ['Guides', 'Pricing', 'Safety', 'Packing', 'Business'];

const FALLBACK_POSTS: BlogPost[] = SHARED_FALLBACK_POSTS;

/**
 * Posts shown on the site: CMS posts (from the manifest) first, then any in-repo
 * fallback whose slug a CMS post hasn't overridden. Once you publish posts in the CMS
 * they take over; the fallbacks keep the blog populated until then.
 */
const cmsPosts: BlogPost[] = manifest().blog ?? [];
const cmsSlugs = new Set(cmsPosts.map((p) => p.slug));
export const POSTS: BlogPost[] = [
  ...cmsPosts,
  ...FALLBACK_POSTS.filter((p) => !cmsSlugs.has(p.slug)),
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Newest first. */
export function sortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Featured post, else the newest. */
export function featuredPost(): BlogPost {
  return POSTS.find((p) => p.featured) ?? sortedPosts()[0]!;
}

/** Up to `n` posts related to `slug` (same category first, then newest). */
export function relatedPosts(slug: string, n = 3): BlogPost[] {
  const current = getPost(slug);
  const others = sortedPosts().filter((p) => p.slug !== slug);
  if (!current) return others.slice(0, n);
  const sameCat = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);
  return [...sameCat, ...rest].slice(0, n);
}
