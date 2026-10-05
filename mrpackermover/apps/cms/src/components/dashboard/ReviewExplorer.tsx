'use client';
import { useEffect, useMemo, useState } from 'react';
import { MIcon } from '../icons/MIcon.js';
import { REVIEW_BUCKETS, REVIEW_PENDING, buildReview, type Review } from './lead-status.js';
import { REVIEW_CSS, ReviewDonut, needsCoaching } from './LeadReview.js';

/**
 * The lead review with its own controls: ONE donut, and two questions that change it -
 * whose leads (the whole team, or one salesperson) and over which dates.
 *
 * It reads the leads itself, over the REST API as the signed-in user, rather than taking
 * counts from the page around it. That is what lets the period be anything at all - a
 * month, a year, last Diwali week - without the dashboard precomputing every window, and
 * it means the access rules apply exactly as on the Leads list: a handler sees the team,
 * a salesperson only ever their own.
 *
 *   mode "team"    Admin and handler dashboards. Dropdown: Overall, then each salesperson.
 *   mode "person"  A salesperson's page under Users. One person, so no dropdown.
 *
 * Built the way Google's own reporting reads: filter chips for the period, the headline
 * against the previous period of the same length, a skeleton while it loads, and an empty
 * state that offers the next thing to try rather than a blank ring. Every slice opens the
 * Leads list on exactly those leads, so the count on the chart is the count on the list.
 */

type PeriodKey = 'month' | 'last-month' | 'quarter' | 'year' | 'all' | 'custom';
const PERIODS: { key: PeriodKey; label: string; short: string }[] = [
  { key: 'month', label: 'This month', short: 'This month' },
  { key: 'last-month', label: 'Last month', short: 'Last month' },
  { key: 'quarter', label: 'Last 3 months', short: '3 months' },
  { key: 'year', label: 'This year', short: 'This year' },
  { key: 'all', label: 'All time', short: 'All time' },
  { key: 'custom', label: 'Custom dates', short: 'Custom' },
];

const OVERALL = 'overall';
const MEMORY = 'mpm:review:explorer';

type Win = { from?: string; to?: string };

/** yyyy-mm-dd for a local date - what a date input reads and writes. */
const ymd = (d: Date): string =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/**
 * The createdAt window for a period, in the browser's zone (the team's own): `from`
 * inclusive, `to` exclusive. A custom range includes the whole of its last day.
 */
function windowOf(period: PeriodKey, from: string, to: string): Win {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const at = (yy: number, mm: number, dd = 1): string => new Date(yy, mm, dd).toISOString();
  switch (period) {
    case 'month':
      return { from: at(y, m) };
    case 'last-month':
      return { from: at(y, m - 1), to: at(y, m) };
    case 'quarter':
      return { from: at(y, m - 2) };
    case 'year':
      return { from: at(y, 0) };
    case 'custom': {
      const w: Win = {};
      if (from) w.from = new Date(`${from}T00:00:00`).toISOString();
      if (to) {
        const end = new Date(`${to}T00:00:00`);
        end.setDate(end.getDate() + 1);
        w.to = end.toISOString();
      }
      return w;
    }
    default:
      return {};
  }
}

/**
 * The period just before, of the same length - Analytics' "previous period". "This month"
 * on the 5th compares with the 5 days before the 1st, not with all of last month, so a
 * month that has barely started is never judged against a whole one. All time has none.
 */
function previousOf(win: Win): Win | null {
  if (!win.from) return null;
  const start = new Date(win.from).getTime();
  const end = win.to ? new Date(win.to).getTime() : Date.now();
  const len = end - start;
  if (len <= 0) return null;
  return { from: new Date(start - len).toISOString(), to: new Date(start).toISOString() };
}

const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const rangeText = (w: Win): string =>
  `${w.from ? shortDate(w.from) : 'the start'} – ${
    w.to ? shortDate(new Date(new Date(w.to).getTime() - 1).toISOString()) : 'today'
  }`;

/** A Payload `where` in query-string form: the window, an owner, some stages. */
function whereQuery(win: Win, owner?: string, statuses?: string[]): string {
  const parts: string[] = [];
  let i = 0;
  if (win.from) parts.push(`where[and][${i++}][createdAt][greater_than_equal]=${win.from}`);
  if (win.to) parts.push(`where[and][${i++}][createdAt][less_than]=${win.to}`);
  if (owner) parts.push(`where[and][${i++}][assignedTo][equals]=${encodeURIComponent(owner)}`);
  if (statuses?.length) {
    statuses.forEach((s, j) => parts.push(`where[and][${i}][status][in][${j}]=${s}`));
  }
  return parts.join('&');
}

const listUrl = (q: string): string => `/admin/collections/leads${q ? `?${q}` : ''}`;

type Counts = Map<string, Map<string, number>>;

/** Status counts per owner id ('' = nobody) for every lead in a window. */
async function countsFor(win: Win, owner?: string): Promise<Counts> {
  const q = whereQuery(win, owner);
  // Two columns of every lead in the window. `select` keeps each row to two scalars;
  // without it the adapter joins every array table on the lead to count a stage.
  const res = await fetch(
    `/api/leads?${q}${q ? '&' : ''}depth=0&limit=50000&pagination=false&select[status]=true&select[assignedTo]=true`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error(String(res.status));
  const docs =
    ((await res.json()) as { docs?: { status?: string; assignedTo?: unknown }[] }).docs ?? [];
  const byOwner: Counts = new Map();
  for (const d of docs) {
    if (!d.status) continue;
    const a = d.assignedTo as { id?: unknown } | string | number | null | undefined;
    const o = a && typeof a === 'object' ? String(a.id ?? '') : a != null ? String(a) : '';
    const m = byOwner.get(o) ?? new Map<string, number>();
    m.set(d.status, (m.get(d.status) ?? 0) + 1);
    byOwner.set(o, m);
  }
  return byOwner;
}

const sumAll = (c: Counts): Map<string, number> => {
  const t = new Map<string, number>();
  for (const m of c.values()) for (const [k, v] of m) t.set(k, (t.get(k) ?? 0) + v);
  return t;
};

const personCase = (s: string): string =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');

/**
 * One sentence on what to do next, in words. No numbers: the chart and legend already
 * carry every figure, and a second copy of one is a second thing to keep in step.
 */
function insightOf(
  review: Review,
): { icon: 'trending_up' | 'trending_down' | 'trophy'; text: string } | null {
  if (!review.reviewed) return null;
  const top = (key: string): string | undefined =>
    review.slices
      .find((s) => s.bucket.key === key)
      ?.stages.slice()
      .sort((a, b) => b.count - a.count)[0]?.label;
  const improve = review.slices.find((s) => s.bucket.key === 'improve');
  const lost = review.slices.find((s) => s.bucket.key === 'lost');
  if (improve && improve.count > 0 && improve.pct >= 25) {
    return {
      icon: 'trending_up',
      text: `Most leads that need improvement are at “${top('improve')}”. Sending them a price is what moves them to Qualified.`,
    };
  }
  if (lost && lost.pct >= 40) {
    return {
      icon: 'trending_down',
      text: `Lost is the biggest share, mostly “${top('lost')}”. Worth checking why these slip away.`,
    };
  }
  if ((review.score ?? 0) >= 60) {
    return {
      icon: 'trophy',
      text: 'A strong period: most worked leads reached a quote or better.',
    };
  }
  return null;
}

interface Loaded {
  now: Counts;
  prev: Counts | null;
  /** every salesperson, plus anyone else who owns a lead in the window */
  people: { id: string; name: string }[];
}

export function ReviewExplorer({
  mode,
  personId,
  initialPerson,
  title,
  lede,
  variant = 'card',
}: {
  mode: 'team' | 'person';
  /** mode "person": whose leads. */
  personId?: string;
  /** mode "team": open on this person (the handler's owner filter) rather than Overall. */
  initialPerson?: string;
  title: string;
  lede?: string;
  /** `card` sits on a dashboard; `plain` sits inside a Payload form. */
  variant?: 'card' | 'plain';
}): React.JSX.Element {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [from, setFrom] = useState(() =>
    ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  );
  const [to, setTo] = useState(() => ymd(new Date()));
  const [pick, setPick] = useState<string>(initialPerson ?? OVERALL);
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Come back to what was last looked at - unless the page itself names a person.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(`${MEMORY}:${mode}`) ?? 'null') as {
        period?: PeriodKey;
        from?: string;
        to?: string;
        pick?: string;
      } | null;
      if (!saved) return;
      if (saved.period && PERIODS.some((p) => p.key === saved.period)) setPeriod(saved.period);
      if (saved.from) setFrom(saved.from);
      if (saved.to) setTo(saved.to);
      if (mode === 'team' && !initialPerson && saved.pick) setPick(saved.pick);
    } catch {
      /* nothing saved */
    }
  }, [mode, initialPerson]);
  useEffect(() => {
    try {
      sessionStorage.setItem(`${MEMORY}:${mode}`, JSON.stringify({ period, from, to, pick }));
    } catch {
      /* fine without it */
    }
  }, [mode, period, from, to, pick]);

  const customBad = period === 'custom' && Boolean(from && to && from > to);
  const win = useMemo(() => windowOf(period, from, to), [period, from, to]);
  const prevWin = useMemo(() => previousOf(win), [win]);
  const winKey = `${win.from ?? ''}|${win.to ?? ''}`;

  useEffect(() => {
    if (customBad) return;
    let live = true;
    setLoading(true);
    setFailed(false);
    const owner = mode === 'person' ? personId : undefined;
    const run = async (): Promise<Loaded> => {
      const [now, prev] = await Promise.all([
        countsFor(win, owner),
        prevWin ? countsFor(prevWin, owner).catch(() => null) : Promise.resolve(null),
      ]);
      let people: { id: string; name: string }[] = [];
      if (mode === 'team') {
        // Every salesperson, so somebody idle still appears, plus any other owner in the
        // window (a handler holding leads) so nobody with work is missing.
        const owners = [...now.keys()].filter(Boolean);
        const q =
          `where[or][0][role][equals]=sales` +
          owners
            .map((id, j) => `&where[or][${j + 1}][id][equals]=${encodeURIComponent(id)}`)
            .join('');
        const u = await fetch(
          `/api/users?${q}&depth=0&limit=500&pagination=false&select[name]=true&select[email]=true`,
          { credentials: 'include' },
        );
        const users = u.ok
          ? (((await u.json()) as { docs?: { id: unknown; name?: string; email?: string }[] })
              .docs ?? [])
          : [];
        const named = new Map(
          users.map((x) => [String(x.id), personCase(x.name || x.email || '')]),
        );
        const ids = new Set([...users.map((x) => String(x.id)), ...owners]);
        people = [...ids].map((id) => ({ id, name: named.get(id) || `User ${id}` }));
      }
      return { now, prev, people };
    };
    run()
      .then((d) => {
        if (!live) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      live = false;
    };
    // winKey stands in for `win` and `prevWin`, which are fresh objects every render.
  }, [mode, personId, winKey, customBad, attempt]);

  /** Every review this card can show, for the current window, and the one before it. */
  const reviews = useMemo(() => {
    if (!data) return null;
    const total = sumAll(data.now);
    const prevTotal = data.prev ? sumAll(data.prev) : null;
    const overall = buildReview((v) => total.get(v) ?? 0);
    const prevOverall = prevTotal ? buildReview((v) => prevTotal.get(v) ?? 0) : null;
    const people = data.people
      .map((p) => ({
        ...p,
        review: buildReview((v) => data.now.get(p.id)?.get(v) ?? 0),
        prev: data.prev ? buildReview((v) => data.prev?.get(p.id)?.get(v) ?? 0) : null,
      }))
      .sort(
        (a, b) =>
          (b.review.score ?? -1) - (a.review.score ?? -1) ||
          b.review.reviewed - a.review.reviewed ||
          a.name.localeCompare(b.name),
      );
    return { overall, prevOverall, people };
  }, [data]);

  // A remembered or filtered person who is not on the list any more falls back to Overall.
  const person =
    mode === 'team' && pick !== OVERALL ? reviews?.people.find((p) => p.id === pick) : undefined;
  const owner = mode === 'person' ? personId : person?.id;
  const review: Review | undefined = person ? person.review : reviews?.overall;
  const prevReview = person ? person.prev : reviews?.prevOverall;
  const teamScore = reviews?.overall.score ?? null;
  const vsTeam =
    person && person.review.score != null && teamScore != null
      ? person.review.score - teamScore
      : null;
  const trend =
    review?.score != null && prevReview?.score != null && prevReview.reviewed > 0
      ? review.score - prevReview.score
      : null;

  const links = Object.fromEntries(
    REVIEW_BUCKETS.map((b) => [b.key, listUrl(whereQuery(win, owner, b.statuses))]),
  );
  const pendingHref = listUrl(whereQuery(win, owner, REVIEW_PENDING));
  const allHref = listUrl(whereQuery(win, owner));
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';
  const insight = review ? insightOf(review) : null;
  const empty = review && review.reviewed === 0 && review.pending === 0;

  const chips = (
    <div className="mpm-rx__chips" role="radiogroup" aria-label="Period">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          role="radio"
          aria-checked={period === p.key}
          className={`mpm-rx__chip${period === p.key ? ' is-on' : ''}`}
          onClick={() => setPeriod(p.key)}
          title={p.label}
        >
          {period === p.key && <MIcon name="check" size={18} />}
          {p.key === 'custom' && period !== p.key && <MIcon name="calendar_month" size={18} />}
          {p.short}
        </button>
      ))}
    </div>
  );

  const toolbar = (
    <div className="mpm-rx__toolbar">
      {mode === 'team' && (
        <label className="mpm-rx__field">
          <span className="mpm-rx__field-ico" aria-hidden="true">
            <MIcon name={person ? 'person' : 'group'} size={20} />
          </span>
          <select
            className="mpm-rx__select"
            value={person ? person.id : OVERALL}
            onChange={(e) => setPick(e.target.value)}
            aria-label="Whose leads"
          >
            <option value={OVERALL}>
              Overall - whole team
              {reviews?.overall.score != null ? ` · ${reviews.overall.score}%` : ''}
            </option>
            {reviews?.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.review.score == null ? ' · no leads' : ` · ${p.review.score}%`}
                {needsCoaching(p.review) ? ' · needs coaching' : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      {chips}
      <a className="mpm-rx__btn" href={allHref}>
        <MIcon name="format_list_bulleted" size={18} />
        Open leads
      </a>
    </div>
  );

  const custom = period === 'custom' && (
    <div className="mpm-rx__dates">
      <label>
        <span>From</span>
        <input
          type="date"
          value={from}
          max={to || ymd(new Date())}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <span className="mpm-rx__dash" aria-hidden="true">
        –
      </span>
      <label>
        <span>To</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={ymd(new Date())}
          onChange={(e) => setTo(e.target.value)}
        />
      </label>
      {customBad && <span className="mpm-rx__err">The start date is after the end date.</span>}
    </div>
  );

  const badges = review && review.reviewed > 0 && (
    <div className="mpm-rx__badges">
      {trend != null && prevWin && (
        <span
          className={`mpm-rx__badge ${trend > 0 ? 'is-up' : trend < 0 ? 'is-down' : 'is-level'}`}
          title={`Previous period: ${rangeText(prevWin)} · ${prevReview?.score}% qualified`}
        >
          <MIcon
            name={trend > 0 ? 'trending_up' : trend < 0 ? 'trending_down' : 'trending_flat'}
            size={16}
          />
          {trend === 0 ? 'Same as previous period' : `${Math.abs(trend)} pts vs previous period`}
        </span>
      )}
      {vsTeam != null && (
        <span
          className={`mpm-rx__badge ${vsTeam > 0 ? 'is-up' : vsTeam < 0 ? 'is-down' : 'is-level'}`}
          title={`Whole team, same dates: ${teamScore}% qualified`}
        >
          <MIcon name="group" size={16} />
          {vsTeam === 0
            ? 'Level with the team'
            : `${vsTeam > 0 ? '+' : '−'}${Math.abs(vsTeam)} pts vs team`}
        </span>
      )}
      {person && needsCoaching(person.review) && (
        <span className="mpm-rx__badge is-down mpm-rx__badge--flag">Needs coaching</span>
      )}
    </div>
  );

  let content: React.ReactNode;
  if (customBad) content = null;
  else if (failed)
    content = (
      <div className="mpm-rx__state">
        <p className="mpm-rx__state-title">The leads could not be loaded</p>
        <div className="mpm-rx__state-actions">
          <button type="button" className="mpm-rx__chip" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </div>
      </div>
    );
  else if (!review)
    content = (
      <div className="mpm-rx__skeleton" aria-busy="true" aria-label="Loading the review">
        <span className="mpm-rx__sk-ring" />
        <span className="mpm-rx__sk-lines">
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  else if (empty)
    content = (
      <div className="mpm-rx__state">
        <span className="mpm-rx__state-ico" aria-hidden="true">
          <MIcon name="analytics" size={28} />
        </span>
        <p className="mpm-rx__state-title">
          No leads {person ? `for ${person.name.split(' ')[0]} ` : ''}in{' '}
          {period === 'custom' ? 'these dates' : periodLabel.toLowerCase()}
        </p>
        <p className="mpm-rx__state-sub">Try a longer period.</p>
        <div className="mpm-rx__state-actions">
          {(['quarter', 'year', 'all'] as PeriodKey[])
            .filter((k) => k !== period)
            .map((k) => (
              <button key={k} type="button" className="mpm-rx__chip" onClick={() => setPeriod(k)}>
                {PERIODS.find((p) => p.key === k)?.label}
              </button>
            ))}
        </div>
      </div>
    );
  else
    content = (
      <div className={`mpm-rx__chart${loading ? ' is-loading' : ''}`} aria-busy={loading}>
        <ReviewDonut
          review={review}
          title={title}
          period={periodLabel}
          links={links}
          pendingHref={pendingHref}
          card={false}
          below={badges}
        />
        {insight && (
          <p className="mpm-rx__insight">
            <MIcon name={insight.icon} size={18} />
            <span>{insight.text}</span>
          </p>
        )}
      </div>
    );

  return (
    <article
      className={variant === 'card' ? 'mpm-card mpm-rv-card mpm-rx' : 'mpm-rx mpm-rx--plain'}
      aria-label={title}
    >
      <style>{REVIEW_CSS + EXPLORER_CSS}</style>
      <header className="mpm-rx__head">
        <span className="mpm-rx__head-ico" aria-hidden="true">
          <MIcon name="analytics" size={20} />
        </span>
        <div>
          <h3>{title}</h3>
          {lede && <p>{lede}</p>}
        </div>
      </header>
      {toolbar}
      {custom}
      {content}
    </article>
  );
}

const EXPLORER_CSS = `
.mpm-rx--plain{
  margin:8px 0 28px; padding:22px 24px; border:1px solid var(--rv-line);
  border-radius:20px; background:var(--rv-paper);
}
.mpm-rx__head{ display:flex; align-items:flex-start; gap:14px; margin-bottom:18px; }
.mpm-rx__head-ico{
  display:grid; place-items:center; width:40px; height:40px; border-radius:12px; flex:none;
  background:var(--mpm-sel,#D3E3FD); color:var(--mpm-on-sel,#041E49);
}
.mpm-rx__head h3{ margin:0; font:400 22px/1.25 var(--mpm-font-display,inherit); color:var(--rv-ink); letter-spacing:0; }
.mpm-rx__head p{ margin:4px 0 0; font-size:13px; line-height:1.45; color:var(--rv-ink-3); }

/* ── Toolbar: whose · when · open ── */
.mpm-rx__toolbar{ display:flex; flex-wrap:wrap; align-items:center; gap:10px 12px; margin-bottom:12px; }
.mpm-rx__field{ position:relative; display:inline-flex; align-items:center; max-width:100%; }
.mpm-rx__field-ico{ position:absolute; left:12px; display:grid; color:var(--mpm-v-500,#0B57D0); pointer-events:none; }
.mpm-rx__select{
  font:inherit; font-size:14px; font-weight:500; color:var(--rv-ink); max-width:100%; min-width:250px;
  height:40px; padding:0 40px 0 42px; border-radius:999px; cursor:pointer;
  border:1px solid var(--mpm-rule,#C4C7C5); background:var(--rv-paper)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23444746'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") right 12px center / 20px no-repeat;
  appearance:none; -webkit-appearance:none; transition:background-color .15s, border-color .15s;
}
[data-theme="dark"] .mpm-rx__select{ background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23C4C7C5'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); }
.mpm-rx__select:hover{ background-color:var(--rv-hover); }
.mpm-rx__select:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:1px; }

/* Material 3 filter chips: outlined at rest, tonal with a tick when chosen. */
.mpm-rx__chips{ display:flex; flex-wrap:wrap; gap:8px; }
.mpm-rx__chip{
  display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 14px; border-radius:8px;
  font:inherit; font-size:13px; font-weight:500; letter-spacing:.01em; cursor:pointer; white-space:nowrap;
  border:1px solid var(--mpm-rule,#C4C7C5); background:transparent; color:var(--rv-ink-2);
  transition:background .15s, border-color .15s, color .15s;
}
.mpm-rx__chip:hover{ background:var(--rv-hover); }
.mpm-rx__chip:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:1px; }
.mpm-rx__chip.is-on{ background:var(--mpm-sel,#D3E3FD); border-color:transparent; color:var(--mpm-on-sel,#041E49); padding-left:8px; }
.mpm-rx__chip .m-icon{ flex:none; }

.mpm-rx__btn{
  margin-left:auto; display:inline-flex; align-items:center; gap:6px; height:40px; padding:0 14px; border-radius:999px;
  font-size:14px; font-weight:500; color:var(--mpm-v-500,#0B57D0); text-decoration:none; white-space:nowrap;
  transition:background .15s;
}
.mpm-rx__btn:hover{ background:color-mix(in srgb, var(--mpm-v-500,#0B57D0) 8%, transparent); }
.mpm-rx__btn:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:1px; }

/* Custom dates, in a quiet tray under the chips. */
.mpm-rx__dates{
  display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px; margin:0 0 12px;
  padding:10px 14px; border-radius:14px; background:var(--mpm-tint,#F1F3F4);
}
.mpm-rx__dates label{ display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--rv-ink-3); }
.mpm-rx__dates input{
  font:inherit; font-size:14px; height:36px; padding:0 10px; border-radius:8px;
  border:1px solid var(--mpm-rule,#C4C7C5); background:var(--rv-paper); color:var(--rv-ink); color-scheme:light dark;
}
.mpm-rx__dates input:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:1px; }
.mpm-rx__dash{ color:var(--rv-ink-3); }
.mpm-rx__err{ font-size:13px; font-weight:500; color:var(--mpm-danger-ink,#B3261E); }

/* ── Chart area ── */
.mpm-rx__chart{ padding-top:8px; transition:opacity .2s var(--rv-ease); }
.mpm-rx__chart.is-loading{ opacity:.5; pointer-events:none; }
.mpm-rx__badges{ display:flex; flex-wrap:wrap; justify-content:center; gap:6px; max-width:240px; }
.mpm-rx__badge{
  display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 10px 0 8px; border-radius:999px;
  font-size:12px; font-weight:500; white-space:nowrap; cursor:default;
}
.mpm-rx__badge--flag{ padding-left:10px; }
.mpm-rx__badge.is-up{ color:var(--mpm-ok-ink,#137333); background:color-mix(in srgb, var(--rv-qualified) 13%, transparent); }
.mpm-rx__badge.is-down{ color:var(--mpm-danger-ink,#B3261E); background:color-mix(in srgb, var(--rv-lost) 13%, transparent); }
.mpm-rx__badge.is-level{ color:var(--rv-ink-2); background:var(--mpm-tint,#F1F3F4); }
[data-theme="dark"] .mpm-rx__badge.is-up{ color:#81C995; }
[data-theme="dark"] .mpm-rx__badge.is-down{ color:#F28B82; }

/* The insight: one line of what to do, in the blue of a suggestion, not an alarm. */
.mpm-rx__insight{
  display:flex; align-items:flex-start; gap:10px; margin:20px 0 0; padding:12px 16px; border-radius:14px;
  background:color-mix(in srgb, var(--mpm-v-500,#0B57D0) 7%, transparent); color:var(--rv-ink-2);
  font-size:13px; line-height:1.5;
}
.mpm-rx__insight .m-icon{ flex:none; margin-top:1px; color:var(--mpm-v-500,#0B57D0); }

/* ── Loading skeleton ── */
.mpm-rx__skeleton{ display:grid; grid-template-columns:auto 1fr; gap:36px; align-items:center; padding:8px 0 4px; }
.mpm-rx__sk-ring{
  width:184px; height:184px; border-radius:50%;
  background:radial-gradient(circle, var(--rv-paper) 61px, transparent 62px), var(--mpm-tint,#F1F3F4);
  animation:mpm-rx-pulse 1.4s ease-in-out infinite;
}
.mpm-rx__sk-lines{ display:grid; gap:14px; max-width:520px; }
.mpm-rx__sk-lines i{ display:block; height:44px; border-radius:14px; background:var(--mpm-tint,#F1F3F4); animation:mpm-rx-pulse 1.4s ease-in-out infinite; }
.mpm-rx__sk-lines i:nth-child(2){ animation-delay:.15s; width:88%; }
.mpm-rx__sk-lines i:nth-child(3){ animation-delay:.3s; width:76%; }
@keyframes mpm-rx-pulse{ 0%,100%{ opacity:1; } 50%{ opacity:.45; } }

/* ── Empty and error states ── */
.mpm-rx__state{ display:grid; justify-items:center; gap:6px; padding:28px 12px 20px; text-align:center; }
.mpm-rx__state p{ margin:0; }
.mpm-rx__state-ico{ display:grid; place-items:center; width:56px; height:56px; border-radius:50%; margin-bottom:6px;
  background:var(--mpm-tint,#F1F3F4); color:var(--rv-ink-3); }
.mpm-rx__state-title{ font:400 18px/1.3 var(--mpm-font-display,inherit); color:var(--rv-ink); }
.mpm-rx__state-sub{ font-size:13px; color:var(--rv-ink-3); }
.mpm-rx__state-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:10px; }

@media (max-width:760px){
  .mpm-rx__btn{ margin-left:0; }
  .mpm-rx__skeleton{ grid-template-columns:1fr; justify-items:center; }
  .mpm-rx__sk-lines{ width:100%; }
}
@media (max-width:640px){
  .mpm-rx--plain{ padding:18px 16px; }
  .mpm-rx__field,.mpm-rx__select{ width:100%; min-width:0; }
  /* Chips scroll sideways on a phone rather than wrapping into three rows. */
  .mpm-rx__chips{ flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none; margin:0 -16px; padding:2px 16px; width:calc(100% + 32px); }
  .mpm-rx__chips::-webkit-scrollbar{ display:none; }
}
@media (prefers-reduced-motion:reduce){
  .mpm-rx *{ animation:none !important; transition:none !important; }
}
`;
