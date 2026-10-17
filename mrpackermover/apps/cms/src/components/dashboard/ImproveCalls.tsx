import type { Payload } from 'payload';
import Link from 'next/link';
import { MIcon } from '../icons/MIcon.js';
import { REVIEW_BUCKETS, personCase, statusMeta } from './lead-status.js';
import { ReminderSwitch } from './ImproveReminder.js';

/**
 * "Leads that need an improvement call" - the first thing on a handler's or a
 * salesperson's dashboard.
 *
 * These are the review's "Needs improvement" slice (Contacted, Follow up, Call later):
 * customers who have been spoken to and are still warm, but have not been given a price.
 * They are the leads coaching can move, and the ones that quietly go cold when nobody
 * rings back, so the board leads with them.
 *
 * Every date is ignored on purpose. The board's own date range answers "what came in this
 * month"; this card answers "who is owed a call", and a warm lead from last month is owed
 * one just as much. It is the same rule as the stage buttons otherwise: role-scoped (a
 * salesperson sees their own), run through the access layer, and every number is a link
 * into the board below with that filter applied.
 *
 * The reminder that repeats while these are waiting is ImproveReminder, in the sidebar.
 */

/** The review's "Needs improvement" stages. */
export const IMPROVE_STAGES: string[] =
  REVIEW_BUCKETS.find((b) => b.key === 'improve')?.statuses ?? [];

/** Untouched this long and a warm lead is going cold. */
const STALE_MS = 48 * 3600 * 1000;

type Row = {
  status?: string | null;
  updatedAt?: string;
  assignedTo?: string | number | { id?: string | number } | null;
};

const idOf = (v: Row['assignedTo']): string =>
  v && typeof v === 'object' ? String(v.id ?? '') : v ? String(v) : '';

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'within the hour';
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export async function ImproveCalls({
  payload,
  user,
  isHandler,
  boardHref,
}: {
  payload: Payload;
  user: { id?: string | number; role?: string };
  isHandler: boolean;
  /** A link into the board below: the filter (and, for a handler, an owner) applied. */
  boardHref: (filter: string, owner?: string) => string;
}): Promise<React.JSX.Element | null> {
  let rows: Row[] = [];
  try {
    const res = await payload.find({
      collection: 'leads',
      where: {
        and: [
          ...(isHandler ? [] : [{ assignedTo: { equals: user.id } }]),
          { status: { in: IMPROVE_STAGES } },
        ],
      } as never,
      limit: 2000,
      pagination: false,
      depth: 0,
      overrideAccess: false,
      user: user as never,
      select: { status: true, updatedAt: true, assignedTo: true } as never,
    });
    rows = res.docs as Row[];
  } catch {
    return null;
  }

  const total = rows.length;
  const reviewFilter = 'r-improve';

  if (total === 0) {
    return (
      <section className="mpm-imp mpm-imp--clear" aria-label="Improvement calls">
        <style>{CSS}</style>
        <span className="mpm-imp__badge" aria-hidden="true">
          <MIcon name="check" size={22} />
        </span>
        <div className="mpm-imp__body">
          <h2 className="mpm-imp__t">No improvement calls waiting</h2>
          <p className="mpm-imp__d">
            Every warm lead {isHandler ? 'on the team' : 'of yours'} has a price. Nice work.
          </p>
        </div>
      </section>
    );
  }

  const now = Date.now();
  const stale = rows.filter((r) => r.updatedAt && now - new Date(r.updatedAt).getTime() > STALE_MS);
  const oldest = rows
    .map((r) => r.updatedAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  const byStage = IMPROVE_STAGES.map((s) => ({
    value: s,
    ...statusMeta(s),
    count: rows.filter((r) => r.status === s).length,
  })).filter((s) => s.count > 0);

  // A handler chases people, not leads: who is holding how many.
  let byOwner: { id: string; name: string; count: number }[] = [];
  if (isHandler) {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(idOf(r.assignedTo), (counts.get(idOf(r.assignedTo)) ?? 0) + 1);
    const ids = [...counts.keys()].filter(Boolean);
    const names = new Map<string, string>();
    if (ids.length) {
      try {
        const u = await payload.find({
          collection: 'users',
          where: { id: { in: ids } } as never,
          limit: ids.length,
          depth: 0,
          overrideAccess: true,
          select: { name: true, email: true } as never,
        });
        for (const d of u.docs as { id: string | number; name?: string; email?: string }[]) {
          names.set(String(d.id), personCase(d.name || d.email || 'Someone'));
        }
      } catch {
        /* names are a nicety; the counts still stand */
      }
    }
    byOwner = [...counts.entries()]
      .map(([id, count]) => ({ id, count, name: id ? (names.get(id) ?? 'Someone') : 'Nobody yet' }))
      .sort((a, b) => b.count - a.count);
  }

  const urgent = stale.length > 0;

  return (
    <section
      className={`mpm-imp${urgent ? ' is-urgent' : ''}`}
      aria-labelledby="mpm-imp-t"
      data-improve-count={total}
    >
      <style>{CSS}</style>
      <span className="mpm-imp__badge" aria-hidden="true">
        <MIcon name="phone_in_talk" size={24} />
      </span>

      <div className="mpm-imp__body">
        <h2 className="mpm-imp__t" id="mpm-imp-t">
          <strong>{total}</strong> {total === 1 ? 'lead needs' : 'leads need'} an improvement call
        </h2>
        <p className="mpm-imp__d">
          Spoken to and still warm, but no price yet. Call {total === 1 ? 'it' : 'each one'} back
          today and move {total === 1 ? 'it' : 'them'} to a quote, before{' '}
          {total === 1 ? 'it goes' : 'they go'} cold.
        </p>

        {(urgent || oldest) && (
          <p className="mpm-imp__warn">
            {urgent && (
              <span className="mpm-imp__hot">
                <MIcon name="schedule" size={16} />
                {stale.length} not touched for 2 days or more
              </span>
            )}
            {oldest && <span className="mpm-imp__muted">Oldest last touched {ago(oldest)}</span>}
          </p>
        )}

        <div className="mpm-imp__chips" role="group" aria-label="By stage">
          {byStage.map((s) => (
            <Link
              key={s.value}
              className="mpm-imp__chip"
              href={boardHref(s.value)}
              style={{ ['--chip' as string]: s.color } as React.CSSProperties}
            >
              {s.label} <b>{s.count}</b>
            </Link>
          ))}
        </div>

        {isHandler && byOwner.length > 0 && (
          <div className="mpm-imp__owners" role="group" aria-label="By salesperson">
            <span className="mpm-imp__k">Who is holding them</span>
            <div className="mpm-imp__chips">
              {byOwner.map((o) => (
                <Link
                  key={o.id || 'none'}
                  className={`mpm-imp__chip mpm-imp__chip--owner${o.id ? '' : ' is-none'}`}
                  href={boardHref(reviewFilter, o.id || 'none')}
                >
                  {o.name} <b>{o.count}</b>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mpm-imp__act">
        <Link className="mpm-imp__btn" href={boardHref(reviewFilter)}>
          <MIcon name="call" size={18} />
          Call them now
        </Link>
        <ReminderSwitch />
      </div>
    </section>
  );
}

const CSS = `
.mpm-imp{ position:relative; display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:16px 20px;
  align-items:start; margin:0 0 20px; padding:20px 24px; border-radius:20px;
  background:color-mix(in srgb, var(--mpm-ember) 9%, var(--mpm-paper));
  border:1px solid color-mix(in srgb, var(--mpm-ember) 35%, transparent); color:var(--mpm-ink);
  font-family:var(--mpm-font); }
.mpm-imp__badge{ position:relative; display:grid; place-items:center; width:48px; height:48px; border-radius:50%;
  background:var(--mpm-ember); color:#fff; }
html[data-theme="dark"] .mpm-imp__badge{ color:#1f1f1f; }
/* A ring that keeps going out from the phone while something has gone cold: the one
   moving thing on the board, so it is the thing the eye goes to. */
.mpm-imp.is-urgent .mpm-imp__badge::after{ content:""; position:absolute; inset:0; border-radius:50%;
  box-shadow:0 0 0 0 color-mix(in srgb, var(--mpm-ember) 55%, transparent);
  animation:mpm-imp-ring 2.2s ease-out infinite; }
@keyframes mpm-imp-ring{ 0%{ box-shadow:0 0 0 0 color-mix(in srgb, var(--mpm-ember) 55%, transparent); }
  100%{ box-shadow:0 0 0 16px transparent; } }
.mpm-imp__t{ margin:2px 0 0; font-family:var(--mpm-font-display); font-size:20px; font-weight:400; line-height:1.3; }
.mpm-imp__t strong{ font-weight:600; }
.mpm-imp__d{ margin:6px 0 0; font-size:14px; line-height:1.5; color:var(--mpm-ink-2); max-width:60ch; }
.mpm-imp__warn{ display:flex; flex-wrap:wrap; align-items:center; gap:6px 14px; margin:10px 0 0; font-size:13px; }
.mpm-imp__hot{ display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:8px; font-weight:500;
  background:color-mix(in srgb, var(--mpm-ember) 18%, transparent); color:var(--mpm-ember-ink); }
.mpm-imp__muted{ color:var(--mpm-ink-2); }
.mpm-imp__chips{ display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.mpm-imp__chip{ display:inline-flex; align-items:center; gap:8px; height:32px; padding:0 12px; border-radius:8px;
  border:1px solid var(--mpm-line); background:var(--mpm-paper); color:var(--mpm-ink); text-decoration:none;
  font-size:13px; font-weight:500; }
.mpm-imp__chip::before{ content:""; width:8px; height:8px; border-radius:50%; background:var(--chip, var(--mpm-v-500)); }
.mpm-imp__chip--owner::before{ display:none; }
.mpm-imp__chip.is-none{ border-style:dashed; }
.mpm-imp__chip b{ font-weight:600; font-variant-numeric:tabular-nums; }
.mpm-imp__chip:hover{ background:var(--mpm-hover); }
.mpm-imp__chip:focus-visible, .mpm-imp__btn:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px; }
.mpm-imp__owners{ margin-top:14px; }
.mpm-imp__owners .mpm-imp__chips{ margin-top:6px; }
.mpm-imp__k{ font-size:12px; font-weight:500; color:var(--mpm-ink-2); }
.mpm-imp__act{ display:grid; gap:8px; justify-items:end; }
.mpm-imp__btn{ display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 20px 0 16px; border-radius:999px;
  background:var(--mpm-grad); color:#fff; text-decoration:none; white-space:nowrap;
  font-family:var(--mpm-font-display); font-size:14px; font-weight:500; }
.mpm-imp__btn:hover{ filter:brightness(1.06); box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); }

.mpm-imp--clear{ grid-template-columns:auto minmax(0,1fr); align-items:center; padding:14px 20px;
  background:color-mix(in srgb, var(--mpm-ok) 8%, var(--mpm-paper)); border-color:color-mix(in srgb, var(--mpm-ok) 30%, transparent); }
.mpm-imp--clear .mpm-imp__badge{ width:36px; height:36px; background:var(--mpm-ok); }
.mpm-imp--clear .mpm-imp__t{ font-size:16px; margin:0; }
.mpm-imp--clear .mpm-imp__d{ margin-top:2px; }

@media (max-width:760px){
  .mpm-imp{ grid-template-columns:auto minmax(0,1fr); padding:16px; }
  .mpm-imp__act{ grid-column:1 / -1; justify-items:stretch; }
  .mpm-imp__btn{ justify-content:center; height:44px; }
  .mpm-imp__t{ font-size:18px; }
}
@media (prefers-reduced-motion:reduce){ .mpm-imp.is-urgent .mpm-imp__badge::after{ animation:none; } }
`;
