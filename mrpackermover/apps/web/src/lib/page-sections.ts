import type { ServiceSection } from '@mpm/shared';

/**
 * Anchors for a page's sections and its "On this page" list, shared by the service,
 * city and locality pages so they number and link their sections the same way.
 */
export type AnchoredSection = ServiceSection & { id: string };

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

/** Each headed section gets an id from its heading; repeats get a suffix. */
export function withIds(sections: ServiceSection[]): AnchoredSection[] {
  const used = new Set<string>();
  return sections.map((s) => {
    let id = s.heading ? slugify(s.heading) : '';
    while (id && used.has(id)) id += '-2';
    if (id) used.add(id);
    return { ...s, id };
  });
}

/** The sidebar list: the headed sections, in order. */
export const tocOf = (sections: AnchoredSection[]): { id: string; label: string }[] =>
  sections.filter((s) => s.heading).map((s) => ({ id: s.id, label: s.heading }));

/**
 * White or tinted for each band after the sections, carrying on their alternation (the
 * first section is white, the next tinted, and so on). Call it once per band actually
 * shown, in page order.
 */
export function bandTones(sectionCount: number): () => 'white' | 'tint' {
  let n = sectionCount;
  return () => (n++ % 2 === 0 ? 'white' : 'tint');
}
