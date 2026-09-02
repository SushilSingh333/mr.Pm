/**
 * CMS-driven title/description resolution (Doc 02 §9).
 *
 * Three layers, most specific wins:
 *
 *   1. per-record override   — what an editor typed on this exact page
 *   2. global template       — "Packers and Movers in {city} – {brand}", set once
 *                              in Settings → SEO defaults, applies to a page type
 *   3. code fallback         — the hardcoded functions in ./meta.js
 *
 * A template resolves ONLY when every token it uses has a value. A city with no
 * price data does not get "from ₹undefined" — it drops to the next layer and, if
 * that yields nothing, ships no description at all. That is deliberate: a missing
 * meta description beats a broken or duplicated one (same rule as `cityServiceMeta`).
 */
import { TITLE_MAX, META_MAX } from './meta.js';

/** Values a template can interpolate. `undefined` marks the token unavailable. */
export type Tokens = Record<string, string | number | undefined | null>;

export interface SeoTemplate {
  titleTemplate?: string | null;
  descriptionTemplate?: string | null;
}

export interface SeoOverride {
  metaTitle?: string | null;
  metaDescription?: string | null;
}

const TOKEN = /\{(\w+)\}/g;

/** The token names a template references, in order of first appearance. */
export function tokensUsed(template: string): string[] {
  return [...new Set([...template.matchAll(TOKEN)].map((m) => m[1]!))];
}

/** True when the template interpolates at least one token. */
export function hasToken(template: string): boolean {
  return tokensUsed(template).length > 0;
}

/**
 * Fill a template. Returns undefined if the template is blank or ANY token it uses
 * has no value — never a partially-filled string.
 */
export function fillTemplate(
  template: string | null | undefined,
  tokens: Tokens,
): string | undefined {
  if (!template || !template.trim()) return undefined;
  let missing = false;
  const filled = template.replace(TOKEN, (_match, key: string) => {
    const value = tokens[key];
    if (value === undefined || value === null || value === '') {
      missing = true;
      return '';
    }
    return typeof value === 'number' ? value.toLocaleString('en-IN') : value;
  });
  if (missing) return undefined;
  const text = filled.replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : undefined;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Hard-clamp to the manifest schema's ceiling so a long override cannot fail the build. */
function cap(text: string | undefined, max: number): string | undefined {
  if (text === undefined) return undefined;
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export interface ResolveInput {
  /** What an editor typed on this record. Wins over everything. */
  override?: SeoOverride | null;
  /** The page-type template from the SEO defaults global. */
  template?: SeoTemplate | null;
  /** Values for the template's tokens. */
  tokens?: Tokens;
  /** The existing hardcoded result — the floor, so nothing regresses. */
  fallbackTitle: string;
  fallbackDescription?: string | undefined;
}

/**
 * Resolve one page's title + description through the three layers.
 * Title always resolves (the code fallback is required); description may be undefined.
 */
export function resolveSeo(input: ResolveInput): {
  title: string;
  metaDescription: string | undefined;
} {
  const { override, template, tokens = {}, fallbackTitle, fallbackDescription } = input;

  const title =
    firstNonEmpty(
      override?.metaTitle,
      fillTemplate(template?.titleTemplate, tokens),
      fallbackTitle,
    ) ?? fallbackTitle;

  const metaDescription = firstNonEmpty(
    override?.metaDescription,
    fillTemplate(template?.descriptionTemplate, tokens),
    fallbackDescription,
  );

  return {
    // The manifest schema caps title at 70 and description at 180; clamp rather than
    // throw, so a too-long override degrades instead of breaking the whole build.
    title: cap(title, 70)!,
    metaDescription: cap(metaDescription, 180),
  };
}

export { TITLE_MAX, META_MAX };
