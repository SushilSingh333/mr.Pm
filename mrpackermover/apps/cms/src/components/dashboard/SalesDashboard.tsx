import type { Payload } from 'payload';
import Link from 'next/link';
// CSS/ICONS/helpers still come from Dashboard, which imports this file back. That
// cycle is safe only because none of them are touched at module-initialisation time —
// they are read inside the component. The status list is NOT, which is exactly why it
// lives in its own leaf module.
import { CSS, ICONS, fmt, initial, safe, timeAgo } from './Dashboard.js';
import { LEAD_STATUS, exactTime, ownerName, statusMeta } from './lead-status.js';

/**
 * The dashboard the sales hierarchy sees, in two shapes.
 *
 *   handler — a distribution desk. Every lead is visible, the unassigned ones first,
 *             plus how loaded each salesperson currently is so routing is informed.
 *   sales   — a personal queue. Only their own leads: what is new to them, what is
 *             in flight, and what they last touched.
 *
 * WHY THE QUERIES ARE SCOPED BY HAND: Payload's Local API defaults to
 * `overrideAccess: true`, so `payload.find({ collection: 'leads' })` returns EVERY
 * lead regardless of the collection's access rules. A salesperson's dashboard that
 * relied on those rules would quietly leak the whole board while the Leads list beside
 * it stayed correctly restricted. Every query below therefore passes an explicit
 * `assignedTo` filter for the sales role AND runs with `overrideAccess: false` and the
 * user attached, so the access layer is a second line of defence rather than the only
 * one.
 *
 * Presentation reuses the base dashboard's row system (`mpm-rows` / `mpm-row` and its
 * BEM children) rather than inventing classes. The first version of this file used
 * names like `mpm-row-main` that do not exist, so every row rendered unstyled: list
 * bullets showing, the name running into the phone number, links underlined.
 */

/**
 * The stages the bars chart. Derived from the shared list rather than repeated: keeping
 * a second copy is precisely how the admin dashboard came to label assigned leads "New".
 * 'new' is excluded because a lead in this view always has an owner.
 */
const HANDLER_PIPELINE = LEAD_STATUS.filter((x) => x.value !== 'new');

/**
 * What a salesperson's bars chart. `assigned` and `reassigned` are routing states: they
 * describe how a lead reached this person, which is a handler's concern, not theirs.
 * Both mean the same thing from the salesperson's chair — yours, not yet worked — so
 * they are charted as one bucket. The row chips still show the true status, because
 * knowing a lead came off someone else is useful context for the customer call.
 */
const SALES_PIPELINE = [
  { value: 'assigned', label: 'To action', color: '#6D5AE6', merge: ['assigned', 'reassigned'] },
  ...LEAD_STATUS.filter((x) => !['new', 'assigned', 'reassigned'].includes(x.value)).map((x) => ({
    ...x,
    merge: [x.value],
  })),
];

/** Date windows offered on every leads view. `all` applies no constraint. */
export const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
] as const;
export type RangeKey = (typeof RANGES)[number]['key'];

/**
 * Turn a range key (or an explicit from/to pair) into a `createdAt` constraint.
 * Boundaries are computed in the server's local zone, which on the droplet is the
 * zone the team works in; a UTC day boundary would make "Today" start at 5:30 am IST.
 */
export function dateWhere(
  range: string | undefined,
  from?: string,
  to?: string,
): Record<string, unknown> | undefined {
  if (from || to) {
    const c: Record<string, string> = {};
    if (from) c.greater_than_equal = new Date(`${from}T00:00:00`).toISOString();
    if (to) c.less_than_equal = new Date(`${to}T23:59:59.999`).toISOString();
    return { createdAt: c };
  }
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'today') {
    /* start already correct */
  } else if (range === 'week') {
    // Monday-first, matching how the team talks about a working week.
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
  } else if (range === 'month') {
    start.setDate(1);
  } else {
    return undefined;
  }
  return { createdAt: { greater_than_equal: start.toISOString() } };
}

interface LeadDoc {
  id: string | number;
  name?: string;
  phone?: string;
  service?: string;
  status?: string;
  createdAt?: string;
  assignedAt?: string | null;
  assignedBy?: { id?: string | number; name?: string; email?: string } | string | number | null;
  assignedByName?: string | null;
  acknowledgedAt?: string | null;
  assignedTo?: { id?: string | number; name?: string; email?: string } | string | number | null;
}
interface UserRow {
  id: string | number;
  name?: string;
  email?: string;
  role?: string;
}

/**
 * One lead: avatar, name over a quiet detail line, stage chip, then age. A handler
 * needs to see who owns it; a salesperson already knows, so they get the phone number
 * instead — the thing they actually need to act.
 */
function LeadRow({ lead, showOwner }: { lead: LeadDoc; showOwner: boolean }): React.JSX.Element {
  const meta = statusMeta(lead.status);
  const detail = showOwner
    ? [lead.service, ownerName(lead.assignedTo) || 'Unassigned'].filter(Boolean).join(' · ')
    : [lead.service, lead.phone].filter(Boolean).join(' · ');
  return (
    <li className="mpm-row">
      <span className="mpm-avatar" aria-hidden="true">
        {initial(lead.name)}
      </span>
      <Link href={`/admin/collections/leads/${lead.id}`} className="mpm-row__main">
        <span className="mpm-row__name">{lead.name || 'Unnamed'}</span>
        <span className="mpm-row__meta">{detail || 'No details yet'}</span>
      </Link>
      <span className="mpm-badge" style={{ ['--c' as string]: meta.color }}>
        {meta.label}
      </span>
      {/* Arrival on top, hand-over underneath: an assigned lead is judged by how long
          its owner has had it, not by when it first came in. */}
      <span className="mpm-row__time" title={`Received ${exactTime(lead.createdAt)}`}>
        {lead.createdAt ? timeAgo(lead.createdAt) : ''}
        {lead.assignedAt && (
          <span className="mpm-row__sub" title={`Assigned ${exactTime(lead.assignedAt)}`}>
            {showOwner
              ? `${ownerName(lead.assignedTo) || 'owner'} · ${timeAgo(lead.assignedAt)}`
              : // Prefer the stored name: a salesperson cannot read the staff directory,
                // so the relationship would not resolve for them.
                (lead.assignedByName ?? ownerName(lead.assignedBy))
                ? `from ${lead.assignedByName ?? ownerName(lead.assignedBy)} · ${timeAgo(lead.assignedAt)}`
                : `assigned ${timeAgo(lead.assignedAt)}`}
          </span>
        )}
      </span>
    </li>
  );
}

export interface SalesViewProps {
  payload: Payload;
  user: { id?: string | number; name?: string; email?: string; role?: string };
  range: string;
  from?: string;
  to?: string;
}

export async function SalesDashboard(props: SalesViewProps): Promise<React.JSX.Element> {
  const { payload, user, range, from, to } = props;
  const isHandler = user.role === 'handler';
  const PIPELINE = isHandler
    ? HANDLER_PIPELINE.map((x) => ({ ...x, merge: [x.value] }))
    : SALES_PIPELINE;
  const me = user.id;
  const window = dateWhere(range, from, to);

  /** Every query runs as this user, with access enforced, plus an explicit scope. */
  const scope = (extra?: Record<string, unknown>): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [];
    if (!isHandler) and.push({ assignedTo: { equals: me } });
    if (window) and.push(window);
    if (extra) and.push(extra);
    return and.length ? { and } : {};
  };

  const count = (where: Record<string, unknown>): Promise<number> =>
    safe(
      async () =>
        (
          await payload.count({
            collection: 'leads',
            where: where as never,
            overrideAccess: false,
            user: user as never,
          })
        ).totalDocs,
      0,
    );

  const find = (
    collection: 'leads' | 'proposals' | 'users',
    opts: Record<string, unknown>,
  ): Promise<unknown[]> =>
    safe(async () => {
      const res = (await payload.find({
        collection: collection as never,
        overrideAccess: false,
        user: user as never,
        ...opts,
      } as never)) as { docs: unknown[] };
      return res.docs;
    }, []);

  const [byStatus, queueRaw, recentRaw, proposalsRaw, teamRaw, totalInRange] = await Promise.all([
    Promise.all(PIPELINE.map((s) => count(scope({ status: { in: s.merge } })))),
    // Handler: what still needs an owner. Sales: what they have not opened yet.
    find('leads', {
      limit: 8,
      sort: 'createdAt',
      depth: 1,
      where: isHandler
        ? { and: [{ assignedTo: { exists: false } }, ...(window ? [window] : [])] }
        : { and: [{ assignedTo: { equals: me } }, { acknowledgedAt: { exists: false } }] },
    }),
    find('leads', { limit: 10, sort: '-createdAt', depth: 1, where: scope() }),
    find('proposals', { limit: 5, sort: '-createdAt', depth: 0 }),
    isHandler ? find('users', { limit: 50, depth: 0, where: { role: { equals: 'sales' } } }) : [],
    count(scope()),
  ]);

  const pipeline = PIPELINE.map((s, i) => ({ ...s, count: byStatus[i] ?? 0 }));
  const queue = queueRaw as LeadDoc[];
  const recent = recentRaw as LeadDoc[];
  const proposals = proposalsRaw as { id: string | number; title?: string; createdAt?: string }[];
  const team = teamRaw as UserRow[];
  const maxCount = Math.max(1, ...pipeline.map((p) => p.count));
  const firstName = (user.name || user.email || '').split(/[@\s]/)[0];

  // Open-lead load per salesperson, so a handler distributes with the facts in view.
  const load = await Promise.all(
    team.map(async (t) => ({
      user: t,
      open: await count({
        and: [{ assignedTo: { equals: t.id } }, { status: { not_in: ['won', 'lost'] } }],
      }),
    })),
  );

  const q = (key: string): string => `?range=${key}`;

  return (
    <div className="mpm-dash">
      <style>{CSS}</style>
      <style>{EXTRA_CSS}</style>

      <header className="mpm-head">
        <div>
          <h1 className="mpm-h1">
            {firstName ? `Hello, ${firstName}` : 'Hello'}
            <span className="mpm-wave" aria-hidden="true">
              {' '}
              👋
            </span>
          </h1>
          <p className="mpm-sub">
            {isHandler
              ? 'Every lead lands here. Give each one an owner.'
              : 'Your leads, newest first.'}
          </p>
        </div>
      </header>

      {/* Date window — a plain link set, so the choice lives in the URL and can be
          bookmarked or shared, and the server renders the right numbers directly. */}
      <nav className="mpm-ranges" aria-label="Date range">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={q(r.key)}
            className={`mpm-link mpm-range${(range || 'all') === r.key ? ' is-on' : ''}`}
          >
            {r.label}
          </Link>
        ))}
        <span className="mpm-range-count">
          {fmt(totalInRange)} {totalInRange === 1 ? 'lead' : 'leads'}
        </span>
      </nav>

      <section className="mpm-grid">
        {/* ── Queue ─────────────────────────────────────────────────────────── */}
        <article className="mpm-card mpm-span2">
          <div className="mpm-card__head">
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.inbox}
              </span>
              {isHandler ? 'Needs an owner' : 'New to you'}
              {queue.length > 0 && <span className="mpm-count">{queue.length}</span>}
            </h3>
            <Link className="mpm-link mpm-open" href="/admin/collections/leads">
              open →
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="mpm-empty">
              {isHandler ? 'Every lead has an owner.' : 'Nothing new right now.'}
            </p>
          ) : (
            <ul className="mpm-rows">
              {queue.map((l) => (
                <LeadRow key={String(l.id)} lead={l} showOwner={isHandler} />
              ))}
            </ul>
          )}
        </article>

        {/* ── Pipeline ──────────────────────────────────────────────────────── */}
        <article className="mpm-card">
          <div className="mpm-card__head">
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.funnel}
              </span>
              {isHandler ? 'Board' : 'Your pipeline'}
            </h3>
          </div>
          <ul className="mpm-bars">
            {pipeline.map((s) => (
              <li key={s.value}>
                <span className="mpm-bar-label">{s.label}</span>
                <span className="mpm-bar-track">
                  <span
                    className="mpm-bar-fill"
                    style={{
                      width: `${Math.max(s.count > 0 ? 6 : 0, Math.round((s.count / maxCount) * 100))}%`,
                      background: s.color,
                    }}
                  />
                </span>
                <span className="mpm-bar-num">{fmt(s.count)}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* ── Team load (handler) or proposals (sales) ──────────────────────── */}
        {isHandler ? (
          <article className="mpm-card">
            <div className="mpm-card__head">
              <h3>
                <span className="mpm-card__ico" aria-hidden="true">
                  {ICONS.briefcase}
                </span>
                Team load
              </h3>
            </div>
            {load.length === 0 ? (
              <p className="mpm-empty">No salespeople yet.</p>
            ) : (
              <ul className="mpm-rows">
                {load
                  .sort((a, b) => b.open - a.open)
                  .map((t) => (
                    <li key={String(t.user.id)} className="mpm-row">
                      <span className="mpm-avatar" aria-hidden="true">
                        {initial(t.user.name || t.user.email)}
                      </span>
                      <span className="mpm-row__main">
                        <span className="mpm-row__name">{t.user.name || t.user.email}</span>
                        <span className="mpm-row__meta">
                          {t.open === 0 ? 'nothing open' : `${t.open} open`}
                        </span>
                      </span>
                      <span
                        className="mpm-badge"
                        style={{ ['--c' as string]: t.open === 0 ? '#1a9d5a' : '#6D5AE6' }}
                      >
                        {t.open === 0 ? 'free' : fmt(t.open)}
                      </span>
                      <span className="mpm-row__time" />
                    </li>
                  ))}
              </ul>
            )}
          </article>
        ) : (
          <article className="mpm-card">
            <div className="mpm-card__head">
              <h3>
                <span className="mpm-card__ico" aria-hidden="true">
                  {ICONS.layers}
                </span>
                Your proposals
              </h3>
              <Link className="mpm-link mpm-open" href="/admin/collections/proposals">
                open →
              </Link>
            </div>
            {proposals.length === 0 ? (
              <p className="mpm-empty">No proposals yet.</p>
            ) : (
              <ul className="mpm-rows">
                {proposals.map((p) => (
                  <li key={String(p.id)} className="mpm-row">
                    <span className="mpm-avatar" aria-hidden="true">
                      {initial(p.title)}
                    </span>
                    <Link href={`/admin/collections/proposals/${p.id}`} className="mpm-row__main">
                      <span className="mpm-row__name">{p.title || `Proposal ${p.id}`}</span>
                      <span className="mpm-row__meta">Proposal</span>
                    </Link>
                    <span />
                    <span className="mpm-row__time">{p.createdAt ? timeAgo(p.createdAt) : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )}

        {/* ── Leads by date ─────────────────────────────────────────────────── */}
        <article className="mpm-card mpm-span3">
          <div className="mpm-card__head">
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.list}
              </span>
              {isHandler ? 'All leads' : 'Your leads'}
            </h3>
            <Link className="mpm-link mpm-open" href="/admin/collections/leads">
              open →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mpm-empty">No leads in this period.</p>
          ) : (
            <ul className="mpm-rows">
              {recent.map((l) => (
                <LeadRow key={String(l.id)} lead={l} showOwner={isHandler} />
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}

/** Only what the base dashboard has no equivalent for. */
const EXTRA_CSS = `
.mpm-ranges{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem;margin:0 0 1.35rem}
.mpm-range{display:inline-flex;align-items:center;padding:.34rem .8rem;border-radius:999px;
  font-size:.78rem;font-weight:600;text-decoration:none;
  border:1px solid var(--theme-elevation-150);color:var(--theme-elevation-600);
  transition:border-color .15s ease,color .15s ease,background .15s ease}
.mpm-range:hover{border-color:var(--v-500);color:var(--v-500)}
.mpm-range.is-on{background:var(--v-500);border-color:var(--v-500);color:#fff}
.mpm-range.is-on:hover{color:#fff}
.mpm-range-count{margin-left:auto;font-size:.78rem;color:var(--theme-elevation-500)}
.mpm-count{display:inline-grid;place-items:center;min-width:1.35rem;height:1.35rem;padding:0 .35rem;
  border-radius:999px;background:var(--v-500);color:#fff;font-size:.7rem;font-weight:700}
.mpm-open{font-size:.78rem;font-weight:600;color:var(--v-500);white-space:nowrap}
.mpm-bars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55rem}
.mpm-bars li{display:grid;grid-template-columns:5.5rem 1fr 2rem;align-items:center;gap:.6rem}
.mpm-bar-label{font-size:.78rem;color:var(--theme-elevation-600)}
.mpm-bar-track{height:7px;border-radius:999px;background:var(--theme-elevation-100);overflow:hidden}
.mpm-bar-fill{display:block;height:100%;border-radius:999px}
.mpm-bar-num{text-align:right;font-weight:700;font-size:.78rem;color:var(--theme-elevation-800)}
.mpm-span3{grid-column:1/-1}
/* The full-width card is wide enough for two columns of leads. One column left the
   status chip and time stranded against the right edge with a large dead gap, and
   showed half as many rows for the same height. Collapses back to one column when the
   viewport cannot give each column a readable width. */
.mpm-span3 .mpm-rows{display:grid;grid-template-columns:1fr 1fr;column-gap:2.25rem}
.mpm-span3 .mpm-row:nth-child(-n+2){border-top:0}
@media (max-width:1100px){
  .mpm-span3 .mpm-rows{grid-template-columns:1fr}
  .mpm-span3 .mpm-row:nth-child(2){border-top:1px solid var(--theme-elevation-100)}
  .mpm-span3 .mpm-row:first-child{border-top:0}
}
`;
