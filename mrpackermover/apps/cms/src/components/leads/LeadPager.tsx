'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useDocumentInfo } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';
import { LIST_MEMORY_KEY } from './LeadListMemory.js';

/**
 * ‹ 3 of 120 › on an open lead: the previous and next lead, without going back to the list.
 *
 * It walks the list the person came from. LeadListMemory saves the Leads list's own
 * `where` and `sort` from the URL; this sends the same two parameters to the REST API, so
 * the order here is the order on screen there, and "next" after filtering to Quoted is the
 * next Quoted lead. Opened any other way (a link, the dashboard) it walks every lead the
 * person can see, newest first - the list's own default.
 *
 * Access is the collection's: the request runs as the signed-in user, so a salesperson
 * steps through their own leads and never lands on somebody else's.
 *
 * The buttons are links, so Payload's "leave without saving?" guard still catches a move
 * away from unsaved edits; the [ and ] keys press the same links for the same reason.
 */

interface Row {
  id: string | number;
  name?: string;
}
interface Walk {
  rows: Row[];
  filtered: boolean;
}

/** Ids only, kept for a minute, so stepping through ten leads is one fetch, not ten. */
const cache = new Map<string, { at: number; walk: Walk }>();
const TTL = 60_000;
const CAP = 5000;

function savedList(): { api: string; search: string; filtered: boolean } {
  let saved = '';
  try {
    saved = sessionStorage.getItem(LIST_MEMORY_KEY) ?? '';
  } catch {
    /* no storage: walk everything */
  }
  const sp = new URLSearchParams(saved);
  const out = new URLSearchParams();
  for (const [k, v] of sp) if (k.startsWith('where[') || k === 'sort') out.append(k, v);
  if (!out.has('sort')) out.set('sort', '-createdAt');
  const search = (sp.get('search') ?? '').trim().toLowerCase();
  const filtered = [...out.keys()].some((k) => k.startsWith('where[')) || Boolean(search);
  return { api: out.toString(), search, filtered };
}

async function load(api: string, search: string, filtered: boolean): Promise<Walk> {
  const key = `${api}|${search}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.walk;
  const res = await fetch(
    `/api/leads?${api}&depth=0&limit=${CAP}&pagination=false&select[name]=true`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error(String(res.status));
  const docs = ((await res.json()) as { docs?: Row[] }).docs ?? [];
  // The list's search box is not a REST parameter; it matches the name, so match it here.
  const rows = search ? docs.filter((d) => (d.name ?? '').toLowerCase().includes(search)) : docs;
  const walk = { rows, filtered };
  cache.set(key, { at: Date.now(), walk });
  return walk;
}

const href = (id: string | number): string => `/admin/collections/leads/${id}`;

export function LeadPager(): React.JSX.Element | null {
  const { id } = useDocumentInfo();
  const [state, setState] = useState<{ walk: Walk; index: number } | null>(null);
  const prevRef = useRef<HTMLAnchorElement>(null);
  const nextRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (id == null) return;
    let live = true;
    const run = async (): Promise<void> => {
      const list = savedList();
      let walk = await load(list.api, list.search, list.filtered);
      let index = walk.rows.findIndex((r) => String(r.id) === String(id));
      // Opened from a filter it no longer matches (its stage was just changed, say):
      // fall back to every lead rather than showing no way forward at all.
      if (index < 0 && list.filtered) {
        walk = await load('sort=-createdAt', '', false);
        index = walk.rows.findIndex((r) => String(r.id) === String(id));
      }
      if (live) setState(index < 0 ? null : { walk, index });
    };
    run().catch(() => live && setState(null));
    return () => {
      live = false;
    };
  }, [id]);

  // [ and ] step back and forward, unless the person is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === '[') prevRef.current?.click();
      if (e.key === ']') nextRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (id == null || !state) return null;
  const { walk, index } = state;
  const prev = walk.rows[index - 1];
  const next = walk.rows[index + 1];
  const nameOf = (r: Row): string => (r.name ?? '').trim() || 'Unnamed lead';

  return (
    <nav className="mpm-pager" aria-label="Move between leads">
      <style>{PAGER_CSS}</style>
      {prev ? (
        <Link
          ref={prevRef}
          className="mpm-pager__btn"
          href={href(prev.id)}
          title={`Previous lead: ${nameOf(prev)}  ( [ )`}
          aria-label={`Previous lead: ${nameOf(prev)}`}
        >
          <MIcon name="chevron_left" size={22} />
        </Link>
      ) : (
        <span className="mpm-pager__btn is-off" aria-hidden="true">
          <MIcon name="chevron_left" size={22} />
        </span>
      )}
      <span
        className="mpm-pager__pos"
        title={
          walk.filtered
            ? 'Position in the filtered Leads list you came from'
            : 'Position among all your leads, newest first'
        }
      >
        {(index + 1).toLocaleString('en-IN')}
        <span> of {walk.rows.length.toLocaleString('en-IN')}</span>
        {walk.filtered && <em>filtered</em>}
      </span>
      {next ? (
        <Link
          ref={nextRef}
          className="mpm-pager__btn"
          href={href(next.id)}
          title={`Next lead: ${nameOf(next)}  ( ] )`}
          aria-label={`Next lead: ${nameOf(next)}`}
        >
          <MIcon name="chevron_right" size={22} />
        </Link>
      ) : (
        <span className="mpm-pager__btn is-off" aria-hidden="true">
          <MIcon name="chevron_right" size={22} />
        </span>
      )}
    </nav>
  );
}

const PAGER_CSS = `
.mpm-pager{
  display:inline-flex; align-items:center; gap:2px; height:40px; padding:0 4px;
  border:1px solid var(--mpm-line,#E1E3E1); border-radius:999px; background:var(--mpm-paper,#fff);
  margin-inline-end:8px; flex:none;
}
.mpm-pager__btn{
  display:grid; place-items:center; width:32px; height:32px; border-radius:50%;
  color:var(--mpm-ink-2,#444746); text-decoration:none; transition:background .12s, color .12s;
}
a.mpm-pager__btn:hover{ background:var(--mpm-hover,rgba(31,31,31,.08)); color:var(--mpm-ink,#1F1F1F); }
a.mpm-pager__btn:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:1px; }
.mpm-pager__btn.is-off{ opacity:.3; }
.mpm-pager__pos{
  display:inline-flex; align-items:baseline; gap:4px; padding:0 6px; white-space:nowrap;
  font-size:13px; font-weight:600; color:var(--mpm-ink,#1F1F1F); font-variant-numeric:tabular-nums;
}
.mpm-pager__pos span{ font-weight:400; color:var(--mpm-ink-3,#747775); }
.mpm-pager__pos em{
  font-style:normal; font-size:11px; font-weight:600; color:var(--mpm-on-sel,#041E49);
  background:var(--mpm-sel,#D3E3FD); border-radius:999px; padding:1px 7px; margin-left:2px;
}
@media (max-width:640px){
  .mpm-pager{ height:36px; }
  .mpm-pager__pos em{ display:none; }
}
`;
