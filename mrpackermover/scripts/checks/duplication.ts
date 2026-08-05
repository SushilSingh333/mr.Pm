import { DUPLICATION_CEILING, type ManifestRow } from '@mpm/shared';
import { loadManifest, fail, type CheckResult } from './load.js';

/**
 * Duplication ceiling (Doc 01 §6): for each generated page, compute 8-gram Jaccard
 * similarity against its nearest siblings (same page type) and fail if the median
 * exceeds 0.45. This is the CI enforcement that a template did not become a
 * str_replace farm. The incumbent sits at 0.68.
 */
export function checkDuplication(): CheckResult {
  const m = loadManifest();
  const byType = new Map<string, ManifestRow[]>();
  for (const page of m.pages) {
    const list = byType.get(page.pageType) ?? [];
    list.push(page);
    byType.set(page.pageType, list);
  }

  const messages: string[] = [];
  for (const [type, pages] of byType) {
    if (pages.length < 2) continue; // nothing to compare against
    const grams = pages.map((p) => new Set(eightGrams(pageText(p))));
    for (let i = 0; i < pages.length; i += 1) {
      const others = grams.filter((_, j) => j !== i);
      const sims = others.map((g) => jaccard(grams[i]!, g)).sort((a, b) => a - b);
      const med = median(sims);
      if (med > DUPLICATION_CEILING) {
        messages.push(
          `${pages[i]!.path} (${type}): median sibling similarity ${med.toFixed(2)} > ${DUPLICATION_CEILING}`,
        );
      }
    }
  }
  return fail('duplication-ceiling', messages);
}

/** Flatten the meaningful text of a page for similarity comparison. */
function pageText(page: ManifestRow): string {
  const parts: string[] = [page.h1, page.title, page.metaDescription ?? ''];
  const data = page.data as Record<string, unknown>;
  for (const key of ['editorial', 'overnight'] as const) {
    const arr = data[key];
    if (Array.isArray(arr)) parts.push(...arr.map(String));
  }
  const faqs = data.faqs;
  if (Array.isArray(faqs)) {
    for (const f of faqs as Array<{ question?: string; answer?: string }>) {
      parts.push(f.question ?? '', f.answer ?? '');
    }
  }
  return parts.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
}

function eightGrams(text: string): string[] {
  const words = text.split(' ').filter(Boolean);
  if (words.length < 8) return [words.join(' ')];
  const grams: string[] = [];
  for (let i = 0; i + 8 <= words.length; i += 1) grams.push(words.slice(i, i + 8).join(' '));
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid]! : (nums[mid - 1]! + nums[mid]!) / 2;
}
