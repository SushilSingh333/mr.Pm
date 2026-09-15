import type { Payload } from 'payload';
import Link from 'next/link';
// CSS/ICONS/helpers still come from Dashboard, which imports this file back. That
// cycle is safe only because none of them are touched at module-initialisation time —
// they are read inside the component. The status list is NOT, which is exactly why it
// lives in its own leaf module.
import { CSS, ICONS, fmt, initial, safe, timeAgo } from './Dashboard.js';
import { LEAD_STATUS, exactTime, ownerName, statusMeta } from './lead-status.js';
import { PhoneButtons } from '../leads/PhoneActions.js';
import { loadRouting } from './lead-routing.js';
import { RoundRobin } from './RoundRobin.js';

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

/**
 * Where the leads came from. Values MUST match the `source` options on the Leads
 * collection - a mismatch here shows as a permanent zero rather than an error, which is
 * the failure mode that let the old dashboard label assigned leads "New" for weeks.
 */
const SOURCES = [
  { value: 'quote-form', label: 'Quote form', color: '#6D5AE6' },
  { value: 'price-check', label: 'Price check', color: '#8b6df0' },
  { value: 'facebook-ad', label: 'Facebook ad', color: '#2f6df6' },
  { value: 'webhook', label: 'Webhook', color: '#1a9d5a' },
] as const;

/** "18m", "2h 14m", "1d 3h" - the shape someone would say out loud. */
function humanDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const m = mins % 60;
    return m ? `${hours}h ${m}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return h ? `${days}d ${h}h` : `${days}d`;
}

/**
 * Median, not mean.
 *
 * One lead that sat over a bank holiday weekend drags an average into uselessness, and
 * the number is meant to answer "how long does a lead normally wait" - which is the
 * middle of the distribution, not its centre of mass.
 */
function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2
    ? (sorted[mid] ?? NaN)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

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
  // The phone used to be printed into this line for salespeople. It is a dial button
  // now, so the line is free to carry what the row was missing instead: who owns it.
  const detail = [lead.service, showOwner ? ownerName(lead.assignedTo) || 'Unassigned' : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="mpm-row mpm-row--lead">
      <span className="mpm-avatar" aria-hidden="true">
        {initial(lead.name)}
      </span>
      <Link href={`/admin/collections/leads/${lead.id}`} className="mpm-row__main">
        <span className="mpm-row__name">{lead.name || 'Unnamed'}</span>
        <span className="mpm-row__meta">{detail || 'No details yet'}</span>
      </Link>
      <span className="mpm-row__dial">
        <PhoneButtons phone={lead.phone} />
      </span>
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
              ? // The owner's name is already on the meta line above for a handler, and
                // repeating it here only overflowed a narrow column. When it was handed
                // over is the part this line adds.
                `assigned ${timeAgo(lead.assignedAt)}`
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

  /** What the queue card is really counting, independent of how many rows we show. */
  const queueWhere = isHandler
    ? { and: [{ assignedTo: { exists: false } }, ...(window ? [window] : [])] }
    : { and: [{ assignedTo: { equals: me } }, { acknowledgedAt: { exists: false } }] };

  /**
   * A handler's own workload.
   *
   * Their dashboard used to lead with the unclaimed queue, which is a duty rather than a
   * workload - and with routing on, leads rarely sit unclaimed long enough to be the main
   * thing they look at. What they actually work is what has been given to them. Open only:
   * a lead that is won or lost is history, not something to act on.
   *
   * Deliberately not date-windowed. The range chips narrow the analytics; a lead assigned
   * last month that nobody has closed is still on this person's desk today.
   */
  const mineWhere = {
    and: [{ assignedTo: { equals: me } }, { status: { not_in: ['won', 'lost'] } }],
  };

  const [
    byStatus,
    queueRaw,
    oldestRaw,
    recentRaw,
    proposalsRaw,
    teamRaw,
    totalInRange,
    queueTotal,
    sourceCounts,
    assignedRaw,
    routing,
    staleRaw,
    mineRaw,
    mineTotal,
  ] = await Promise.all([
    Promise.all(PIPELINE.map((s) => count(scope({ status: { in: s.merge } })))),
    // Handler: what still needs an owner. Sales: what they have not opened yet.
    //
    // Newest first. This was oldest-first, on the reasoning that a queue should be
    // FIFO so nothing is forgotten - but a moving enquiry is at its most winnable in
    // the minutes after it arrives, while the customer is still on the comparison
    // sites ringing our competitors. Burying today's leads under last week's is the
    // expensive mistake; the cheap one is losing track of an old lead, and the
    // "waiting longest" line below covers that without reordering the list.
    find('leads', {
      limit: 8,
      sort: '-createdAt',
      depth: 1,
      where: queueWhere,
    }),
    // The single oldest thing still in the queue, so that turning the list around
    // cannot quietly let one rot at the bottom.
    find('leads', { limit: 1, sort: 'createdAt', depth: 0, where: queueWhere }),
    find('leads', { limit: 10, sort: '-createdAt', depth: 1, where: scope() }),
    find('proposals', { limit: 5, sort: '-createdAt', depth: 0 }),
    isHandler ? find('users', { limit: 50, depth: 0, where: { role: { equals: 'sales' } } }) : [],
    count(scope()),
    count(queueWhere),
    Promise.all(SOURCES.map((src) => count(scope({ source: { equals: src.value } })))),
    // Enough to read a median from without pulling the whole table. Capped, and the
    // card says so rather than implying it measured everything.
    find('leads', {
      limit: 200,
      sort: '-createdAt',
      depth: 0,
      where: scope({ assignedAt: { exists: true } }),
    }),
    loadRouting(payload, user),
    // Quoted and then nothing for three days. A salesperson's real backlog is not the
    // leads they have not opened - it is the ones they priced and never chased, which
    // no other card on this page would show them.
    isHandler
      ? []
      : find('leads', {
          limit: 5,
          sort: 'updatedAt',
          depth: 0,
          where: {
            and: [
              { assignedTo: { equals: me } },
              { status: { equals: 'quoted' } },
              { updatedAt: { less_than: new Date(Date.now() - 3 * 86_400_000).toISOString() } },
            ],
          },
        }),
    // What this handler is personally holding, and how much of it there is.
    isHandler ? find('leads', { limit: 10, sort: '-createdAt', depth: 1, where: mineWhere }) : [],
    isHandler ? count(mineWhere) : 0,
  ]);

  const pipeline = PIPELINE.map((s, i) => ({ ...s, count: byStatus[i] ?? 0 }));
  const queue = queueRaw as LeadDoc[];
  const oldestWaiting = (oldestRaw as LeadDoc[])[0];
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

  // How long a lead normally waits before it has an owner.
  const waits = (assignedRaw as { createdAt?: string; assignedAt?: string | null }[])
    .map((l) =>
      l.createdAt && l.assignedAt
        ? new Date(l.assignedAt).getTime() - new Date(l.createdAt).getTime()
        : NaN,
    )
    .filter((n) => Number.isFinite(n) && n >= 0);
  const medianWait = median(waits);

  // Win rate over decided leads only. Counting wins against every lead in the pipeline
  // reports a number that falls every time a new enquiry arrives, which is backwards.
  const wonCount = pipeline.find((p) => p.value === 'won')?.count ?? 0;
  const lostCount = pipeline.find((p) => p.value === 'lost')?.count ?? 0;
  const decided = wonCount + lostCount;
  const winRate = decided > 0 ? Math.round((wonCount / decided) * 100) : null;

  const sources = sourceCounts as number[];
  const maxSource = Math.max(1, ...sources);
  const sourceTotal = sources.reduce((a, b) => a + b, 0);
  const stale = staleRaw as (LeadDoc & { updatedAt?: string })[];
  const mine = mineRaw as LeadDoc[];
  const mineCount = mineTotal as number;
  /** Payload's list view reads its filters straight off the query string. */
  const mineHref = `/admin/collections/leads?where[assignedTo][equals]=${String(me)}`;
  const unclaimedHref = '/admin/collections/leads?where[assignedTo][exists]=false';
  const rangeLabel = RANGES.find((r) => r.key === (range || 'all'))?.label ?? 'All time';

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
              ? 'Every lead lands here, newest first. Give each one an owner.'
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

      {/* ── The four numbers worth knowing before anything else ───────────────
          Volume, backlog, speed, outcome. Everything below is one of these four
          broken down; this strip is what you read if you only read one thing. */}
      <section className="mpm-kpis mpm-kpis--4">
        <Link className="mpm-kpi mpm-kpi--hero" href="/admin/collections/leads">
          <span className="mpm-kpi__glow" aria-hidden="true" />
          <span className="mpm-ico mpm-ico--ghost" aria-hidden="true">
            {ICONS.leads}
          </span>
          <span className="mpm-kpi__label">{isHandler ? 'Leads' : 'Your leads'}</span>
          <span className="mpm-kpi__value">{fmt(totalInRange)}</span>
          <span className="mpm-kpi__hint">{rangeLabel.toLowerCase()}</span>
        </Link>

        <Link
          className={`mpm-kpi${queueTotal > 0 ? ' mpm-kpi--hot' : ''}`}
          href={isHandler ? unclaimedHref : '/admin/collections/leads'}
        >
          <span className="mpm-ico" aria-hidden="true">
            {ICONS.inbox}
          </span>
          <span className="mpm-kpi__label">{isHandler ? 'Needs an owner' : 'New to you'}</span>
          <span className="mpm-kpi__value">{fmt(queueTotal)}</span>
          <span className="mpm-kpi__hint">{queueTotal > 0 ? 'waiting now' : 'all clear'}</span>
        </Link>

        <div className="mpm-kpi">
          <span className="mpm-ico" aria-hidden="true">
            {ICONS.clock}
          </span>
          <span className="mpm-kpi__label">{isHandler ? 'Time to owner' : 'Time to you'}</span>
          <span className="mpm-kpi__value mpm-kpi__value--text">
            {Number.isFinite(medianWait) ? humanDuration(medianWait) : 'Not yet'}
          </span>
          <span className="mpm-kpi__hint">
            {waits.length > 0 ? `median of ${fmt(waits.length)}` : 'nothing assigned yet'}
          </span>
        </div>

        <div className="mpm-kpi">
          <span className="mpm-ico" aria-hidden="true">
            {ICONS.won}
          </span>
          <span className="mpm-kpi__label">Won</span>
          <span className={`mpm-kpi__value${winRate === null ? ' mpm-kpi__value--text' : ''}`}>
            {winRate === null ? 'Not yet' : `${winRate}%`}
          </span>
          <span className="mpm-kpi__hint">
            {decided > 0 ? `of ${fmt(decided)} won or lost` : 'nothing won or lost yet'}
          </span>
        </div>
      </section>

      <section className="mpm-grid">
        {/* ── The list this person actually works ────────────────────────────
            A handler had "needs an owner" twice: once as a figure in the strip above and
            again as the whole of this card, while the leads on their own desk appeared
            nowhere. The count stays in the strip, where a count belongs, and this card
            carries their workload. The unclaimed queue is still their job, so it keeps a
            line at the foot with the one fact that matters about it - how long the oldest
            one has been sitting there - and a way through to the full list. */}
        <article className="mpm-card mpm-span3">
          <div className="mpm-card__head">
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.inbox}
              </span>
              {isHandler ? 'Assigned to you' : 'New to you'}
              {(isHandler ? mineCount : queueTotal) > 0 && (
                <span className="mpm-count">{fmt(isHandler ? mineCount : queueTotal)}</span>
              )}
            </h3>
            <Link
              className="mpm-link mpm-open"
              href={isHandler ? mineHref : '/admin/collections/leads'}
            >
              open →
            </Link>
          </div>

          {(isHandler ? mine : queue).length === 0 ? (
            <p className="mpm-empty">
              {isHandler ? 'Nothing is assigned to you right now.' : 'Nothing new right now.'}
            </p>
          ) : (
            <ul className="mpm-rows">
              {(isHandler ? mine : queue).map((l) => (
                <LeadRow key={String(l.id)} lead={l} showOwner={false} />
              ))}
            </ul>
          )}

          {/* Only once there is more than a screenful - a button offering to show ten of
              ten is noise. */}
          {isHandler && mineCount > mine.length && (
            <p className="mpm-more">
              <Link className="mpm-showall" href={mineHref}>
                Show all {fmt(mineCount)} →
              </Link>
            </p>
          )}

          {!isHandler && queueTotal > queue.length && (
            <p className="mpm-more">
              <Link className="mpm-showall" href="/admin/collections/leads">
                Show all {fmt(queueTotal)} →
              </Link>
            </p>
          )}

          {/* The distribution duty, kept to one line. */}
          {isHandler && queueTotal > 0 && (
            <p className="mpm-more">
              <strong className="mpm-more__wait">{fmt(queueTotal)}</strong>{' '}
              {queueTotal === 1 ? 'lead still needs' : 'leads still need'} an owner.{' '}
              {oldestWaiting?.createdAt && (
                <span className="mpm-more__wait">
                  Waiting longest:{' '}
                  <Link
                    className="mpm-link mpm-more__waitlink"
                    href={`/admin/collections/leads/${oldestWaiting.id}`}
                    title={`Received ${exactTime(oldestWaiting.createdAt)}`}
                  >
                    {oldestWaiting.name || 'Unnamed'} · {timeAgo(oldestWaiting.createdAt)}
                  </Link>
                  .{' '}
                </span>
              )}
              <Link className="mpm-link mpm-more__link" href={unclaimedHref}>
                see them →
              </Link>
            </p>
          )}
        </article>

        {/* ── Auto-assign ───────────────────────────────────────────────────
            Handlers only here; admins get the same card on their own dashboard. The
            loader swallows its own failures and returns null, so a dashboard render
            never depends on the global being there. */}
        {isHandler && routing && <RoundRobin {...routing} />}

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

        {/* ── Where the work came from ──────────────────────────────────────
            Worth a card because it is the only place the ad spend shows up against
            the form: if Facebook is half the board, the Zap is earning its keep. */}
        <article className="mpm-card">
          <div className="mpm-card__head">
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.funnel}
              </span>
              Where they came from
            </h3>
            <span className="mpm-muted">{rangeLabel.toLowerCase()}</span>
          </div>
          {sourceTotal === 0 ? (
            <p className="mpm-empty">No leads in this period.</p>
          ) : (
            <ul className="mpm-bars">
              {SOURCES.map((src, i) => (
                <li key={src.value}>
                  <span className="mpm-bar-label">{src.label}</span>
                  <span className="mpm-bar-track">
                    <span
                      className="mpm-bar-fill"
                      style={{
                        width: `${Math.max((sources[i] ?? 0) > 0 ? 6 : 0, Math.round(((sources[i] ?? 0) / maxSource) * 100))}%`,
                        background: src.color,
                      }}
                    />
                  </span>
                  <span className="mpm-bar-num">{fmt(sources[i] ?? 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* ── Gone quiet (sales) ────────────────────────────────────────────
            Priced, then nothing for three days. The queue card shows what has not been
            opened; this shows what was opened, quoted, and then left - which is where
            the money actually leaks. */}
        {!isHandler && (
          <article className="mpm-card">
            <div className="mpm-card__head">
              <h3>
                <span className="mpm-card__ico" aria-hidden="true">
                  {ICONS.clock}
                </span>
                Gone quiet
                {stale.length > 0 && <span className="mpm-count">{fmt(stale.length)}</span>}
              </h3>
            </div>
            {stale.length === 0 ? (
              <p className="mpm-empty">Nothing quoted has been left sitting. Good.</p>
            ) : (
              <ul className="mpm-rows">
                {stale.map((l) => (
                  <li key={String(l.id)} className="mpm-row mpm-row--lead">
                    <span className="mpm-avatar" aria-hidden="true">
                      {initial(l.name)}
                    </span>
                    <Link href={`/admin/collections/leads/${l.id}`} className="mpm-row__main">
                      <span className="mpm-row__name">{l.name || 'Unnamed'}</span>
                      <span className="mpm-row__meta">{l.service || 'Quoted'}</span>
                    </Link>
                    <span className="mpm-row__dial">
                      <PhoneButtons phone={l.phone} />
                    </span>
                    <span className="mpm-badge" style={{ ['--c' as string]: '#c98a00' }}>
                      Quoted
                    </span>
                    <span
                      className="mpm-row__time"
                      title={l.updatedAt ? `Last touched ${exactTime(l.updatedAt)}` : undefined}
                    >
                      {l.updatedAt ? `quiet ${timeAgo(l.updatedAt)}` : ''}
                    </span>
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
  border:1px solid var(--line);color:var(--ink-2);
  transition:border-color .15s ease,color .15s ease,background .15s ease}
.mpm-range:hover{border-color:var(--v-500);color:var(--v-500)}
.mpm-range.is-on{background:var(--v-500);border-color:var(--v-500);color:#fff}
.mpm-range.is-on:hover{color:#fff}
.mpm-range-count{margin-left:auto;font-size:.78rem;color:var(--ink-3)}
/* The digit was sitting off-centre: without an explicit line-height the font's own
   metrics push it up inside the pill, and the pill was tight enough to make that
   obvious. Fixed height + line-height:1 centres it regardless of the face. */
.mpm-count{display:inline-flex;align-items:center;justify-content:center;
  min-width:1.5rem;height:1.5rem;padding:0 .45rem;flex:none;
  border-radius:999px;background:var(--v-500);color:#fff;
  font-size:.78rem;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.mpm-open{font-size:.78rem;font-weight:600;color:var(--v-500);white-space:nowrap}
/* The truncation note. Its link is the way out of a partial list, so it is set at body
   size rather than the smaller caption size the note itself uses. */
.mpm-more{margin:.85rem 0 0;padding-top:.75rem;border-top:1px solid var(--line);
  font-size:.8rem;color:var(--ink-3)}
.mpm-more__link{font-size:.95rem;font-weight:700;color:var(--v-500);white-space:nowrap}
.mpm-more__link:hover{text-decoration:underline}
.mpm-bars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55rem}
.mpm-bars li{display:grid;grid-template-columns:5.5rem 1fr 2rem;align-items:center;gap:.6rem}
.mpm-bar-label{font-size:.78rem;color:var(--ink-2)}
.mpm-bar-track{height:7px;border-radius:999px;background:var(--line);overflow:hidden}
.mpm-bar-fill{display:block;height:100%;border-radius:999px}
.mpm-bar-num{text-align:right;font-weight:700;font-size:.78rem;color:var(--ink-2)}
/* .mpm-span3 and its two-column rows now live in the shared sheet - the admin
   dashboard needs them too. */

/* ── Phone ──────────────────────────────────────────────────────────────────
   This is the dashboard most likely to be read on a phone: a salesperson checking
   their queue between calls, a handler distributing leads without opening a laptop.
   The desktop layout is unchanged above 640px. */
@media (max-width:640px){
  /* The two-up card grid stacks - two cards side by side on a 390px screen leaves
     neither wide enough for a customer name and a status chip. */
  .mpm-grid{ grid-template-columns:1fr !important; gap:.75rem; }
  .mpm-card{ padding:.9rem 1rem; border-radius:14px; }
  .mpm-h1{ font-size:1.45rem; }
  .mpm-head{ gap:.6rem; }

  /* Date-range chips scroll sideways rather than wrapping into three ragged lines. */
  .mpm-ranges{
    display:flex; flex-wrap:nowrap; overflow-x:auto; gap:.4rem;
    -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-bottom:.15rem;
  }
  .mpm-ranges::-webkit-scrollbar{ display:none; }
  .mpm-range{ flex:none; }

  /* Stage bars: the fixed 5.5rem label column is most of a phone's width, so the
     label sits above its bar instead of beside it. */
  .mpm-bars li{ grid-template-columns:1fr auto; gap:.25rem .5rem; }
  .mpm-bar-label{ grid-column:1; font-size:.75rem; }
  .mpm-bar-num{ grid-column:2; grid-row:1; }
  .mpm-bar-track{ grid-column:1 / -1; }

  /* The lead row's phone layout lives in the shared CSS with the rest of that row -
     what used to be here set flex-wrap and flex-basis on the children of a grid, which
     does nothing. */
}

/* The queue runs newest-first, so the lead that has waited longest is at the bottom of
   it - or off the end entirely. This line is the safety net for that: one sentence
   naming the worst case, linked, so nothing rots unseen. */
.mpm-more__wait{color:var(--ink-2)}
.mpm-more__waitlink{font-weight:700;color:var(--mpm-ember-ink,#C63F00)}
.mpm-more__waitlink:hover{text-decoration:underline;color:var(--mpm-ember-ink,#C63F00)}

/* ── The four-up KPI strip ──────────────────────────────────────────────────
   The base dashboard's strip is three across. Four fits the shape of this one:
   volume, backlog, speed, outcome. Steps down rather than shrinking the figures,
   because a number too small to read is worse than a longer page. */
.mpm-kpis--4{grid-template-columns:repeat(4,1fr)}
@media (max-width:1100px){ .mpm-kpis--4{grid-template-columns:repeat(2,1fr)} }
@media (max-width:520px){
  .mpm-kpis--4{grid-template-columns:repeat(2,1fr);gap:.6rem}
  /* The base strip no longer spans its hero, so there is nothing to undo here - only the
     figure size, which is tuned for a half-width card. */
  .mpm-kpis--4 .mpm-kpi--hero .mpm-kpi__value{font-size:1.9rem}
}
/* A duration is four or five characters wide where a count is two, so it is set a
   size down - at the figure size "1d 3h" wrapped onto a second line. */
.mpm-kpi__value--text{font-size:1.55rem !important;letter-spacing:-.01em}
`;
