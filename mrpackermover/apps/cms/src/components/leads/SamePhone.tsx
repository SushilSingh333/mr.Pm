'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';
import { ownerName, personCase, statusMeta } from '../dashboard/lead-status.js';

/**
 * "This number is on 2 other leads" - under the phone number on an open lead.
 *
 * The Duplicate stage is only as good as somebody noticing the duplicate, and nobody
 * remembers every number that came in last week. The same customer fills the quote form
 * on Monday and the price check on Tuesday, or a Facebook ad retries, and two salespeople
 * end up ringing one family. So the lead says so itself: the other leads on this number,
 * oldest first (the oldest is the original), each with its stage and owner and a link -
 * and, when this one is the later arrival, a button that marks it Duplicate. The button
 * only sets the field; nothing changes until the lead is saved, like every other edit.
 *
 * Matching is on the last ten digits, so "+91 98765 43210", "919876543210" and
 * "9876543210" are one number. It reads the API as the signed-in person, so a salesperson
 * only ever sees matches among their own leads - the access rule, not this component,
 * decides that.
 */

type Match = {
  id: string | number;
  name?: string | null;
  status?: string | null;
  createdAt?: string | null;
  assignedTo?: { name?: string; email?: string } | string | number | null;
};

/** The last ten digits, or '' when there are not ten to match on. */
export const lastTen = (v: unknown): string => {
  const digits = String(v ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

const SHOWN = 5;

const day = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

export function SamePhone(): React.JSX.Element | null {
  const { id } = useDocumentInfo();
  const phone = useFormFields(([f]) => f?.phone?.value as string | undefined);
  const createdAt = useFormFields(([f]) => f?.createdAt?.value as string | undefined);
  const status = useField<string>({ path: 'status' });
  const key = lastTen(phone);

  const [found, setFound] = useState<{ key: string; docs: Match[]; total: number } | null>(null);

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    // Typing a number fires once it settles, not on every digit.
    const t = setTimeout(() => {
      const where = [`where[and][0][phone][contains]=${key}`];
      if (id) where.push(`where[and][1][id][not_equals]=${encodeURIComponent(String(id))}`);
      void (async () => {
        try {
          const res = await fetch(
            `/api/leads?${where.join('&')}&sort=createdAt&limit=${SHOWN}&depth=1` +
              '&select[name]=true&select[status]=true&select[createdAt]=true&select[assignedTo]=true',
            { credentials: 'include' },
          );
          if (!res.ok) return;
          const json = (await res.json()) as { docs?: Match[]; totalDocs?: number };
          if (alive) setFound({ key, docs: json.docs ?? [], total: json.totalDocs ?? 0 });
        } catch {
          // Offline: no panel, and the lead itself is unaffected.
        }
      })();
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [key, id]);

  // A stale answer for a number that has since been edited is not shown.
  if (!key || !found || found.key !== key || found.total === 0) return null;

  const { docs, total } = found;
  const original = docs[0];
  // Later than the oldest match means this lead is the repeat. An unsaved lead is the
  // newest thing there is.
  const isRepeat = Boolean(
    original?.createdAt && (!createdAt || new Date(original.createdAt) < new Date(createdAt)),
  );
  const current = String(status.value ?? '');
  const canMark = isRepeat && current !== 'duplicate' && current !== 'won';
  const justMarked = current === 'duplicate' && status.initialValue !== 'duplicate';

  return (
    <section className="mpm-same" aria-label="Other leads on this number">
      <style>{CSS}</style>
      <div className="mpm-same__head">
        <MIcon name="content_copy" size={18} className="mpm-same__ico" />
        <span>
          This number is on {total} other lead{total === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="mpm-same__list">
        {docs.map((m) => {
          const meta = statusMeta(m.status ?? undefined);
          const owner = ownerName(m.assignedTo);
          return (
            <li key={String(m.id)}>
              <Link href={`/admin/collections/leads/${m.id}`} className="mpm-same__row">
                <span className="mpm-same__name">{personCase(m.name ?? '') || 'No name'}</span>
                <span
                  className="mpm-same__chip"
                  style={{ ['--chip' as string]: meta.color } as React.CSSProperties}
                >
                  {meta.label}
                </span>
                <span className="mpm-same__meta">
                  {owner ? `${owner} · ` : ''}
                  {day(m.createdAt)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {total > docs.length && (
        <Link
          className="mpm-same__all"
          href={`/admin/collections/leads?where[phone][contains]=${key}`}
        >
          See all {total}
        </Link>
      )}

      {canMark && (
        <div className="mpm-same__act">
          <span>
            Came in after {personCase(original?.name ?? '') || 'the first lead'}&rsquo;s lead of{' '}
            {day(original?.createdAt)}. Same move? Mark this one as the duplicate.
          </span>
          <button
            type="button"
            className="mpm-same__btn"
            onClick={() => status.setValue('duplicate')}
          >
            Mark as duplicate
          </button>
        </div>
      )}
      {justMarked && <p className="mpm-same__done">Marked Duplicate. Save to keep it.</p>}
    </section>
  );
}

const CSS = `
.mpm-same{ margin:-4px 0 18px; padding:12px 14px; border:1px solid var(--mpm-line); border-radius:12px;
  background:var(--mpm-paper); }
.mpm-same__head{ display:flex; align-items:center; gap:8px; font-family:var(--mpm-font-display);
  font-size:14px; font-weight:500; color:var(--mpm-ink); }
.mpm-same__ico{ color:var(--mpm-v-500); flex:none; }
.mpm-same__list{ list-style:none; margin:8px 0 0; padding:0; display:grid; gap:2px; }
.mpm-same__row{ display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:10px;
  min-height:36px; padding:4px 8px; margin:0 -8px; border-radius:8px; text-decoration:none; color:var(--mpm-ink); }
.mpm-same__row:hover{ background:var(--mpm-hover); }
.mpm-same__row:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:-2px; }
.mpm-same__name{ font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-same__chip{ display:inline-flex; align-items:center; gap:6px; padding:2px 10px; border-radius:8px;
  font-size:12px; font-weight:500; white-space:nowrap;
  background:color-mix(in srgb, var(--chip) 13%, transparent);
  color:color-mix(in srgb, var(--chip) 62%, var(--mpm-ink)); }
.mpm-same__chip::before{ content:""; width:6px; height:6px; border-radius:50%; background:var(--chip); }
.mpm-same__meta{ font-size:12px; color:var(--mpm-ink-2); white-space:nowrap; text-align:right; }
.mpm-same__all{ display:inline-block; margin-top:6px; font-size:13px; font-weight:500; color:var(--mpm-v-500); text-decoration:none; }
.mpm-same__all:hover{ text-decoration:underline; }
.mpm-same__act{ display:flex; align-items:center; gap:12px; margin-top:10px; padding-top:10px;
  border-top:1px solid var(--mpm-line); font-size:13px; color:var(--mpm-ink-2); }
.mpm-same__act > span{ flex:1; min-width:0; }
.mpm-same__btn{ flex:none; height:36px; padding:0 16px; border-radius:999px; cursor:pointer;
  border:1px solid var(--mpm-line); background:transparent; color:var(--mpm-v-500);
  font-family:var(--mpm-font-display); font-size:14px; font-weight:500; }
.mpm-same__btn:hover{ background:color-mix(in srgb, var(--mpm-v-500) 8%, transparent); }
.mpm-same__btn:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px; }
.mpm-same__done{ margin:10px 0 0; font-size:13px; font-weight:500; color:var(--mpm-ink); }
@media (max-width:640px){
  .mpm-same__row{ grid-template-columns:minmax(0,1fr) auto; }
  .mpm-same__meta{ grid-column:1 / -1; text-align:left; margin-top:-4px; }
  .mpm-same__act{ flex-direction:column; align-items:stretch; }
  .mpm-same__btn{ height:44px; }
}
`;
