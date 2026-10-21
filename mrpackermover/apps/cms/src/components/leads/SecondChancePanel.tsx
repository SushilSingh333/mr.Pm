'use client';
import { useAllFormFields, useAuth } from '@payloadcms/ui';
import { reduceFieldsToValues } from 'payload/shared';
import { MIcon } from '../icons/MIcon.js';
import {
  REVIEW_BUCKETS,
  isUnworkedSecondChance,
  personCase,
  statusMeta,
  type SecondChanceRow,
} from '../dashboard/lead-status.js';

/**
 * "Second chance", in the sidebar of a lead that was lost and handed on as fresh - for
 * admins and handlers only. It says where the lead stands in the numbers (still counted
 * at its lost stage until the new owner works it; then won back, or being worked again)
 * and every time it was lost: the stage, who had it, when, and who gave it the chance.
 *
 * A salesperson never sees it: the fields behind it are not readable to them, and the
 * panel draws nothing without them.
 */

const when = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

export function SecondChancePanel(): React.JSX.Element | null {
  const { user } = useAuth();
  const [fields] = useAllFormFields();
  const role = (user as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'handler') return null;

  const v = reduceFieldsToValues(fields, true) as {
    status?: string;
    revivedAt?: string | null;
    revivedFrom?: string | null;
    secondChances?: SecondChanceRow[] | Record<string, SecondChanceRow> | null;
  };
  const rows: SecondChanceRow[] = Array.isArray(v.secondChances)
    ? v.secondChances
    : Object.values(v.secondChances ?? {});
  // A loss on record without a fresh hand-over (handed on at a chosen stage) shows too.
  if (!v.revivedAt && !rows.length) return null;
  const last = rows.at(-1);
  const unworked = isUnworkedSecondChance({ status: v.status, revivedAt: v.revivedAt });
  const lostLabel = statusMeta(v.revivedFrom ?? last?.from ?? 'lost').label;
  const bucket = REVIEW_BUCKETS.find((b) => b.statuses.includes(String(v.status)))?.key;
  const now = statusMeta(v.status).label;

  const state = unworked
    ? {
        tone: 'wait',
        icon: 'schedule' as const,
        text: `Counts as ${lostLabel} on the dashboards until the new owner works it. To them it is a new lead.`,
      }
    : bucket === 'qualified'
      ? { tone: 'won', icon: 'trophy' as const, text: `Won back on a second chance: now ${now}.` }
      : bucket === 'lost'
        ? {
            tone: 'lost',
            icon: 'close' as const,
            text: `Lost again after its second chance: ${now}.`,
          }
        : { tone: 'work', icon: 'trending_up' as const, text: `Being worked again: now ${now}.` };

  return (
    <section className="mpm-sc" aria-label="Second chance">
      <style>{CSS}</style>
      <p className="mpm-sc__t">
        <MIcon name="refresh" size={18} />
        Second chance
      </p>
      <p className={`mpm-sc__state is-${state.tone}`}>
        <MIcon name={state.icon} size={16} />
        <span>{state.text}</span>
      </p>
      <ol className="mpm-sc__list">
        {rows.map((r, i) => (
          <li key={i}>
            <strong>
              {statusMeta(r.from ?? 'lost').label}
              {r.ownerName ? ` with ${personCase(r.ownerName)}` : ''}
            </strong>
            <span>
              {when(r.at)}
              {r.byName ? ` · second chance by ${personCase(r.byName)}` : ''}
            </span>
          </li>
        ))}
      </ol>
      <p className="mpm-sc__fine">
        Each person above keeps it as lost in their own performance, whatever happens next.
      </p>
    </section>
  );
}

const CSS = `
.mpm-sc{ margin:0 0 18px; padding:14px 16px; border-radius:12px;
  border:1px solid color-mix(in srgb, var(--mpm-ember) 35%, transparent);
  background:color-mix(in srgb, var(--mpm-ember) 7%, var(--mpm-paper)); font-family:var(--mpm-font); }
.mpm-sc__t{ display:flex; align-items:center; gap:8px; margin:0 0 8px; font-family:var(--mpm-font-display);
  font-size:15px; font-weight:500; color:var(--mpm-ink); }
.mpm-sc__t .m-icon{ color:var(--mpm-ember-ink); }
.mpm-sc__state{ display:flex; align-items:flex-start; gap:8px; margin:0 0 10px; padding:8px 10px; border-radius:8px;
  font-size:13px; line-height:1.45; color:var(--mpm-ink); background:var(--mpm-paper); }
.mpm-sc__state .m-icon{ flex:none; margin-top:1px; }
.mpm-sc__state.is-wait .m-icon{ color:var(--mpm-ember-ink); }
.mpm-sc__state.is-won{ background:color-mix(in srgb, var(--mpm-ok) 12%, var(--mpm-paper)); }
.mpm-sc__state.is-won .m-icon{ color:var(--mpm-ok-ink); }
.mpm-sc__state.is-lost .m-icon{ color:var(--mpm-danger-ink); }
.mpm-sc__state.is-work .m-icon{ color:var(--mpm-v-500); }
.mpm-sc__list{ margin:0; padding:0 0 0 18px; display:grid; gap:6px; font-size:13px; color:var(--mpm-ink); }
.mpm-sc__list li span{ display:block; font-size:12px; color:var(--mpm-ink-2); }
.mpm-sc__fine{ margin:10px 0 0; font-size:12px; color:var(--mpm-ink-2); }
`;
