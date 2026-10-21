'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';
import { statusMeta } from '../dashboard/lead-status.js';
import type { LostRow } from '../../lib/lost-by.js';

/**
 * "Leads you lost", above a salesperson's Leads list.
 *
 * A lead they lost and that was handed to a colleague is not theirs any more, so it
 * leaves their list - but it is still their loss, and it still counts as Lost in their
 * review. Without this they would see the number and not the leads behind it.
 *
 * Read-only and deliberately thin (see lib/lost-by.ts): the customer's name, the stage
 * they lost it at, and when it moved on. Nothing opens, and there is no phone number,
 * because the customer now has someone else on the case.
 *
 * Closed by default, one line high, and absent altogether when there is nothing to show
 * or for anyone but a salesperson - admins and handlers already see every lead.
 */
const day = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

export function LostByMe(): React.JSX.Element | null {
  const { user } = useAuth();
  const sales = (user as { role?: string } | null)?.role === 'sales';
  const [rows, setRows] = useState<LostRow[] | null>(null);

  useEffect(() => {
    if (!sales) return undefined;
    let alive = true;
    void (async () => {
      try {
        const res = await fetch('/api/leads/lost-by-me', { credentials: 'include' });
        if (!res.ok) return;
        const json = (await res.json()) as { rows?: LostRow[] };
        if (alive) setRows(json.rows ?? []);
      } catch {
        // Offline or refused: the list below still works; this strip just stays away.
      }
    })();
    return () => {
      alive = false;
    };
  }, [sales]);

  if (!sales || !rows?.length) return null;
  return (
    <details className="mpm-lost">
      <style>{CSS}</style>
      <summary>
        <MIcon name="history" size={18} />
        <span className="mpm-lost__t">Leads you lost</span>
        <span className="mpm-lost__n">{rows.length}</span>
        <span className="mpm-lost__hint">handed on · still counted as Lost for you</span>
        <MIcon name="keyboard_arrow_down" size={20} className="mpm-lost__chev" />
      </summary>
      <ul className="mpm-lost__list">
        {rows.map((r, i) => {
          const s = statusMeta(r.from);
          return (
            <li key={i}>
              <span className="mpm-lost__name">{r.name}</span>
              <span className="mpm-lost__stage" style={{ ['--c' as string]: s.color }}>
                {s.label}
              </span>
              <span className="mpm-lost__when">
                {r.backWithYou ? 'back with you' : `handed on ${day(r.at)}`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mpm-lost__fine">
        For your record only. A lead with a colleague does not open here; one back with you is in
        your list below.
      </p>
    </details>
  );
}

const CSS = `
.mpm-lost{ margin:0 0 14px; border:1px solid var(--mpm-line,#E3E3E3); border-radius:12px;
  background:var(--mpm-paper,#fff); font-family:var(--mpm-font); }
.mpm-lost > summary{ display:flex; align-items:center; gap:8px; min-height:44px; padding:0 14px;
  cursor:pointer; list-style:none; color:var(--mpm-ink); font-size:14px; }
.mpm-lost > summary::-webkit-details-marker{ display:none; }
.mpm-lost > summary:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:-2px; border-radius:12px; }
.mpm-lost > summary .m-icon{ flex:none; color:var(--mpm-ink-2); }
.mpm-lost__t{ font-weight:500; }
.mpm-lost__n{ min-width:22px; padding:1px 7px; border-radius:999px; text-align:center; font-size:12px; font-weight:500;
  background:color-mix(in srgb, var(--mpm-danger,#B3261E) 12%, transparent); color:var(--mpm-danger-ink,#8C1D18); }
.mpm-lost__hint{ color:var(--mpm-ink-2); font-size:13px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mpm-lost__chev{ margin-left:auto; transition:transform .15s; }
.mpm-lost[open] .mpm-lost__chev{ transform:rotate(180deg); }
.mpm-lost__list{ margin:0; padding:4px 14px 0; list-style:none; border-top:1px solid var(--mpm-line,#E3E3E3); }
.mpm-lost__list li{ display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:center; gap:12px;
  padding:9px 0; border-bottom:1px solid var(--mpm-line,#E3E3E3); font-size:14px; color:var(--mpm-ink); }
.mpm-lost__list li:last-child{ border-bottom:0; }
.mpm-lost__name{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mpm-lost__stage{ display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--mpm-ink-2); }
.mpm-lost__stage::before{ content:""; width:8px; height:8px; border-radius:50%; background:var(--c); }
.mpm-lost__when{ font-size:12px; color:var(--mpm-ink-2); min-width:92px; text-align:right; }
.mpm-lost__fine{ margin:0; padding:8px 14px 12px; font-size:12px; color:var(--mpm-ink-2); }
@media (max-width:640px){
  .mpm-lost__hint{ display:none; }
  .mpm-lost__list li{ grid-template-columns:minmax(0,1fr) auto; }
  .mpm-lost__when{ grid-column:1 / -1; text-align:left; min-width:0; margin-top:-6px; }
}
@media (prefers-reduced-motion:reduce){ .mpm-lost__chev{ transition:none; } }
`;
