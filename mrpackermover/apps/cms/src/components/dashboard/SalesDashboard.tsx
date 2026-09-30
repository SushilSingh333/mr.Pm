import type { Payload } from 'payload';
import Link from 'next/link';
import { materialUrl } from '../icons/material.js';
import { MIcon } from '../icons/MIcon.js';
// CSS/ICONS/helpers still come from Dashboard, which imports this file back. That
// cycle is safe only because none of them are touched at module-initialisation time —
// they are read inside the component. The status list is NOT, which is exactly why it
// lives in its own leaf module.
import { CSS, ICONS, fmt, initial, safe } from './Dashboard.js';
import {
  CLOSED_STAGES,
  DATED_STAGES,
  LEAD_GROUPS,
  LEAD_SOURCES,
  LEAD_STATUS,
  NOTICE_DAYS,
  dueState,
  sourceLabel,
  exactTime,
  humanDuration,
  money,
  nextStep,
  ownerName,
  personCase,
  statusMeta,
} from './lead-status.js';
import { DuePrompt } from '../leads/DuePrompt.js';
import { PhoneButtons } from '../leads/PhoneActions.js';
import { loadRouting } from './lead-routing.js';
import { RoundRobin } from './RoundRobin.js';

/**
 * The lead desk, in two shapes.
 *
 *   handler — a distribution desk. Every lead is visible, the unowned ones a press away,
 *             plus who is in the rotation and how loaded they are.
 *   sales   — a personal queue. Only their own leads.
 *
 * ONE RULE GOVERNS THE WHOLE PAGE, and it is the rule an earlier version broke:
 *
 *   The four cards are WHEN — what needs a person right now, on fixed clocks.
 *   The stage buttons are WHERE — position in the pipeline.
 *   The table is WHO — the actual leads.
 *   Every card is a way into the one table, and no number is stated twice.
 *
 * That is why there is no bar chart of stages (the buttons carry those counts and can be
 * pressed), no second list of leads (the table has more on every row), and no strip of
 * KPIs (each of its three figures already had a home above it). An earlier version had
 * all three, and the same count appeared in up to four places — occasionally disagreeing
 * with itself, because two of those places were built on different query bases.
 *
 * There is now exactly one query base, `base()`. Everything counted on this page is
 * counted through it, so the buttons, the table and the pager cannot drift apart.
 *
 * WHY THE QUERIES ARE SCOPED BY HAND: Payload's Local API defaults to
 * `overrideAccess: true`, so `payload.find({ collection: 'leads' })` returns EVERY lead
 * regardless of the collection's access rules. A salesperson's dashboard that relied on
 * those rules would quietly leak the whole board while the Leads list beside it stayed
 * correctly restricted. Every query below passes an explicit `assignedTo` filter for the
 * sales role AND runs with `overrideAccess: false` and the user attached, so the access
 * layer is a second line of defence rather than the only one.
 */

/**
 * Where the leads came from. Values MUST match the `source` options on the Leads
 * collection - a mismatch here shows as a permanent zero rather than an error, which is
 * the failure mode that let an older dashboard label assigned leads "New" for weeks.
 */
const SOURCES = LEAD_SOURCES;

/**
 * The monogram that leads the customer cell.
 *
 * A list of forty leads is forty names set in the same size and the same weight, one
 * under another, and there is nothing for the eye to hold on to while it scans - the
 * complaint was that the column looked monotonous, and it did. An initial in a tinted
 * disc gives every row a different shape and a different colour at the point where the
 * eye enters it, without making any one row shout louder than another: the tints are
 * six quiet washes of the theme's own ramp, carrying no meaning at all. Everything that
 * DOES mean something on this board - ember for "act now", the stage pill, the waiting
 * rail - keeps its monopoly on meaningful colour.
 */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/**
 * Which of the six tints this name gets. A sum of its characters, so one customer keeps
 * the same colour on every board, every session - a name that moves colour between page
 * loads would be worse than no colour at all.
 */
function tone(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return sum % 6;
}

/**
 * "Ballia, Uttar Pradesh, India" is a Google Places string, and three quarters of it is
 * the same on every row. The city is the part that tells a coordinator anything, so the
 * route reads "Ballia → Noida" and the full address stays in the tooltip.
 */
const cityOf = (place?: string): string => (place ?? '').split(',')[0]?.trim() ?? '';

/** The stages where a lead has arrived but nobody has spoken to the customer yet. */
const FRESH = new Set(LEAD_GROUPS.find((g) => g.key === 'fresh')?.statuses ?? []);

/**
 * How a grouped button names itself in the URL.
 *
 * Groups and stages share one `filter` parameter, and two of them want the same word:
 * the "Follow-up" button next to the "Follow up" stage. Without the prefix both write
 * `filter=follow-up`, the group wins the lookup, and the exact stage becomes unreachable
 * while both buttons light up at once. The prefix makes the collision impossible rather
 * than merely unlikely - a stage value can never begin with `g-`, because the stages come
 * from the collection and the prefix is added here.
 */
const groupKey = (key: string): string => `g-${key}`;

/** The one filter that is neither a stage nor a group: this person's own queue. */
const QUEUE = 'queue';
const DUE = 'due';

/** One screen of leads. Ten rows is what fits above the fold on a laptop. */
const PAGE_SIZE = 10;

/**
 * How long a lead may be left before it is late.
 *
 * Two clocks, because the two failures are different sizes. A brand-new enquiry is being
 * shopped around right now - two hours without a call is already late. A quoted lead is a
 * slower conversation, and chasing it the same afternoon reads as pushy; three days of
 * silence is the point where it needs a nudge. The rail down the left of every row fills
 * against whichever of these two budgets applies to that lead.
 */
const FIRST_CALL_MS = 2 * 60 * 60 * 1000;
const STALE_MS = 3 * 24 * 60 * 60 * 1000;

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

/** Date windows offered on the board. `all` applies no constraint. */
export const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
] as const;
export type RangeKey = (typeof RANGES)[number]['key'];

/**
 * Turn a range key (or an explicit from/to pair) into a `createdAt` constraint.
 * Boundaries are computed in the server's local zone, which on the droplet is the zone
 * the team works in; a UTC day boundary would make "Today" start at 5:30 am IST.
 */
export function dateWhere(
  range: string | undefined,
  from?: string,
  to?: string,
): Record<string, unknown> | undefined {
  if (from || to) {
    // toISOString() throws RangeError on an unparseable date, and this runs in a server
    // component above every safe() wrapper on the page - so `?from=notadate` returned a
    // 500 for the whole dashboard rather than an empty filter. Verified: status 500.
    // It matters more than it used to, because the sidebar's alert now points people at
    // /admin with a query string, and query strings get edited and shared.
    const iso = (value: string, time: string): string | undefined => {
      const d = new Date(`${value}${time}`);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    };
    const c: Record<string, string> = {};
    const lo = from ? iso(from, 'T00:00:00') : undefined;
    const hi = to ? iso(to, 'T23:59:59.999') : undefined;
    if (lo) c.greater_than_equal = lo;
    if (hi) c.less_than_equal = hi;
    // Nothing parseable means no constraint, which is the same as "All time".
    return Object.keys(c).length ? { createdAt: c } : undefined;
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
  moveSize?: string;
  pickup?: string;
  dropLocation?: string;
  source?: string;
  status?: string;
  quotedLow?: number | null;
  quotedHigh?: number | null;
  createdAt?: string;
  updatedAt?: string;
  waitingSince?: string | null;
  dueAt?: string | null;
  assignedTo?: { id?: string | number; name?: string; email?: string } | string | number | null;
}
interface UserRow {
  id: string | number;
  name?: string;
  email?: string;
}
interface ProposalDoc {
  id: string | number;
  quoteNo?: string;
  amount?: number | null;
  status?: string;
  createdAt?: string;
  lead?: { id?: string | number } | string | number | null;
}

/** A relationship arrives as an id or as a populated document, depending on depth. */
const idOf = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'object') {
    const id = (v as { id?: string | number }).id;
    return id == null ? null : String(id);
  }
  return String(v);
};

/**
 * One line of the board: who, what move, where it got to, what to do next, the money,
 * the owner, and the two buttons that start the call.
 *
 * THE RAIL. Down the left edge of every open row is a 3px bar that fills from the bottom
 * as that lead spends its own patience budget - two hours for an uncalled new enquiry,
 * three days for anything already in conversation. Violet while there is time, amber past
 * two thirds, ember with a dot once it is over. A decided lead has no rail at all, so won
 * and lost rows visibly drop out of the column your eye runs down.
 *
 * It exists because the question this page answers is "who do I ring next", and that is
 * not a question about stages - it is a question about which of ten similar-looking rows
 * has been waiting longest relative to what it could stand. Reading ten "4d ago"s and
 * dividing each by its own deadline is work; a column of bars is not. Everything the rail
 * says is also written in words on the Next step line, so it is `aria-hidden` and nothing
 * depends on seeing colour.
 *
 * "Next step" is the other column an older dashboard never had. A status says where a
 * lead got to; it does not say whose turn it is. It is derived from the stage rather than
 * stored, so it cannot drift out of step with one.
 */
function BoardRow({
  lead,
  showOwner,
  proposal,
}: {
  lead: LeadDoc;
  showOwner: boolean;
  proposal?: ProposalDoc;
}): React.JSX.Element {
  const meta = statusMeta(lead.status);
  const step = nextStep(lead.status);
  const open = !CLOSED_STAGES.includes(lead.status ?? '');
  const fresh = FRESH.has(lead.status ?? '');
  /**
   * One stored field, so the number and the sort cannot disagree.
   *
   * The rule - arrival for a lead nobody has called, last-touched for anything further
   * along - now lives on the collection as `waitingSince`, because a rule applied only
   * here could be rendered but never sorted on. "Waiting longest" asked the database for
   * `updatedAt`, which for an assigned lead is a different clock from the one printed
   * beside it, and a lead waiting 48 days sorted below rows showing 43.
   *
   * The fallback reproduces the old derivation for any row written before the field
   * existed, so a board rendered against un-backfilled data still reads correctly.
   */
  const since = lead.waitingSince ?? (fresh ? lead.createdAt : (lead.updatedAt ?? lead.createdAt));
  const waited = since ? Date.now() - new Date(since).getTime() : NaN;
  const budget = fresh ? FIRST_CALL_MS : STALE_MS;
  const ratio = Number.isFinite(waited) ? waited / budget : NaN;
  let heat: 'none' | 'warm' | 'due' | 'late' =
    !open || !step.chase || !Number.isFinite(ratio)
      ? 'none'
      : ratio >= 1
        ? 'late'
        : ratio >= 0.6
          ? 'due'
          : 'warm';
  /**
   * A promised lead is not a neglected one.
   *
   * `dueAt` overrides the generic budget entirely, and that is the point of it. A
   * customer who asked to be rung on Thursday is not being ignored on Tuesday, but the
   * two-hour and three-day budgets could not know that, so the board used to be loudest
   * about the one lead where the right thing to do was nothing. With a date the row goes
   * quiet until the day, then becomes the loudest thing on the board if it passes.
   */
  const dueMs = lead.dueAt ? new Date(lead.dueAt).getTime() : NaN;
  const dueIn = Number.isFinite(dueMs) ? dueMs - Date.now() : NaN;
  const parked = Number.isFinite(dueIn) && dueIn > 0 && open;
  const overdue = Number.isFinite(dueIn) && dueIn <= 0 && open;

  if (parked) heat = 'none';
  else if (overdue) heat = 'late';

  const late = heat === 'late';

  const fullRoute = [lead.pickup, lead.dropLocation].filter(Boolean).join(' → ');
  const route = [cityOf(lead.pickup), cityOf(lead.dropLocation)].filter(Boolean).join(' → ');
  const who = personCase(lead.name ?? '') || 'Unnamed';
  const kind = [lead.service, lead.moveSize].filter(Boolean).join(' · ');
  const owner = ownerName(lead.assignedTo);
  const estimate =
    lead.quotedLow && lead.quotedHigh
      ? (Number(lead.quotedLow) + Number(lead.quotedHigh)) / 2
      : Number(lead.quotedHigh ?? lead.quotedLow ?? 0);

  /** How far down its own track this lead has travelled. Clamped so a dot is never
   *  clipped by the ends of the track. */
  const pin = Number.isFinite(ratio) ? Math.min(1, Math.max(0.04, ratio)) : 0;
  /**
   * What the Waiting column says.
   *
   * A dated lead answers a different question from an undated one - "when" rather than
   * "how long" - so it says so in words. "in 2d" and "2d late" are the same distance from
   * the same instant, and printing "2d" for both would be the kind of number that is
   * technically true and read backwards.
   */
  const due = lead.dueAt && open ? dueState(lead.dueAt) : null;
  const clock = !open
    ? 'closed'
    : due
      ? due.text
      : !Number.isFinite(waited)
        ? ''
        : humanDuration(waited);

  return (
    <div className="mpm-tbl__row">
      {/* ── WAITING ──────────────────────────────────────────────────────────
          The urgency used to be a 3px sliver welded to the left edge of the row, which
          is a shape you can only compare by squinting. It is a column now: every lead
          gets the SAME track, and its pin sits where that lead has got to through its
          own patience budget. Ten rows become ten dot heights on one baseline, which the
          eye ranks in a single sweep - and the elapsed time is written beside it, so
          nothing here depends on seeing colour or position alone. */}
      <div className="mpm-tbl__cell mpm-c-wait">
        {due ? (
          // A dated lead answers "when", not "how long", so it gets no rail at all - the
          // rail measures a budget being spent, and a promise is not a budget. The word
          // carries it, and the exact stamp is a hover away.
          <span className={`mpm-wait__due mpm-wait__due--${due.tone}`} title={due.exact}>
            {due.text}
          </span>
        ) : heat === 'none' ? (
          <span className="mpm-wait__done">{clock}</span>
        ) : (
          <>
            <span className="mpm-wait__track" data-heat={heat} aria-hidden="true">
              <span className="mpm-wait__pin" style={{ ['--p' as string]: `${pin * 100}%` }} />
            </span>
            <span className={`mpm-wait__time${late ? ' is-late' : ''}`}>{clock}</span>
          </>
        )}
      </div>

      <div className="mpm-tbl__cell mpm-c-who">
        <span className="mpm-mono" data-tone={tone(who)} aria-hidden="true">
          {initials(who)}
        </span>
        <span className="mpm-cell__stack">
          <Link href={`/admin/collections/leads/${lead.id}`} className="mpm-cell__name">
            {who}
          </Link>
          <span className="mpm-cell__sub" title={`Received ${exactTime(lead.createdAt)}`}>
            {lead.source ? sourceLabel(lead.source) : 'Lead'}
          </span>
        </span>
      </div>

      <div className="mpm-tbl__cell mpm-cell__stack mpm-c-move">
        <span className="mpm-cell__strong">{kind || 'Move not described'}</span>
        <span className="mpm-cell__sub" title={fullRoute || undefined}>
          {route || 'Area not given yet'}
        </span>
      </div>

      {/* Stage, back in a column of its own. It was folded under the next step to stop
          eleven bordered pills shouting; the pill is soft now - a tint, no border, ink
          text - and it earns the column back because "where is this lead" is a question
          you ask of the whole board at once, not of one row. */}
      <div className="mpm-tbl__cell mpm-c-status">
        <span className="mpm-stage" style={{ ['--c' as string]: meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* ── NEXT STEP, and the stage underneath it ───────────────────────────
          These were two columns saying related things, and the stage - a bordered pill
          in one of eleven hues - was the loudest object in a row whose actual job is to
          say what to do. The instruction leads now, in ink; the stage follows as a dot
          and a word. Eleven hues become eleven 6px dots, which is all the colour a
          status needs to be scannable. */}
      <div className="mpm-tbl__cell mpm-c-step">
        {/* On the day, the instruction becomes a question.
            Once the move's day has come, "Prepare for the move" is advice for a day that
            has passed; what this person has to do now is say whether it happened. The
            answer they already have in their head becomes one press, and the board's
            own hooks write the history from the stage change. */}
        {overdue ? (
          <DuePrompt id={lead.id} status={lead.status} />
        ) : (
          <span className={`mpm-cell__step${late ? ' is-late' : ''}`}>{step.label}</span>
        )}
      </div>

      {/* The proposal figure is the one we stand behind; the estimate is only what the
          website showed the customer. Both are useful and they are never merged, because
          opening a call on the wrong one loses the call. */}
      <div className="mpm-tbl__cell mpm-cell__stack mpm-cell__money mpm-c-quote">
        {proposal && proposal.amount ? (
          <>
            <Link
              href={`/admin/collections/proposals/${proposal.id}`}
              className="mpm-cell__strong mpm-cell__link"
            >
              {money(Number(proposal.amount))}
            </Link>
            <span className="mpm-cell__sub">{proposal.quoteNo ?? 'proposal'}</span>
          </>
        ) : estimate > 0 ? (
          <>
            <span className="mpm-cell__strong mpm-cell__strong--soft">{money(estimate)}</span>
            <span
              className="mpm-cell__sub"
              title={`Shown on the site: ${money(Number(lead.quotedLow ?? 0))} – ${money(Number(lead.quotedHigh ?? 0))}`}
            >
              estimate shown
            </span>
          </>
        ) : (
          <span className="mpm-cell__sub">—</span>
        )}
      </div>

      {showOwner && (
        <div className="mpm-tbl__cell mpm-c-owner">
          {owner ? (
            <>
              <span className="mpm-who" aria-hidden="true">
                {initial(owner)}
              </span>
              <span className="mpm-cell__owner">{personCase(owner)}</span>
            </>
          ) : (
            /* An owned row is a disc and a name; an unowned row used to be a word on its
               own, starting 24px to the left of every name above and below it, which is
               what made the column look unformatted. It gets the same disc - drawn as an
               empty slot rather than an initial, because that is exactly what it is. */
            <>
              <span className="mpm-who mpm-who--none" aria-hidden="true">
                +
              </span>
              <span className="mpm-cell__unassigned">Unassigned</span>
            </>
          )}
        </div>
      )}

      <div className="mpm-tbl__cell mpm-tbl__cell--dial">
        {/* The row already holds everything the opener needs, so the WhatsApp button is
            handed the lead rather than looking it up again. */}
        <PhoneButtons phone={lead.phone} lead={lead} />
      </div>
    </div>
  );
}

export interface SalesViewProps {
  payload: Payload;
  user: { id?: string | number; name?: string; email?: string; role?: string };
  range: string;
  from?: string;
  to?: string;
  /** Which button is pressed: a group (`g-…`), an exact status, `proposal`, or `queue`. */
  filter?: string;
  /** Free-text search over name, phone and the two ends of the move. */
  q?: string;
  /** Handler only: a salesperson's id, or `none` for the unclaimed pile. */
  owner?: string;
  source?: string;
  page?: string;
  /** `updatedAt` for longest-untouched first; anything else means newest first. */
  sort?: string;
}

export async function SalesDashboard(props: SalesViewProps): Promise<React.JSX.Element> {
  const { payload, user, range, from, to } = props;
  const isHandler = user.role === 'handler';
  const me = user.id;
  const window = dateWhere(range, from, to);

  // "New" is the word for a lead nobody owns, so it can never describe one of a
  // salesperson's own - a button stuck at zero teaches people to ignore the row.
  const EXACT_STAGES = isHandler ? LEAD_STATUS : LEAD_STATUS.filter((x) => x.value !== 'new');

  const filterKey = props.filter && props.filter !== 'all' ? props.filter : 'all';
  const search = (props.q ?? '').trim();
  const ownerFilter = isHandler ? (props.owner ?? '') : '';
  const sourceFilter = props.source ?? '';
  const page = Math.max(1, Number(props.page) || 1);
  // Two values, nothing else accepted: the parameter reaches a `sort` on a live query.
  // `updatedAt` is still the value carried in the URL: it is what every bookmarked and
  // shared board link already says, and renaming it would quietly change what those
  // links do. What it MEANS is "longest waiting", and that is now a field of its own.
  /**
   * "newest" is spelled out rather than left as the absence of a parameter.
   *
   * It used to be: no `sort` in the URL meant newest-first. That worked until a dated
   * board wanted a different default, because then "no parameter" had two meanings -
   * "nobody chose" and "somebody chose newest" - and pressing Newest first on a
   * schedule set the parameter to nothing, which the default immediately overrode. The
   * button did nothing at all. An explicit value can be distinguished from silence.
   */
  const sortBy =
    props.sort === 'updatedAt' ? 'waitingSince' : props.sort === 'dueAt' ? 'dueAt' : '-createdAt';
  /** True when the filter bar is narrowing the board beyond its stage buttons. */
  const narrowed = Boolean(search || ownerFilter || sourceFilter);

  /** Role scope only. No date window, no filter bar - "is it mine" and nothing else. */
  const roleScope = (extra?: Record<string, unknown>): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [];
    if (!isHandler) and.push({ assignedTo: { equals: me } });
    if (extra) and.push(extra);
    return and.length ? { and } : {};
  };

  /**
   * THE query base. Role, date window, search box, owner and source - everything the
   * filter bar is asking for except the stage buttons themselves, so that a button's
   * count and the table underneath it always agree.
   *
   * There used to be a second base for the charts, differing only in that it ignored the
   * search box. Typing a name then made one stage show two different numbers in two
   * places on the same screen. The charts are gone and so is the second base; if you find
   * yourself wanting one, that is the bug asking to be reintroduced.
   */
  const base = (extra?: Record<string, unknown>): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [];
    if (!isHandler) and.push({ assignedTo: { equals: me } });
    if (window) and.push(window);
    if (search) {
      and.push({
        or: [
          { name: { like: search } },
          { phone: { like: search } },
          { pickup: { like: search } },
          { dropLocation: { like: search } },
        ],
      });
    }
    if (ownerFilter === 'none') and.push({ assignedTo: { exists: false } });
    else if (ownerFilter) and.push({ assignedTo: { equals: ownerFilter } });
    if (sourceFilter) and.push({ source: { equals: sourceFilter } });
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
        // Every caller here reads `docs` and throws the rest away, and the adapter runs a
        // separate COUNT for the totals nobody reads: findMany.js gates it on
        // `pagination !== false`. `limit` is applied either way (findManyArgs.limit is set
        // before that branch), so this drops one COUNT per call and changes no result.
        pagination: false,
        ...opts,
      } as never)) as { docs: unknown[] };
      return res.docs;
    }, []);

  /**
   * Proposals, read once, for three jobs: the money on each row of the board, the value
   * sitting with customers, and the "Proposal created" button - which cannot be a `where`
   * on leads, because a lead carries no flag saying one exists. Access is enforced, so a
   * salesperson sees only the proposals raised against their own leads.
   *
   * Read whole rather than paged: proposals are raised by hand, a few a day at most, and
   * the limit is a guard against a runaway rather than a paging strategy.
   */
  const allProposals = (await find('proposals', {
    limit: 1000,
    sort: '-createdAt',
    depth: 0,
    // Five scalars are all this page reads. Without `select`, the adapter joins every
    // array sub-table on the row regardless of depth (buildFindManyArgs.js:
    // `const withTabledFields = select ? {} : { numbers:true, rels:true, texts:true }`),
    // and a proposal carries four of them - inventory, charges, services, terms. That is
    // a whole PDF's worth of rows fetched to print a rupee figure in a table cell.
    select: { quoteNo: true, amount: true, status: true, createdAt: true, lead: true },
  })) as ProposalDoc[];

  /** The newest proposal per lead - the list is newest first, so the first one wins. */
  const proposalByLead = new Map<string, ProposalDoc>();
  for (const p of allProposals) {
    const key = idOf(p.lead);
    if (key && !proposalByLead.has(key)) proposalByLead.set(key, p);
  }
  const proposalLeadIds = [...proposalByLead.keys()];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Last midnight-minus-a-millisecond. "Due today" has to include a callback promised for
  // 4pm this afternoon, which `<= now` would leave out of a list titled "today".
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  endOfToday.setMilliseconds(-1);
  // Two days' notice - see NOTICE_DAYS. A move booked for the 26th surfaces on the 24th,
  // which leaves a whole working morning to confirm a truck, chase a gate pass or find a
  // replacement packer. A notice that arrives the evening before leaves none.
  const endOfNotice = new Date(endOfToday);
  endOfNotice.setDate(endOfNotice.getDate() + NOTICE_DAYS);
  const endOfTomorrow = new Date(endOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const staleBefore = new Date(Date.now() - STALE_MS).toISOString();

  /**
   * This person's queue, which is the second card at the top of the page AND the `queue`
   * button on the board. One definition, used by both, so the number on the card and the
   * table it opens are the same query rather than two queries that ought to agree.
   *
   * Closed stages are excluded. Marking a lead invalid is how somebody clears a wrong
   * number off this queue; matching on ownership alone would leave it counted forever.
   *
   * Deliberately NOT date-windowed: a lead that arrived last week and still has nobody on
   * it is outstanding today, whatever the range buttons say.
   */
  const queueWhere = isHandler
    ? { and: [{ assignedTo: { exists: false } }, { status: { not_in: CLOSED_STAGES } }] }
    : {
        and: [
          { assignedTo: { equals: me } },
          { acknowledgedAt: { exists: false } },
          { status: { not_in: CLOSED_STAGES } },
        ],
      };

  /**
   * Everything promised for today or earlier, and not yet answered.
   *
   * Window-free for the same reason the queue is: a callback promised for last Thursday
   * is owed today whatever the range buttons say, and a date filter that could hide it
   * would be hiding the one thing this exists to surface.
   *
   * Scoped through `roleScope` rather than `base`, so a handler sees every promise the
   * desk has made and a salesperson sees only their own - the same rule as every other
   * count on this board, applied by the same helper.
   */
  const dueWindow = (from: Date | null, to: Date) =>
    roleScope({
      and: [
        ...(from ? [{ dueAt: { greater_than: from.toISOString() } }] : []),
        { dueAt: { less_than_equal: to.toISOString() } },
        { status: { not_in: CLOSED_STAGES } },
      ],
    });

  // Everything worth knowing about now: already missed, owed today, or owed inside the
  // notice window.
  const dueWhere = dueWindow(null, endOfNotice);

  const [
    pillByStatus,
    proposalPillCount,
    queueTotal,
    dueTotal,
    dueOverdue,
    dueTodayCount,
    dueTomorrowCount,
    dueSoonCount,
    oldestRaw,
    teamRaw,
    assignedRaw,
    routing,
    newToday,
    newTodayUntouched,
    newYesterday,
    quotedOpen,
    quotedStale,
    wonMonth,
    lostMonth,
  ] = await Promise.all([
    // One count per stage, under everything the filter bar is asking for. The buttons
    // read straight off this - and so do the grouped buttons, as the sum of their stages
    // rather than a query of their own, so the two can never disagree.
    Promise.all(LEAD_STATUS.map((s) => count(base({ status: { equals: s.value } })))),
    proposalLeadIds.length ? count(base({ id: { in: proposalLeadIds } })) : Promise.resolve(0),
    count(queueWhere),
    count(dueWhere),
    // Three counts rather than one, because "3 promised" and "1 of them was due last
    // Tuesday" are different sentences and only the second one should make somebody
    // move. The strip prints whichever of them are not zero.
    count(dueWindow(null, startOfToday)),
    count(dueWindow(startOfToday, endOfToday)),
    count(dueWindow(endOfToday, endOfTomorrow)),
    count(dueWindow(endOfTomorrow, endOfNotice)),
    // The one that has waited longest, named on the card. The queue runs newest-first
    // when you open it, so without this the worst case is at the bottom or off the end.
    find('leads', { limit: 1, sort: 'createdAt', depth: 0, where: queueWhere }),
    isHandler ? find('users', { limit: 50, depth: 0, where: { role: { equals: 'sales' } } }) : [],
    // Enough to read a median from without pulling the whole table. Window-free, because
    // the card it feeds is window-free. A salesperson never sees it: it measures how fast
    // their handler distributes work, which is not their number.
    isHandler
      ? find('leads', {
          limit: 200,
          sort: '-createdAt',
          depth: 0,
          where: roleScope({ assignedAt: { exists: true } }),
        })
      : [],
    loadRouting(payload, user),

    // ── The four cards. Fixed windows on purpose: "did anything arrive today" is not a
    //    question about the range buttons, and a card that moved under them would be
    //    answering something else while looking like it answered this.
    count(roleScope({ createdAt: { greater_than_equal: startOfToday.toISOString() } })),
    count(
      roleScope({
        and: [
          { createdAt: { greater_than_equal: startOfToday.toISOString() } },
          { status: { in: [...FRESH] } },
        ],
      }),
    ),
    count(
      roleScope({
        and: [
          { createdAt: { greater_than_equal: startOfYesterday.toISOString() } },
          { createdAt: { less_than: startOfToday.toISOString() } },
        ],
      }),
    ),
    count(roleScope({ status: { equals: 'quoted' } })),
    count(
      roleScope({
        and: [{ status: { equals: 'quoted' } }, { updatedAt: { less_than: staleBefore } }],
      }),
    ),
    count(
      roleScope({
        and: [
          { status: { equals: 'won' } },
          { createdAt: { greater_than_equal: startOfMonth.toISOString() } },
        ],
      }),
    ),
    count(
      roleScope({
        and: [
          { status: { equals: 'lost' } },
          { createdAt: { greater_than_equal: startOfMonth.toISOString() } },
        ],
      }),
    ),
  ]);

  const pillCounts = new Map(LEAD_STATUS.map((s, i) => [s.value, pillByStatus[i] ?? 0]));
  const sumOf = (statuses: string[]): number =>
    statuses.reduce((a, v) => a + (pillCounts.get(v) ?? 0), 0);
  const groupCounts = LEAD_GROUPS.map((g) => ({ ...g, count: sumOf(g.statuses) }));
  const maxGroup = Math.max(1, ...groupCounts.map((g) => g.count));
  const boardTotal = sumOf(LEAD_STATUS.map((s) => s.value));

  const group = LEAD_GROUPS.find((g) => groupKey(g.key) === filterKey);
  const exact = LEAD_STATUS.find((s) => s.value === filterKey);
  const wantsProposals = filterKey === 'proposal';
  const wantsQueue = filterKey === QUEUE;
  const wantsDue = filterKey === DUE;

  /**
   * Is every lead on this board one with a date?
   *
   * If it is, the board is a schedule and a schedule reads soonest-first. Newest-first
   * is the right default for a pile of arriving enquiries and exactly wrong for a list
   * of booked moves: it puts next month's job above tomorrow morning's, which is the
   * one thing somebody scanning this column is trying not to miss.
   *
   * Derived from the stages the filter resolves to rather than named per filter, so the
   * Scheduled pill, the Call later pill and the promises preset all behave the same way
   * without any of them knowing about the others.
   */
  const datedView =
    wantsDue ||
    (group ? group.statuses.every((v) => DATED_STAGES.includes(v)) : false) ||
    (exact ? DATED_STAGES.includes(exact.value) : false);

  // Soonest-first unless the reader has said otherwise; their choice always wins.
  const effectiveSort = datedView && !props.sort ? 'dueAt' : sortBy;

  /**
   * The queue is the one filter that answers a card, so it is the one filter that must
   * equal that card exactly - it runs `queueWhere` alone rather than through `base()`.
   *
   * Through `base()` it picked up the date window and the filter bar, so pressing "Today"
   * left a chip reading "Unassigned leads · 3" two inches under a card reading 12, both
   * with the same words on them. Worse for a handler: "Assigned to me" ANDed `owner=me`
   * with `assignedTo exists:false` and produced a guaranteed-empty board with nothing on
   * screen explaining why. The controls that could contradict it are hidden while it is
   * on, and every stage button still leaves it.
   */
  const tableWhere = wantsQueue
    ? queueWhere
    : wantsDue
      ? // Same reasoning as the queue: this filter answers a count shown elsewhere, so it
        // runs its own where clause rather than going through `base()`, where the date
        // window would make the two disagree.
        dueWhere
      : base(
          group
            ? { status: { in: group.statuses } }
            : exact
              ? { status: { equals: exact.value } }
              : wantsProposals
                ? { id: { in: proposalLeadIds } }
                : undefined,
        );

  /**
   * A page of the board. An empty proposal list is answered without a query rather than
   * with an empty `in`, which adapters disagree about - one of them matching every row,
   * which is the exact opposite of what the button means.
   */
  const table =
    wantsProposals && proposalLeadIds.length === 0
      ? { docs: [] as LeadDoc[], totalDocs: 0, totalPages: 1, page: 1 }
      : await safe(
          async () => {
            const res = await payload.find({
              collection: 'leads',
              where: tableWhere as never,
              limit: PAGE_SIZE,
              page,
              // Under the due preset the board's own sort is the wrong question. A list
              // of promises reads in the order they come due - the one missed longest
              // first, tomorrow's last - and nobody opening it wants it newest-first.
              sort: effectiveSort,
              depth: 1,
              overrideAccess: false,
              user: user as never,
            });
            return {
              docs: res.docs as unknown as LeadDoc[],
              totalDocs: res.totalDocs,
              totalPages: res.totalPages,
              page: res.page ?? page,
            };
          },
          { docs: [] as LeadDoc[], totalDocs: 0, totalPages: 1, page: 1 },
        );

  const oldestWaiting = (oldestRaw as LeadDoc[])[0];
  const team = teamRaw as UserRow[];
  const firstName = personCase((user.name || user.email || '').split(/[@\s]/)[0] ?? '');
  const today = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  /**
   * Google's greeting: by the time of day, then the date on its own line. The server runs
   * on India time (next.config), so "morning" is a morning here.
   */
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /**
   * Open-lead load per person, shown against each name in the rotation.
   *
   * Over the rotation's own people rather than the sales list: a handler may be in the
   * rotation too, and a name in it with no number beside it reads as nobody.
   */
  const loadPeople: { id: string | number; name: string }[] = routing
    ? routing.people
    : team.map((t) => ({ id: t.id, name: t.name || t.email || `User ${t.id}` }));
  const loadPairs = await Promise.all(
    loadPeople.map(
      async (p) =>
        [
          String(p.id),
          await count({
            and: [{ assignedTo: { equals: p.id } }, { status: { not_in: CLOSED_STAGES } }],
          }),
        ] as const,
    ),
  );
  const load: Record<string, number> = Object.fromEntries(loadPairs);

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
  // Invalid leads are not in the denominator either: a wrong number was never winnable.
  const decidedMonth = wonMonth + lostMonth;
  const winRateMonth = decidedMonth > 0 ? Math.round((wonMonth / decidedMonth) * 100) : null;

  // Money, straight off the proposals already read. Only 'sent' is "out with a customer":
  // a draft has not left the building, and an accepted one is not waiting on anybody.
  const sum = (rows: ProposalDoc[]): number =>
    rows.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const valueOut = sum(allProposals.filter((p) => p.status === 'sent'));
  const valueWon = sum(
    allProposals.filter(
      (p) =>
        p.status === 'accepted' &&
        p.createdAt &&
        new Date(p.createdAt).getTime() >= startOfMonth.getTime(),
    ),
  );

  /** Payload's list view reads its filters straight off the query string. */
  // The handler's route to bulk assignment, which lives on the Leads list rather than
  // here. It must land on the same set this page counted, so the closed stages are
  // spelled into the query too.
  const unclaimedHref = `/admin/collections/leads?where[and][0][assignedTo][exists]=false${CLOSED_STAGES.map(
    (v, i) => `&where[and][1][status][not_in][${i}]=${v}`,
  ).join('')}`;

  /**
   * Every control on this page is a link, so the whole state of the board lives in the
   * URL: bookmarkable, shareable, rendered on the server, no client bundle. One builder,
   * so pressing a stage button cannot silently drop the search somebody typed - and so
   * every press lands back at the table rather than the top of the page.
   */
  const params: Record<string, string> = {};
  if (range) params.range = range;
  if (from) params.from = from;
  if (to) params.to = to;
  if (filterKey !== 'all') params.filter = filterKey;
  if (search) params.q = search;
  if (ownerFilter) params.owner = ownerFilter;
  if (sourceFilter) params.source = sourceFilter;
  if (page > 1) params.page = String(page);
  if (sortBy === 'waitingSince') params.sort = 'updatedAt';
  if (sortBy === 'dueAt') params.sort = 'dueAt';
  if (props.sort === 'newest') params.sort = 'newest';

  const link = (over: Record<string, string | undefined>, anchor = '#leads'): string => {
    const next: Record<string, string | undefined> = { ...params, ...over };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
    const s = sp.toString();
    return `${s ? `?${s}` : '?range=all'}${anchor}`;
  };
  // A stage button always starts at page one: pressing "Won / Lost" while on page 4 of
  // "Fresh" would otherwise land on an empty table that looks like an empty pipeline.
  const filterLink = (key: string): string =>
    link({ filter: key === 'all' ? undefined : key, page: undefined });
  // The queue card opens the queue with nothing else applied, so the figure on the card
  // and the figure under the table are the same query rather than two that ought to match.
  const queueLink = link({
    filter: QUEUE,
    range: 'all',
    q: undefined,
    owner: undefined,
    source: undefined,
    page: undefined,
    sort: undefined,
  });
  /**
   * What the queue is called, in one place: the card and the chip under the board both
   * say it, and two spellings of one number is the thing this dashboard is built to avoid.
   * Plain words over a phrase - "Unassigned leads" is what a handler calls them out loud,
   * and it matches the "Unassigned" the owner column already shows on each row.
   */
  const QUEUE_LABEL = isHandler ? 'Unassigned leads' : 'New to you';

  /**
   * The tray's face. When it is closed but an exact status is chosen, the summary BECOMES
   * that status's button - dot, label, count - rather than saying "More statuses", so the
   * primary row is never silent about where you are.
   */
  const face = exact
    ? { label: exact.label, color: exact.color, count: pillCounts.get(exact.value) ?? 0 }
    : wantsProposals
      ? { label: 'Proposal created', color: 'var(--v-500)', count: proposalPillCount }
      : null;
  const parentGroup = exact
    ? LEAD_GROUPS.find((g) => g.statuses.includes(exact.value))?.key
    : undefined;

  /**
   * ONE CARD MAY SHOUT. NOT THREE.
   *
   * Every card that had something wrong used to raise its own ember footnote, so on a
   * normal Monday three of the four were orange at once - and a screen where everything
   * is urgent has no urgent on it. They are ranked instead, and only the worst one is
   * promoted: unowned leads beat quotes gone quiet, which beats uncalled arrivals,
   * because that is the order in which a lead is actually lost.
   *
   * The others keep their words. They just stop competing for the eye.
   */
  const alarm: 'queue' | 'stale' | 'uncalled' | null =
    queueTotal > 0
      ? 'queue'
      : quotedStale > 0
        ? 'stale'
        : newTodayUntouched > 0
          ? 'uncalled'
          : null;

  const showingFrom = table.totalDocs === 0 ? 0 : (table.page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(table.page * PAGE_SIZE, table.totalDocs);
  const filtering = filterKey !== 'all' || narrowed;

  const emptyLine = wantsQueue
    ? isHandler
      ? 'Every lead has an owner. Nothing waiting.'
      : 'You have opened everything. Nothing new.'
    : filtering
      ? search
        ? `Nothing matches “${search}”.`
        : 'Nothing matches this filter.'
      : isHandler
        ? 'No leads yet. They will land here as they come in.'
        : 'Nothing has been given to you yet.';

  return (
    <div className="mpm-dash">
      <style>{CSS}</style>
      <style>{EXTRA_CSS}</style>

      <header className="mpm-head">
        <div className="mpm-head__text">
          <h1 className="mpm-h1">{firstName ? `${greeting}, ${firstName}` : greeting}</h1>
          <p className="mpm-head__date">{today}</p>
        </div>
        {/* One button each, and not the same one. A salesperson cannot hold a lead they
            created - `assignedTo` is handler-only on update, so the record would save and
            immediately leave their view - and a handler's quote button would duplicate the
            sidebar CTA that is on screen at all times anyway. */}
        {isHandler ? (
          <Link className="mpm-btn" href="/admin/collections/leads/create">
            Add lead
          </Link>
        ) : (
          <Link className="mpm-btn" href="/admin/collections/proposals/create">
            New quote
          </Link>
        )}
      </header>

      {/* ── What needs a person right now ─────────────────────────────────────
          Four fixed clocks: what arrived today, what has nobody on it, what is sitting
          with customers, what closed this month. Each is a way into the board below with
          the matching filter already applied. */}
      <section className="mpm-stats">
        <Link
          className="mpm-stat"
          style={{ ['--c' as string]: 'var(--info)' }}
          href={link({ range: 'today', filter: undefined, page: undefined })}
        >
          <span className="mpm-stat__label">
            <MIcon name="inbox" size={20} className="mpm-stat__ico" /> New today
          </span>
          <strong className="mpm-stat__value">{fmt(newToday)}</strong>
          {/* Google Analytics' comparison: an arrow and the change in a tinted chip, then
              what it is compared with. Green for more leads, red for fewer. */}
          <span className="mpm-stat__delta">
            <span
              className="mpm-trend"
              data-dir={
                newToday === newYesterday ? 'flat' : newToday > newYesterday ? 'up' : 'down'
              }
            >
              <MIcon
                name={
                  newToday === newYesterday
                    ? 'trending_flat'
                    : newToday > newYesterday
                      ? 'trending_up'
                      : 'trending_down'
                }
                size={16}
              />
              {newToday === newYesterday
                ? 'same'
                : newToday > newYesterday
                  ? `+${fmt(newToday - newYesterday)}`
                  : `-${fmt(newYesterday - newToday)}`}
            </span>{' '}
            vs yesterday
          </span>
          <span className={`mpm-stat__foot${alarm === 'uncalled' ? ' is-warn' : ''}`}>
            {newToday === 0
              ? 'nothing new yet today'
              : newTodayUntouched > 0
                ? `${fmt(newTodayUntouched)} not called yet`
                : `every one called · ${fmt(newYesterday)} yesterday`}
          </span>
        </Link>

        <Link
          className={`mpm-stat${alarm === 'queue' ? ' is-alarm' : ''}`}
          style={{ ['--c' as string]: 'var(--ember)' }}
          href={queueLink}
        >
          <span className="mpm-stat__label">
            <MIcon
              name={isHandler ? 'person_add' : 'notifications_active'}
              size={20}
              className="mpm-stat__ico"
            />{' '}
            {QUEUE_LABEL}
          </span>
          <strong className="mpm-stat__value">{fmt(queueTotal)}</strong>
          <span
            className="mpm-stat__delta"
            title={
              isHandler && waits.length > 0
                ? `Median over the last ${fmt(waits.length)} leads that were given an owner`
                : undefined
            }
          >
            {queueTotal === 0
              ? isHandler
                ? 'every lead has an owner'
                : 'all clear'
              : isHandler
                ? Number.isFinite(medianWait)
                  ? `usually assigned within ${humanDuration(medianWait)}`
                  : 'none assigned yet to time it by'
                : 'you have not opened them yet'}
          </span>
          {/* How long, then who. The wait is what decides whether this card is an alarm,
              so it leads; the name is there to find the lead by, and it is the part that
              gives way - truncated, never wrapped - so a long name cannot push this card's
              divider out of line with the other three. */}
          <span
            className={`mpm-stat__foot mpm-stat__foot--who${alarm === 'queue' ? ' is-warn' : ''}`}
          >
            {queueTotal > 0 && oldestWaiting?.createdAt ? (
              <>
                <span className="mpm-stat__wait">
                  longest wait{' '}
                  {humanDuration(Date.now() - new Date(oldestWaiting.createdAt).getTime())}
                </span>
                <span className="mpm-stat__who">
                  {personCase(oldestWaiting.name ?? '') || 'Unnamed'}
                </span>
              </>
            ) : (
              'nothing waiting'
            )}
          </span>
        </Link>

        <Link
          className={`mpm-stat${alarm === 'stale' ? ' is-alarm' : ''}`}
          style={{ ['--c' as string]: 'var(--warm)' }}
          href={link({
            filter: groupKey('quoted'),
            range: 'all',
            sort: 'updatedAt',
            page: undefined,
          })}
        >
          <span className="mpm-stat__label">
            <MIcon name="request_quote" size={20} className="mpm-stat__ico" /> Quotes waiting for
            reply
          </span>
          <strong className="mpm-stat__value">{fmt(quotedOpen)}</strong>
          <span className="mpm-stat__delta">
            {valueOut > 0
              ? `${money(valueOut)} out with customers`
              : quotedOpen > 0
                ? 'none marked sent yet'
                : 'nothing out with customers'}
          </span>
          <span className={`mpm-stat__foot${alarm === 'stale' ? ' is-warn' : ''}`}>
            {quotedStale > 0
              ? `${fmt(quotedStale)} quiet for three days or more`
              : quotedOpen > 0
                ? 'all chased in the last three days'
                : 'nothing waiting on a customer'}
          </span>
        </Link>

        <Link
          className="mpm-stat"
          style={{ ['--c' as string]: 'var(--ok)' }}
          href={link({ range: 'month', filter: groupKey('closed'), page: undefined })}
        >
          <span className="mpm-stat__label">
            <MIcon name="trophy" size={20} className="mpm-stat__ico" /> Won this month
          </span>
          <strong className="mpm-stat__value">{fmt(wonMonth)}</strong>
          <span className="mpm-stat__delta">
            {valueWon > 0 ? `${money(valueWon)} accepted` : 'nothing accepted yet'}
          </span>
          <span className="mpm-stat__foot">
            {decidedMonth > 0
              ? `${fmt(lostMonth)} lost · ${winRateMonth}% win rate`
              : quotedOpen > 0
                ? `${fmt(quotedOpen)} still deciding`
                : 'nothing decided this month'}
          </span>
        </Link>
      </section>

      {/* ── The board ────────────────────────────────────────────────────────
          One filter row over one table. Every count on it is pressable and every press
          is a URL. */}
      <article className="mpm-card mpm-board" id="leads">
        <div className="mpm-card__head">
          <h3>
            <span className="mpm-card__ico" aria-hidden="true">
              {ICONS.list}
            </span>
            {isHandler ? 'Leads' : 'Your leads'}
          </h3>
          {/* Bulk assignment lives on the Leads list, not here, so when a handler is
              looking at the unowned queue this link becomes the way to act on it. */}
          {isHandler && wantsQueue ? (
            <Link className="mpm-link mpm-open" href={unclaimedHref}>
              assign them in the full list →
            </Link>
          ) : (
            <Link className="mpm-link mpm-open" href="/admin/collections/leads">
              open the full list →
            </Link>
          )}
        </div>

        {/* Both of these narrow the board rather than moving it through the pipeline, so
            they share a row: which days, and whose. */}
        {!wantsQueue && !wantsDue && (
          <nav className="mpm-ranges" aria-label="Date range">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={link({ range: r.key, page: undefined })}
                className={`mpm-link mpm-range${(range || 'all') === r.key ? ' is-on' : ''}`}
              >
                {r.label}
              </Link>
            ))}
            {/* A handler routes work and also carries some. The owner select below can
              already do this, but nothing on the page said so - the only way to find your
              own leads was to guess that a dropdown labelled "Anyone" had a "Me" in it.
              Deliberately carries no count: the number of open leads each person holds,
              this handler included, is already on the rotation list further down, and a
              second copy here would be the same figure on two different scopes. Press it
              and the pager underneath says how many. */}
            {isHandler && me !== undefined && (
              <Link
                href={link({
                  owner: ownerFilter === String(me) ? undefined : String(me),
                  page: undefined,
                })}
                className={`mpm-link mpm-range mpm-range--mine${
                  ownerFilter === String(me) ? ' is-on' : ''
                }`}
                title={
                  ownerFilter === String(me)
                    ? 'Show leads owned by anyone'
                    : 'Show only the leads assigned to you'
                }
              >
                Assigned to me
              </Link>
            )}
          </nav>
        )}

        {/* A GET form, so its result is a URL like every other control here and no client
            JavaScript is involved. Hidden while the queue preset is on: it cannot narrow
            that view without making its count disagree with the card that opened it, and
            the same search is a press away through the owner select once the preset is
            cleared. */}
        {/* Search and the two selects are here on arrival rather than behind a button.
            A handler's first move most mornings is to look someone up, and a control that
            has to be found and opened before it can be used is one press in the way of the
            thing the page is for. */}
        {!wantsQueue && !wantsDue && (
          <div className="mpm-find">
            <form className="mpm-filterbar" method="get" action="/admin">
              <input type="hidden" name="range" value={range || 'all'} />
              {from && <input type="hidden" name="from" value={from} />}
              {to && <input type="hidden" name="to" value={to} />}
              {filterKey !== 'all' && <input type="hidden" name="filter" value={filterKey} />}
              {sortBy === 'waitingSince' && <input type="hidden" name="sort" value="updatedAt" />}
              {sortBy === 'dueAt' && <input type="hidden" name="sort" value="dueAt" />}
              {props.sort === 'newest' && <input type="hidden" name="sort" value="newest" />}
              <span className="mpm-search">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4 4" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search by name, phone or area"
                  aria-label="Search leads"
                />
              </span>
              {isHandler && (
                <select
                  className="mpm-select"
                  name="owner"
                  defaultValue={ownerFilter}
                  aria-label="Owner"
                >
                  <option value="">Anyone</option>
                  <option value="none">Unassigned</option>
                  {me !== undefined && <option value={String(me)}>Me</option>}
                  {team.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {t.name || t.email}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="mpm-select"
                name="source"
                defaultValue={sourceFilter}
                aria-label="Source"
              >
                <option value="">All sources</option>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button className="mpm-btn mpm-btn--sm" type="submit">
                Apply
              </button>
              {narrowed && (
                <Link
                  className="mpm-link mpm-clear"
                  href={link({
                    q: undefined,
                    owner: undefined,
                    source: undefined,
                    page: undefined,
                  })}
                >
                  clear
                </Link>
              )}
            </form>
          </div>
        )}

        {/* ── Promised today ──
            The notification, such as it is: no push, no email, just the first thing on
            the board the moment anything is owed. It outranks everything else here
            because a promise made to a customer beats a lead nobody has got to yet - one
            is a broken commitment, the other is only work.

            Hidden while the due filter is on: the strip's whole job is to send you there,
            and a banner announcing the list you are already reading is the duplication
            this board has been pruned of twice. */}
        {dueTotal > 0 && !wantsDue && (
          <p className="mpm-due">
            {/* Ember only when something is actually owed. A day's notice about tomorrow
                is information, not an alarm, and painting it the same colour as a missed
                promise is how a board teaches people to stop reading its warnings. */}
            <Link
              className="mpm-due__chip"
              data-tone={dueOverdue + dueTodayCount > 0 ? 'act' : 'soon'}
              href={filterLink(DUE)}
            >
              <span className="mpm-due__dot" aria-hidden="true" />
              <span className="mpm-due__n">{fmt(dueTotal)}</span>
              <span className="mpm-due__word">
                {dueTotal === 1 ? 'promise coming up' : 'promises coming up'}
              </span>
              {/* Only the non-zero parts, so the line says what is true rather than
                  printing three numbers of which two are zero. */}
              {dueOverdue > 0 && (
                <span className="mpm-due__seg mpm-due__seg--late">{fmt(dueOverdue)} overdue</span>
              )}
              {dueTodayCount > 0 && (
                <span className="mpm-due__seg mpm-due__seg--today">{fmt(dueTodayCount)} today</span>
              )}
              {dueTomorrowCount > 0 && (
                <span className="mpm-due__seg">{fmt(dueTomorrowCount)} tomorrow</span>
              )}
              {dueSoonCount > 0 && (
                <span className="mpm-due__seg">{fmt(dueSoonCount)} in 2 days</span>
              )}
              <span className="mpm-due__go" aria-hidden="true">
                →
              </span>
            </Link>
          </p>
        )}

        {/* The queue is the one filter that is not a stage, so it says so in its own
            words. Its count is the table's own total, which is the number that reconciles
            it with the stage buttons underneath. */}
        {wantsDue && (
          <p className="mpm-preset">
            <span className="mpm-preset__chip">
              Promised, next {NOTICE_DAYS} days · {fmt(table.totalDocs)}
              <Link
                className="mpm-preset__x"
                href={filterLink('all')}
                aria-label="Clear this filter"
                title="Show all leads"
              >
                ×
              </Link>
            </span>
          </p>
        )}

        {wantsQueue && (
          <p className="mpm-preset">
            <span className="mpm-preset__chip">
              {QUEUE_LABEL} · {fmt(table.totalDocs)}
              <Link
                className="mpm-preset__x"
                href={filterLink('all')}
                aria-label="Clear this filter"
                title="Show all leads"
              >
                ×
              </Link>
            </span>
          </p>
        )}

        {/* Six buttons. A group is the sum of its stages, so they add up to the board
            instead of counting anybody twice, and the 2px underbar gives the shape of the
            pipeline inside the control that already carries the number. */}
        <nav className="mpm-pills" aria-label="Lead stage">
          <Link
            href={filterLink('all')}
            className={`mpm-pill mpm-pill--all${filterKey === 'all' ? ' is-on' : ''}`}
            title="Everything in this date window"
          >
            All leads <b>{fmt(boardTotal)}</b>
          </Link>
          {groupCounts.map((g) => (
            <Link
              key={g.key}
              href={filterLink(groupKey(g.key))}
              style={{
                ['--c' as string]: g.color,
                ['--p' as string]: `${Math.round((g.count / maxGroup) * 100)}%`,
              }}
              className={`mpm-pill${filterKey === groupKey(g.key) ? ' is-on' : ''}${
                parentGroup === g.key ? ' is-parent' : ''
              }`}
              title={g.hint}
            >
              <i aria-hidden="true" /> {g.label} <b>{fmt(g.count)}</b>
            </Link>
          ))}
        </nav>

        {/* Every exact stage, plus the one cut that is not a stage at all, behind a native
            disclosure. Closed by default because six buttons answer most questions and
            eighteen answer none of them faster. The server opens it when an exact stage is
            chosen, so the state survives navigation without a parameter of its own. */}
        <details className="mpm-tray" open={Boolean(face)}>
          <summary
            className={`mpm-pill mpm-pill--more${face ? ' is-on' : ''}`}
            style={face ? { ['--c' as string]: face.color } : undefined}
          >
            {face ? (
              <>
                <i aria-hidden="true" /> {face.label} <b>{fmt(face.count)}</b>
              </>
            ) : (
              'More statuses'
            )}
            <span className="mpm-tray__caret" aria-hidden="true">
              ▾
            </span>
          </summary>
          <nav className="mpm-tray__body" aria-label="Exact status">
            {EXACT_STAGES.map((s) => (
              <Link
                key={s.value}
                href={filterLink(s.value)}
                style={{ ['--c' as string]: s.color }}
                className={`mpm-pill${filterKey === s.value ? ' is-on' : ''}`}
              >
                <i aria-hidden="true" /> {s.label} <b>{fmt(pillCounts.get(s.value) ?? 0)}</b>
              </Link>
            ))}
            <Link
              href={filterLink('proposal')}
              style={{ ['--c' as string]: 'var(--v-500)' }}
              className={`mpm-pill${wantsProposals ? ' is-on' : ''}`}
              title="Leads with a proposal raised against them, at any stage"
            >
              <i aria-hidden="true" /> Proposal created <b>{fmt(proposalPillCount)}</b>
            </Link>
          </nav>
        </details>

        {table.docs.length === 0 ? (
          <p className="mpm-empty">
            {emptyLine}{' '}
            {filtering && (
              <Link
                className="mpm-link mpm-empty__out"
                href={link({
                  filter: undefined,
                  q: undefined,
                  owner: undefined,
                  source: undefined,
                  page: undefined,
                })}
              >
                show everything →
              </Link>
            )}
          </p>
        ) : (
          <div className={`mpm-tbl ${isHandler ? 'mpm-tbl--handler' : 'mpm-tbl--sales'}`}>
            <div className="mpm-tbl__head">
              <span>Waiting</span>
              <span>Customer</span>
              <span>Move</span>
              <span>Status</span>
              <span>Next step</span>
              <span>Quote</span>
              {isHandler && <span>Owner</span>}
              <span>Contact</span>
            </div>
            {table.docs.map((l) => (
              <BoardRow
                key={String(l.id)}
                lead={l}
                showOwner={isHandler}
                proposal={proposalByLead.get(String(l.id))}
              />
            ))}
          </div>
        )}

        <div className="mpm-pager">
          <span className="mpm-pager__count">
            <span
              className="mpm-legend"
              title="The dot shows how much of this lead's waiting time is spent"
            >
              <i aria-hidden="true" /> out of time
            </span>
            {table.totalDocs === 0
              ? 'Nothing to show'
              : `Showing ${fmt(showingFrom)}–${fmt(showingTo)} of ${fmt(table.totalDocs)}`}
          </span>

          <span className="mpm-sort">
            {/* Offered only where it means something: on a board of undated leads it
                would sort almost entirely on nulls. */}
            {datedView && (
              <Link
                className={`mpm-sort__opt${effectiveSort === 'dueAt' ? ' is-on' : ''}`}
                href={link({ sort: 'dueAt', page: undefined })}
              >
                Soonest first
              </Link>
            )}
            <Link
              className={`mpm-sort__opt${effectiveSort === '-createdAt' ? ' is-on' : ''}`}
              href={link({ sort: datedView ? 'newest' : undefined, page: undefined })}
            >
              Newest first
            </Link>
            <Link
              className={`mpm-sort__opt${effectiveSort === 'waitingSince' ? ' is-on' : ''}`}
              href={link({ sort: 'updatedAt', page: undefined })}
            >
              Waiting longest
            </Link>
          </span>

          <span className="mpm-pager__btns">
            {table.page > 1 ? (
              <Link className="mpm-page" href={link({ page: String(table.page - 1) })}>
                Previous
              </Link>
            ) : (
              <span className="mpm-page is-off">Previous</span>
            )}
            {table.page < table.totalPages ? (
              <Link className="mpm-page" href={link({ page: String(table.page + 1) })}>
                Next
              </Link>
            ) : (
              <span className="mpm-page is-off">Next</span>
            )}
          </span>
        </div>
      </article>

      {/* ── The team ─────────────────────────────────────────────────────────
          Handlers only, and the only thing on this page that is not a lead: who is in the
          rotation, how much each of them is holding, and the switch that shares new work
          out. `loadRouting` swallows its own failures and returns null - which used to
          take the team's workload down with it - so there is a plain card behind it. */}
      {isHandler && (
        <section className="mpm-grid">
          {routing ? (
            <RoundRobin {...routing} load={load} />
          ) : (
            <article className="mpm-card">
              <div className="mpm-card__head">
                <h3>
                  <span className="mpm-card__ico" aria-hidden="true">
                    {ICONS.briefcase}
                  </span>
                  Team
                </h3>
              </div>
              <p className="mpm-rr__lede">
                Auto-assign is unavailable right now. Give leads an owner from the list.
              </p>
              {loadPeople.length === 0 ? (
                <p className="mpm-empty">No salespeople yet.</p>
              ) : (
                <ul className="mpm-team">
                  {loadPeople
                    .slice()
                    .sort((a, b) => (load[String(b.id)] ?? 0) - (load[String(a.id)] ?? 0))
                    .map((p) => (
                      <li key={String(p.id)} className="mpm-team__row">
                        <span className="mpm-avatar" aria-hidden="true">
                          {initial(p.name)}
                        </span>
                        <span className="mpm-team__name">{personCase(p.name)}</span>
                        <span className="mpm-team__load">
                          {(load[String(p.id)] ?? 0) === 0 ? 'free' : fmt(load[String(p.id)] ?? 0)}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </article>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Everything this page needs that the shared admin sheet has no equivalent for.
 *
 * Scoped under `.mpm-dash` where it overrides a shared rule, so the admin dashboard,
 * which imports the same base sheet, is untouched by anything decided here.
 */
const EXTRA_CSS = `
.mpm-dash{
  /* PIXELS, NOT REM, AND THE REASON MATTERS.
     Payload sets html{font-size:13px} (@payloadcms/ui/dist/scss/vars.scss:17,
     $baseline-body-size:13px) and 12px at <=1024px. Every rem here was therefore being
     multiplied by 0.8125: the "28px" figure rendered at 22.75px, "14px" row text at
     11.4px, the "11px" uppercase label at 8.9px, and the 4px spacing base at 3.25px.
     The whole page was about a fifth smaller and tighter than it was drawn, which is
     most of why it read as cramped rather than composed. Nothing below is relative to a
     root this page does not control. */
  /* Type — six steps, and each one has exactly one job. */
  --t-display:28px;   /* the four figures, and nothing else on the page */
  --t-title:18px;     /* the greeting and the card headings */
  --t-body:14px;      /* everything in a table row that is a fact */
  --t-meta:13px;      /* controls: buttons, chips, selects, pager */
  --t-sub:12px;       /* the quiet second line under a fact */
  --t-micro:11px;     /* uppercase labels only, never a sentence */
  /* Space — a real 4px base. */
  --s-1:4px; --s-1h:6px; --s-2:8px; --s-3:12px;
  --s-4:16px; --s-5:24px; --s-6:32px;
  /* Curves, as asked for: a full pill on anything you press, a generous 20px on a card.
     One radius per role, so nothing looks accidentally square next to something round. */
  --r-1:12px; --r-2:20px; --r-pill:999px;
  --info:#2C6BF0; --ok:var(--mpm-ok,#0E7C4A); --warm:var(--mpm-warn,#A36A00);
  /* 20px was a landing-page radius. This is a tool people use between phone calls. */
  --card-radius:14px;
  --ember:var(--mpm-ember-ink,#C24200);
  --ember-bg:color-mix(in srgb, var(--ember) 9%, transparent);
  /* Two shadows everywhere: 1px of contact that sits an object on the page, and a wide
     soft lift that gives it height. One blurred drop shadow reads as a sticker. */
  --lift-1:0 1px 2px color-mix(in srgb, var(--mpm-shadow,rgba(15,21,35,.13)) 45%, transparent),
           0 12px 26px -18px var(--mpm-shadow,rgba(15,21,35,.13));
  --lift-2:0 1px 2px color-mix(in srgb, var(--mpm-shadow,rgba(15,21,35,.13)) 60%, transparent),
           0 22px 44px -22px var(--mpm-shadow,rgba(15,21,35,.13));
}
[data-theme="dark"] .mpm-dash{ --ember-bg:color-mix(in srgb, var(--ember) 16%, transparent); }

/* ── Header ────────────────────────────────────────────────────────────────
   The greeting is the least informative thing here, so it is set at heading size rather
   than display size: the four figures below it are then the biggest objects on the page,
   which is the correct order for a desk somebody scans between calls. */
.mpm-head{display:flex;align-items:center;justify-content:space-between;gap:var(--s-4);
  flex-wrap:wrap;margin:0 0 var(--s-4)}
.mpm-h1{display:flex;align-items:baseline;gap:var(--s-2);margin:0;
  font-size:var(--t-title);font-weight:700;letter-spacing:-.015em;color:var(--ink)}
.mpm-head__date{font-size:var(--t-meta);font-weight:600;color:var(--ink-3)}
.mpm-btn{display:inline-flex;align-items:center;gap:var(--s-1);
  min-height:38px;padding:0 var(--s-5);
  border:1px solid transparent;border-radius:var(--r-pill);
  background:linear-gradient(140deg,var(--v-400),var(--v-600));color:#fff;
  font-size:var(--t-meta);font-weight:600;font-family:inherit;text-decoration:none;
  white-space:nowrap;cursor:pointer;
  box-shadow:0 1px 2px rgba(15,21,35,.10),
             0 10px 20px -12px color-mix(in srgb,var(--v-600) 85%,transparent);
  transition:transform .12s ease,filter .12s ease,box-shadow .12s ease}
.mpm-btn:hover{filter:brightness(1.06);transform:translateY(-1px);color:#fff;
  box-shadow:0 1px 2px rgba(15,21,35,.12),
             0 14px 26px -12px color-mix(in srgb,var(--v-600) 95%,transparent)}
.mpm-btn:active{transform:translateY(0)}
.mpm-btn--sm{min-height:34px;padding:0 var(--s-4)}
.mpm-btn:focus-visible{outline:2px solid var(--v-400);outline-offset:2px}

/* ── The four cards ────────────────────────────────────────────────────────
   A coloured cap on the left edge is this page's one gesture for "this object carries a
   stage or an urgency" - the same move as the status badge and the row rail, so three
   different things are read the same way. */
.mpm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--s-3);margin:0 0 var(--s-5)}
.mpm-stat{--c:var(--v-500);position:relative;overflow:hidden;
  display:flex;flex-direction:column;gap:0;height:100%;
  padding:18px 18px 16px;background:var(--paper);
  border-radius:var(--r-2);border:1px solid var(--line);
  box-shadow:var(--lift-1);text-decoration:none;
  transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease}
/* The accent is a bar across the TOP of the card, not a cap on its side: on a 20px
   radius a left cap has to fight the curve at both ends and always looks clipped. */
.mpm-stat::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;
  background:var(--c);opacity:.9}
/* Tier two. Exactly one card on the page may wear this - see the alarm rank in the
   component. It is the only card with a tinted ground and a heavier edge, which is what
   makes it findable without anything else having to get louder. */
.mpm-stat.is-alarm{border-color:color-mix(in srgb,var(--ember) 30%,var(--line));
  background:var(--ember-bg)}
.mpm-stat.is-alarm::before{background:var(--ember);opacity:1;height:4px}
/* Hover fills are guarded, because a phone has no hover to leave.
   Touch browsers apply :hover to the last thing tapped and keep it applied until you tap
   elsewhere - so on a 390px screen a card or a row stayed washed in its accent colour
   after every press, which reads as a selected state that cannot be cleared. Seen on the
   real emulated device, not guessed. Colour-only text hovers are left alone: a link that
   stays violet after a tap says nothing false. */
@media (hover:hover){
  a.mpm-stat:hover{transform:translateY(-2px);box-shadow:var(--lift-2);
    border-color:color-mix(in srgb,var(--c) 38%,var(--line))}
}
a.mpm-stat:focus-visible{outline:2px solid var(--v-400);outline-offset:2px}
.mpm-stat__label{display:flex;align-items:center;gap:var(--s-1h);margin-bottom:10px;
  font-size:var(--t-micro);font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--ink-3)}
.mpm-stat__label i{width:7px;height:7px;border-radius:50%;background:var(--c);flex:none}
.mpm-stat__value{margin-bottom:6px;font-size:var(--t-display);font-weight:700;
  line-height:1;letter-spacing:-.025em;color:var(--ink);font-variant-numeric:tabular-nums}
.mpm-stat__delta{margin-bottom:12px;font-size:var(--t-sub);font-weight:600;color:var(--ink-2)}
/* The supporting lines step back so the figure leads. */
.mpm-stat__foot{font-size:11px}
/* Pinned to the bottom of the card, so the four dividers land on ONE line however long
   each card's delta sentence runs. Four rules at four heights is the detail that makes a
   set of cards look assembled rather than designed. */
.mpm-stat__foot{margin-top:auto;padding-top:11px;border-top:1px solid var(--line);
  font-size:var(--t-sub);color:var(--ink-3)}
.mpm-stat__foot.is-warn{color:var(--ember);font-weight:600}
/* The queue card's foot: the wait keeps its width, the name takes what is left and
   ellipsises. A dot between them rather than a comma, like every other meta line here. */
.mpm-stat__foot--who{display:flex;align-items:baseline;gap:6px;min-width:0}
.mpm-stat__wait{flex:none;white-space:nowrap}
.mpm-stat__who{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-weight:500;color:var(--ink-2)}
.mpm-stat__who::before{content:"·";margin-right:6px;color:var(--ink-3)}
.mpm-stat__foot.is-warn .mpm-stat__who{color:inherit;font-weight:600}

/* The four dividers on one line, even when a sentence wraps.
   "margin-top:auto" pins each foot to the bottom of its card, which lines the dividers up
   only while every foot is one line tall. Two cards to a row on a phone, and "1 quiet for
   three days or more" wraps where "0 lost" does not - the two rules sat 20px apart.
   Subgrid gives every card in a row the SAME four row lines (label, figure, sentence,
   foot), so each divider starts where its neighbour's does however long any of the text
   runs. Browsers without subgrid keep the flex layout above, which is only ever off by a
   line of text. */
@supports (grid-template-rows:subgrid){
  .mpm-stat{display:grid;grid-row:span 4;grid-template-rows:subgrid;row-gap:0;height:auto}
  .mpm-stat__foot{margin-top:0;align-self:start}
  /* A shared row is as tall as the tallest label in it, so a one-line label beside a
     wrapped one ("UNASSIGNED / LEADS" on a phone) floated to the middle of the gap. Both
     start at the top, and the dot sits on the first line rather than between two. */
  .mpm-stat__label{align-self:start;align-items:flex-start}
  .mpm-stat__label i{margin-top:calc((1lh - 7px) / 2)}
}

/* ── The board ─────────────────────────────────────────────────────────────── */
.mpm-board{margin:0 0 var(--s-5);padding:var(--s-5);border-radius:var(--r-2);
  border:1px solid var(--line);background:var(--paper);box-shadow:var(--lift-1);
  scroll-margin-top:var(--s-4)}
.mpm-dash .mpm-card__head{margin-bottom:var(--s-3)}
.mpm-dash .mpm-card__head h3{font-size:var(--t-title)}
.mpm-open{font-size:var(--t-meta);font-weight:600;color:var(--v-500);white-space:nowrap}
.mpm-open:hover{text-decoration:underline}

.mpm-ranges{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-1h);margin:0 0 var(--s-3)}
.mpm-range{display:inline-flex;align-items:center;min-height:34px;padding:0 var(--s-4);
  border:1px solid var(--line);border-radius:var(--r-pill);color:var(--ink-2);
  background:var(--paper);
  font-size:var(--t-meta);font-weight:600;text-decoration:none;
  transition:border-color .12s ease,color .12s ease,background .12s ease}
.mpm-range:hover{border-color:var(--v-500);color:var(--v-500)}
.mpm-range.is-on{background:var(--v-500);border-color:var(--v-500);color:#fff}
.mpm-range.is-on:hover{color:#fff}
/* Pushed to the far end of the row: it is a different question from the four beside it
   (whose, not when), and the gap is what says so. */
.mpm-range--mine{margin-left:auto}

/* The find bar. Always here, never behind a button. */
.mpm-find{margin:0 0 var(--s-3)}
.mpm-filterbar{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2);margin:0}
.mpm-search{flex:1 1 240px;display:flex;align-items:center;gap:var(--s-2);min-width:0;
  min-height:38px;padding:0 var(--s-4);border-radius:var(--r-pill);color:var(--ink-3);
  border:1px solid var(--line);background:var(--mpm-tint,var(--paper))}
.mpm-search:focus-within{border-color:var(--v-500);color:var(--v-500)}
.mpm-search input{flex:1;min-width:0;align-self:stretch;border:0;outline:none;
  background:transparent;font-size:var(--t-body);font-family:inherit;color:var(--ink)}
.mpm-select{min-height:38px;padding:0 var(--s-3);border-radius:var(--r-pill);
  border:1px solid var(--line);background:var(--paper);color:var(--ink-2);
  font-size:var(--t-meta);font-family:inherit;max-width:176px}
.mpm-clear{font-size:var(--t-meta);font-weight:600;color:var(--ink-3)}
.mpm-clear:hover{color:var(--v-500)}

/* ── Promised today ──
   The loudest thing on the board when anything is owed, and absent entirely when nothing
   is. Ember, because it means the same here as everywhere else on this page: a person
   has to act. It is a link across its whole width - the count is not the target, the
   sentence is. */
/* ── The question in the row ──
   Three buttons at most, small, and only on a row that is actually due - the column is
   an instruction the rest of the time. Yes leads in the accent; No and Tomorrow stay
   quiet, because a board whose buttons all shout equally is one where the common answer
   is as hard to find as the rare one. */
.mpm-duep{display:flex;flex-direction:column;gap:var(--s-1h);min-width:0}
.mpm-duep__q{font-size:var(--t-sub);font-weight:600;color:var(--ember);line-height:1.3}
.mpm-duep__btns{display:flex;flex-wrap:wrap;gap:var(--s-1)}
.mpm-duep__btn{border:1px solid var(--line);background:var(--paper);color:var(--ink-2);
  border-radius:var(--r-pill);padding:3px 10px;min-height:26px;
  font-size:var(--t-sub);font-weight:600;font-family:inherit;cursor:pointer;
  white-space:nowrap;transition:border-color .12s,background .12s,color .12s}
.mpm-duep__btn:hover:not(:disabled){border-color:var(--v-500);color:var(--v-500)}
.mpm-duep__btn:disabled{opacity:.5;cursor:default}
.mpm-duep__btn--yes{background:var(--v-500);border-color:var(--v-500);color:#fff}
.mpm-duep__btn--yes:hover:not(:disabled){filter:brightness(1.06);color:#fff}
.mpm-duep__err{font-size:var(--t-micro);color:var(--danger,#B42318);font-weight:600}

.mpm-due{margin:0 0 var(--s-3)}
.mpm-due__chip{display:inline-flex;align-items:center;gap:var(--s-2);flex-wrap:wrap;
  padding:var(--s-2) var(--s-4);border-radius:var(--r-pill);
  background:var(--ember-bg);border:1px solid color-mix(in srgb,var(--ember) 32%,transparent);
  color:var(--ink);font-size:var(--t-meta);font-weight:600;text-decoration:none}
.mpm-due__chip:hover{border-color:var(--c);
  background:color-mix(in srgb,var(--c) 14%,transparent)}
/* One variable decides the whole strip. "act" means a promise is owed now; "soon" is a
   day's notice, which is information rather than an alarm. */
.mpm-due__chip{--c:var(--ember)}
.mpm-due__chip[data-tone="soon"]{--c:var(--v-500);
  background:color-mix(in srgb,var(--v-500) 8%,transparent);
  border-color:color-mix(in srgb,var(--v-500) 30%,transparent)}
.mpm-due__dot{width:7px;height:7px;border-radius:50%;background:var(--c);flex:none;
  animation:mpm-due-pulse 2.4s ease-in-out infinite}
/* Only an alarm pulses. A heads-up that blinks all day is an alarm nobody can act on. */
.mpm-due__chip[data-tone="soon"] .mpm-due__dot{animation:none}
.mpm-due__n{font-size:var(--t-body);font-weight:700;font-variant-numeric:tabular-nums;
  color:var(--c)}
.mpm-due__word{color:var(--ink-2);font-weight:600}
.mpm-due__seg{padding:1px var(--s-2);border-radius:var(--r-pill);
  background:color-mix(in srgb,var(--ink) 7%,transparent);
  color:var(--ink-2);font-size:var(--t-sub);font-weight:600;
  font-variant-numeric:tabular-nums}
.mpm-due__seg--late,.mpm-due__seg--today{
  background:color-mix(in srgb,var(--ember) 16%,transparent);color:var(--ember);font-weight:700}
.mpm-due__go{color:var(--c);font-weight:700}
/* A slow pulse, not a flash. It has to be noticeable from across a desk and survivable
   for eight hours on the same screen. */
@keyframes mpm-due-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){ .mpm-due__dot{animation:none} }

/* The queue is not a stage, so it does not sit in the stage row pretending to be one. */
.mpm-preset{margin:0 0 var(--s-2)}
.mpm-preset__chip{display:inline-flex;align-items:center;gap:var(--s-2);
  padding:var(--s-1h) var(--s-2) var(--s-1h) var(--s-3);border-radius:var(--r-1);
  background:var(--ember-bg);border:1px solid color-mix(in srgb,var(--ember) 30%,transparent);
  color:var(--ink);font-size:var(--t-meta);font-weight:700;font-variant-numeric:tabular-nums}
.mpm-preset__x{display:grid;place-items:center;width:18px;height:18px;border-radius:4px;
  color:var(--ember);font-size:15px;line-height:1;text-decoration:none}
.mpm-preset__x:hover{background:color-mix(in srgb,var(--ember) 16%,transparent);color:var(--ember)}

.mpm-pills{display:flex;flex-wrap:wrap;gap:var(--s-1h);margin:0 0 var(--s-2)}
.mpm-pill{--c:var(--v-500);position:relative;display:inline-flex;align-items:center;
  gap:var(--s-1h);white-space:nowrap;min-height:34px;padding:0 var(--s-4);
  border:1px solid var(--line);border-radius:var(--r-pill);background:var(--paper);
  color:var(--ink-2);font-size:var(--t-meta);font-weight:600;text-decoration:none;
  transition:border-color .12s ease,background .12s ease,color .12s ease}
.mpm-pill i{width:7px;height:7px;border-radius:50%;background:var(--c);flex:none}
.mpm-pill b{font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
@media (hover:hover){
  .mpm-pill:hover{border-color:color-mix(in srgb,var(--c) 50%,var(--line));color:var(--ink)}
}
.mpm-pill:focus-visible{outline:2px solid var(--v-400);outline-offset:2px}
.mpm-pill.is-on{background:color-mix(in srgb,var(--c) 12%,transparent);
  border-color:color-mix(in srgb,var(--c) 45%,transparent);color:var(--ink)}
/* The group that contains the exact stage you drilled into, so the row still reads
   "inside Follow-up, specifically Call not picked". */
.mpm-pill.is-parent{border-color:color-mix(in srgb,var(--c) 45%,transparent)}
/* The shape of the pipeline, inside the control that already carries the number. */
.mpm-pill::after{content:"";position:absolute;left:var(--s-3);bottom:3px;height:2px;
  width:var(--p,0);max-width:calc(100% - 2*var(--s-3));border-radius:2px;
  background:color-mix(in srgb,var(--c) 55%,transparent)}
.mpm-pill--all.is-on{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.mpm-pill--all.is-on b{color:var(--paper)}

/* The tray. A native <details>: no script, and the server decides whether it starts open
   so the state survives navigation without a parameter of its own. */
.mpm-tray{margin:0 0 var(--s-3)}
.mpm-tray>summary{display:inline-flex;width:max-content;list-style:none;cursor:pointer}
.mpm-tray>summary::-webkit-details-marker{display:none}
.mpm-tray>summary:focus-visible{outline:2px solid var(--v-400);outline-offset:2px}
.mpm-tray__caret{margin-left:var(--s-1);font-size:10px;opacity:.6;transition:transform .12s ease}
.mpm-tray[open]>summary .mpm-tray__caret{transform:rotate(180deg)}
.mpm-tray__body{display:flex;flex-wrap:wrap;gap:var(--s-2);
  margin-top:var(--s-2);padding-top:var(--s-3);border-top:1px solid var(--line)}
/* Size alone carries the hierarchy: the tray needs no second colour scheme. */
.mpm-tray__body .mpm-pill{min-height:30px;padding:0 var(--s-3);font-size:var(--t-sub)}
.mpm-tray__body .mpm-pill::after{display:none}

/* ── The table ─────────────────────────────────────────────────────────────
   A grid rather than a <table>: the same markup becomes a stacked card on a phone by
   redefining the columns, which a real table cannot do without display hacks. */
.mpm-tbl{display:flex;flex-direction:column;border-top:1px solid var(--line)}
/* Between roughly 1025px and 1150px with Payload's nav OPEN, the seven columns at their
   minimums are wider than the 750-860px the nav leaves behind - and the grid tracks
   overflow the row's box, so the Contact column and its Call button sat outside the card
   and dragged the entire admin page into horizontal scroll. Measured at 1025: content
   column 750px, tracks 711px + gaps, page scrollWidth 1106 against a 1025 viewport.
   The stack breakpoint is 1000px, so nothing caught it.
   Scrolling the table inside its own card keeps every column full width and keeps the
   page still. Below 1000 the row is three stacked lines and needs neither. */
.mpm-tbl{overflow-x:auto;overscroll-behavior-x:contain}
.mpm-tbl__head,.mpm-tbl__row{min-width:min-content}
.mpm-tbl__head,.mpm-tbl__row{display:grid;align-items:center;gap:var(--s-3)}
.mpm-tbl--handler .mpm-tbl__head,.mpm-tbl--handler .mpm-tbl__row{
  grid-template-columns:74px minmax(140px,1.3fr) minmax(120px,1.1fr) 104px minmax(116px,1fr) 96px minmax(104px,.8fr) 74px}
.mpm-tbl--sales .mpm-tbl__head,.mpm-tbl--sales .mpm-tbl__row{
  grid-template-columns:74px minmax(160px,1.4fr) minmax(140px,1.2fr) 104px minmax(124px,1fr) 104px 74px}
.mpm-tbl__head{padding:var(--s-2) var(--s-1);border-bottom:1px solid var(--line);
  font-size:var(--t-micro);font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--ink-3)}
.mpm-tbl__row{position:relative;min-height:64px;
  padding:var(--s-2) var(--s-1);border-bottom:1px solid var(--line);
  transition:background .12s ease}
.mpm-tbl__row:last-child{border-bottom:0}
@media (hover:hover){
  .mpm-tbl__row:hover{background:var(--mpm-tint,color-mix(in srgb,var(--v-500) 5%,transparent))}
}
/* No wash on a late row. On a real board most rows are late most of the time, so a tinted
   background stopped being a signal and became the table's colour - and it drowned the
   rail, which is the thing that actually ranks them. The rail and the ember next step say
   it without repainting the row. */
.mpm-tbl__cell{min-width:0}
.mpm-tbl__cell--dial{display:flex;justify-content:flex-end;--dial:30px}
/* Two saturated circles on every row, fourteen to a screen, were brighter than the
   urgency signal beside them. They rest as outlines and fill on row hover - still one
   tap, no longer the first thing the eye lands on. Touch devices keep them filled,
   because there is no hover to reveal them with. */
/* Findable by colour, without fourteen solid discs competing with the urgency column.
   Each button keeps its own identity in the ICON - phone in the product blue, WhatsApp
   in WhatsApp green - on a tinted ground, and fills solid on row hover. You can pick the
   green one out at a glance; it just is not the brightest thing on the page. */
.mpm-tbl__cell--dial .mpm-dial__btn{box-shadow:none;border:1px solid transparent;
  transition:background .12s ease,color .12s ease,border-color .12s ease}
.mpm-tbl__cell--dial .mpm-dial__btn--call{
  background:color-mix(in srgb,var(--v-500) 12%,transparent);color:var(--v-600)}
.mpm-tbl__cell--dial .mpm-dial__btn--wa{
  background:color-mix(in srgb,#1FA855 14%,transparent);color:#15803D}
[data-theme="dark"] .mpm-tbl__cell--dial .mpm-dial__btn--call{color:var(--v-300,#9DB4FF)}
[data-theme="dark"] .mpm-tbl__cell--dial .mpm-dial__btn--wa{color:#4ADE80}
@media (hover:hover){
  .mpm-tbl__row:hover .mpm-tbl__cell--dial .mpm-dial__btn--call{
    background:var(--v-500);color:#fff}
  .mpm-tbl__row:hover .mpm-tbl__cell--dial .mpm-dial__btn--wa{
    background:#1FA855;color:#fff}
}
.mpm-tbl__cell--dial .mpm-dial__btn svg{width:13px;height:13px}
/* --dial is declared ON .mpm-dial itself (AdminTheme, 34px; 40px below 1024px), and a
   custom property set on the element beats one inherited from an ancestor - so the
   the --dial:30px that used to sit on this cell never applied to anything. Measured: two
   34px buttons plus a 5.2px gap = 73px inside a 59.8px track, overhanging the owner's
   name; in the 1001-1024 band AdminTheme's touch sizing made it 94px in 55px.
   Set on the dial itself, and only where the row is a real table row - the stacked phone
   layout keeps AdminTheme's thumb-sized buttons. */
@media (min-width:1001px){
  .mpm-tbl__cell--dial .mpm-dial{--dial:26px}
  .mpm-tbl__cell--dial .mpm-dial__btns{gap:var(--s-1)}
}
.mpm-cell__stack{display:flex;flex-direction:column;gap:1px;min-width:0}
.mpm-c-who .mpm-cell__stack{flex:1 1 auto}
/* The customer's name is the thing you click, not a headline.
   It was 15px at weight 650 with negative tracking - and 650 does not exist in the
   admin's system font stack, so the browser SYNTHESISED it by smearing the 700 glyphs.
   That faux-bold is what made it look thick and slightly out of focus next to every
   other word on the row. Standard weights only, from here on. */
.mpm-cell__name{font-size:var(--t-body);font-weight:600;color:var(--ink);
  text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── The customer cell ─────────────────────────────────────────────────────
   A monogram, then the name, then where the lead came from. The disc is what stops
   forty identical lines of 14px semibold reading as one grey block: a different letter
   and a different wash on every row, fixed per customer so it never moves. Six tints,
   all of them quiet - this is texture, not signal. */
.mpm-c-who{display:flex;align-items:center;gap:var(--s-2);min-width:0}
.mpm-mono{flex:none;display:grid;place-items:center;width:32px;height:32px;
  border-radius:10px;font-size:var(--t-sub);font-weight:700;letter-spacing:.02em;
  background:color-mix(in srgb,var(--tone) 13%,transparent);color:var(--tone-ink,var(--tone))}
.mpm-mono[data-tone="0"]{--tone:#2558E6;--tone-ink:#1D45B8}
.mpm-mono[data-tone="1"]{--tone:#0E7C4A;--tone-ink:#0B6039}
.mpm-mono[data-tone="2"]{--tone:#7A3DD1;--tone-ink:#6230A8}
/* No amber and no red among the six: ember and danger mean "act" and "lost" on this
   board, and a decorative disc must never be mistaken for either. */
.mpm-mono[data-tone="3"]{--tone:#3F4A7A;--tone-ink:#333C66}
.mpm-mono[data-tone="4"]{--tone:#0D6E89;--tone-ink:#0A566B}
.mpm-mono[data-tone="5"]{--tone:#B03060;--tone-ink:#8C264C}
/* On dark ground a 13% wash disappears and the ink is too dark to read, so both move. */
[data-theme="dark"] .mpm-mono{background:color-mix(in srgb,var(--tone) 30%,transparent);
  color:color-mix(in srgb,var(--tone) 45%,#FFFFFF)}
.mpm-cell__name:hover{color:var(--v-500);text-decoration:underline}
.mpm-cell__strong{font-size:var(--t-body);font-weight:600;color:var(--ink);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.mpm-cell__strong--soft{color:var(--ink-2)}
.mpm-cell__link{text-decoration:none}
.mpm-cell__link:hover{color:var(--v-500);text-decoration:underline}
.mpm-cell__sub{font-size:var(--t-sub);color:var(--ink-3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpm-cell__step{font-size:var(--t-body);font-weight:600;color:var(--ink-2)}
.mpm-cell__owner{display:block;font-size:var(--t-sub);font-weight:600;color:var(--ink-2);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Ember means one thing on this page: somebody has to act. It appears on the late rail,
   on a late next step, on an unowned lead, and on a warning footnote. Nowhere else. */
.mpm-cell__step.is-late,.mpm-cell__sub.is-late{color:var(--ember)}
.mpm-cell__unassigned{font-size:var(--t-sub);font-weight:700;color:var(--ember)}
.mpm-cell__money{align-items:flex-start}

/* The badge was 11px of stage-coloured text on a 14% tint of the same hue - #C98A00 on
   its own tint is 2.96:1, which fails AA outright. The hue moves to the border and the
   left cap, the text takes the page's ink, and all eleven stages pass at once. */
.mpm-dash .mpm-badge{display:inline-block;max-width:100%;
  padding:2px var(--s-2);border-radius:var(--r-1);
  background:color-mix(in srgb,var(--c) 13%,transparent);
  border:1px solid color-mix(in srgb,var(--c) 28%,transparent);border-left:3px solid var(--c);
  color:var(--ink);font-size:var(--t-micro);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
[data-theme="dark"] .mpm-dash .mpm-badge{background:color-mix(in srgb,var(--c) 22%,transparent)}

/* ── The waiting track ────────────────────────────────────────────────────
   The signature of this page, and the reason it is a column rather than an edge: a
   position on a shared scale is the one visual encoding the eye ranks accurately without
   counting. Every open lead gets the same 34px track, and its pin sits at the share of
   that lead's own patience budget already spent - two hours for an uncalled arrival,
   three days for a conversation already going - so a fresh lead and a quoted one are
   directly comparable even though their clocks run at completely different speeds.

   Decided leads have no track at all, so won, lost and invalid rows drop out of the
   column the eye runs down. The elapsed time is printed beside it, so nothing here is
   carried by colour or by position alone. */
.mpm-c-wait{display:flex;align-items:center;gap:var(--s-2)}
.mpm-wait__track{position:relative;flex:none;width:2px;height:32px;border-radius:2px;
  background:color-mix(in srgb,var(--ink-3) 20%,transparent)}
.mpm-wait__pin{position:absolute;left:50%;top:var(--p);width:8px;height:8px;
  margin:-4px 0 0 -4px;border-radius:50%;background:var(--heat);
  box-shadow:0 0 0 2px var(--paper)}
.mpm-wait__track[data-heat="warm"]{--heat:var(--v-500)}
.mpm-wait__track[data-heat="due"]{--heat:var(--warm)}
/* Past the deadline the pin has nowhere left to travel, so the track itself fills to say
   so - the difference between "nearly out of time" and "out of time". */
.mpm-wait__track[data-heat="late"]{--heat:var(--ember);
  background:color-mix(in srgb,var(--ember) 30%,transparent)}
/* The elapsed time reads as a measurement, not a warning: regular weight, quiet ink,
   tabular figures so the column lines up. It goes bold and ember only when the lead is
   actually out of time - which is the whole point of putting a number there. */
.mpm-wait__time{font-size:var(--t-sub);font-weight:500;color:var(--ink-2);
  font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;line-height:1.2}
.mpm-wait__time.is-late{color:var(--ember);font-weight:600}
/* ── A promised date in the Waiting column ──
   No rail: the rail measures a budget being spent, and a promise is not a budget - it is
   an appointment. Three tones, the same three the strip uses, so a row and the banner
   above it never disagree about how urgent the same lead is. */
.mpm-wait__due{font-size:var(--t-sub);font-weight:600;line-height:1.2;
  color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mpm-wait__due--late{color:var(--ember);font-weight:700}
.mpm-wait__due--today{color:var(--ember)}
.mpm-wait__due--tomorrow{color:var(--v-500)}
/* Two days out is a heads-up rather than a call to arms, so it is the same cobalt as
   tomorrow but quieter - present on the board without competing with the rows that
   actually need somebody today. */
.mpm-wait__due--soon{color:var(--ink-3)}
.mpm-wait__done{font-size:var(--t-sub);color:var(--ink-3)}

/* The status pill. Soft on purpose: a tint of its own hue, NO border, and the page's ink
   for the word - so eleven of them down a column read as a quiet legend rather than as
   eleven alarms. The old pill put the hue in the text at 11px, which failed contrast
   outright on the amber and green stages. */
.mpm-stage{display:inline-block;max-width:100%;padding:3px 9px;border-radius:var(--r-pill);
  background:color-mix(in srgb,var(--c) 16%,transparent);color:var(--ink);
  font-size:var(--t-sub);font-weight:600;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
[data-theme="dark"] .mpm-stage{background:color-mix(in srgb,var(--c) 26%,transparent)}

/* Owner: the initial first, the name after it. At a glance a handler reads the discs;
   the name is there for the rows where two colleagues share one. */
.mpm-c-owner{display:flex;align-items:center;gap:var(--s-2);min-width:0}
.mpm-who{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;
  background:color-mix(in srgb,var(--v-500) 14%,transparent);color:var(--v-600);
  font-size:11px;font-weight:700}
[data-theme="dark"] .mpm-who{background:color-mix(in srgb,var(--v-500) 26%,transparent);
  color:var(--v-300,#9DB4FF)}
/* The empty slot: a dashed outline, ember, and a plus - the row is short an owner, and
   the plus says what the row needs rather than just marking an absence. */
.mpm-who--none,[data-theme="dark"] .mpm-who--none{
  background:transparent;border:1px dashed color-mix(in srgb,var(--ember) 45%,transparent);
  color:var(--ember);font-size:13px;font-weight:600;line-height:1}

/* ── Pager ─────────────────────────────────────────────────────────────────
   A hairline and a bit of space was not enough to stop this reading as one more row of
   the table: same ground, same left edge, same type colour, so "Showing 1-7 of 7" sat
   where a lead's name would sit. It is the table's footer, so it is built like one -
   run out to the board's own edges, dropped onto a recessed ground, and curved into the
   two bottom corners of the card. The table now visibly ENDS, and what is below the end
   is chrome. */
.mpm-pager{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);
  flex-wrap:wrap;font-size:var(--t-meta);color:var(--ink-3);
  margin:var(--s-4) calc(var(--s-5) * -1) calc(var(--s-5) * -1);
  padding:var(--s-3) var(--s-5);
  border-top:1px solid var(--line);
  background:color-mix(in srgb,var(--ink) 3.5%,transparent);
  border-radius:0 0 calc(var(--r-2) - 1px) calc(var(--r-2) - 1px)}
.mpm-pager__count{display:flex;align-items:center;gap:var(--s-2);font-variant-numeric:tabular-nums}
/* One line teaches the rail once. */
.mpm-legend{display:inline-flex;align-items:center;gap:var(--s-1);
  font-size:var(--t-micro);font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--ink-3)}
.mpm-legend i{position:relative;width:3px;height:16px;border-radius:2px;flex:none;
  background:color-mix(in srgb,var(--ember) 30%,transparent)}
.mpm-legend i::after{content:"";position:absolute;left:50%;bottom:0;width:7px;height:7px;
  margin:0 0 -1px -3.5px;border-radius:50%;background:var(--ember)}
.mpm-sort{display:inline-flex;gap:var(--s-1)}
.mpm-sort__opt{padding:var(--s-1) var(--s-2);border-radius:var(--r-1);
  color:var(--ink-3);font-weight:600;text-decoration:none}
.mpm-sort__opt:hover{color:var(--v-500)}
.mpm-sort__opt.is-on{background:color-mix(in srgb,var(--v-500) 12%,transparent);color:var(--ink)}
.mpm-pager__btns{display:inline-flex;gap:var(--s-1)}
.mpm-page{display:inline-flex;align-items:center;min-height:34px;padding:0 var(--s-4);
  border:1px solid var(--line);border-radius:var(--r-pill);background:var(--paper);
  color:var(--ink-2);font-size:var(--t-meta);font-weight:600;text-decoration:none}
.mpm-page:hover{border-color:var(--v-500);color:var(--v-500)}
.mpm-page.is-off{opacity:.45}
.mpm-empty{font-size:var(--t-sub);color:var(--ink-3);margin:var(--s-4) 0}
.mpm-empty__out{font-size:var(--t-meta);font-weight:700;color:var(--v-500);white-space:nowrap}
.mpm-empty__out:hover{text-decoration:underline}

/* ── The team card ─────────────────────────────────────────────────────────── */
/* The team card used to be pinned to 520px with the rest of the row left empty. It runs
   the full width now and splits inside: the switch and its explanation on the left, the
   rotation on the right. Nothing invented to fill the gap - the same card, laid out so
   there is no gap. */
.mpm-dash .mpm-grid{grid-template-columns:minmax(0,1fr);margin:0}
.mpm-dash .mpm-rr .mpm-rr__lede{margin:0}
@media (min-width:860px){
  .mpm-dash .mpm-rr{display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,1.4fr);
    column-gap:var(--s-6);row-gap:var(--s-2);align-items:start}
  .mpm-dash .mpm-rr .mpm-card__head{grid-column:1;margin-bottom:var(--s-2)}
  .mpm-dash .mpm-rr__lede{grid-column:1;grid-row:2}
  .mpm-dash .mpm-rr__body{grid-column:2;grid-row:1 / span 3}
  .mpm-dash .mpm-rr__foot{grid-column:1 / -1}
  .mpm-dash .mpm-rr__warn,.mpm-dash .mpm-rr__note{grid-column:1}
}
.mpm-team{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.mpm-team__row{display:flex;align-items:center;gap:var(--s-2);min-height:40px;
  border-top:1px solid var(--line)}
.mpm-team__row:first-child{border-top:0}
.mpm-team__name{flex:1;min-width:0;font-size:var(--t-body);color:var(--ink);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpm-team__load{font-size:var(--t-micro);font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-3);font-variant-numeric:tabular-nums}
/* The rotation list carries each person's open work, so "who is in it" and "how loaded
   are they" are one list instead of two cards a screen apart. */
.mpm-rr__load{margin-left:auto;flex:none;font-size:var(--t-micro);font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);
  font-variant-numeric:tabular-nums}
.mpm-rr__row .mpm-rr__next{margin-left:var(--s-2)}

/* ── Tablet ────────────────────────────────────────────────────────────────
   Seven columns do not fit. Owner folds away (it is a handler's filter, and the select
   is right there), and the row becomes three lines. */
@media (max-width:1100px){ .mpm-stats{grid-template-columns:repeat(2,1fr)} }
@media (max-width:1000px){
  .mpm-tbl__head{display:none}
  .mpm-tbl{border-top:0;overflow-x:visible}
  .mpm-tbl__head,.mpm-tbl__row{min-width:0}
  .mpm-tbl--handler .mpm-tbl__row,.mpm-tbl--sales .mpm-tbl__row{
    grid-template-columns:minmax(0,1fr) auto auto;
    grid-template-areas:
      "who who quote"
      "move move move"
      "step wait dial";
    row-gap:var(--s-1h);padding:var(--s-3) var(--s-1)}
  /* A row that is asking a question gives the question its own line.
     Sharing the third row with the clock and the dial leaves the buttons a third of the
     card, so three of them stack into a 120px column while two thirds of the row sits
     empty beside them. Given the width they sit on one line, which is also the shape
     that makes it obvious they are a set of answers to the sentence above. */
  .mpm-tbl--handler .mpm-tbl__row:has(.mpm-duep),
  .mpm-tbl--sales .mpm-tbl__row:has(.mpm-duep){
    grid-template-areas:
      "who who quote"
      "move move move"
      "step step step"
      "wait wait dial";
  }
  /* By class, never by position: a row's cells are placed by name, so nothing here can
     be thrown off by an element that does or does not appear on a given row. */
  .mpm-c-who{grid-area:who}
  .mpm-c-move{grid-area:move}
  /* The track lies down on a phone - the row is three lines, so a 34px vertical bar has
     nowhere to stand. Same encoding, rotated. */
  .mpm-c-wait{grid-area:wait;justify-self:end;flex-direction:row-reverse}
  .mpm-wait__track{width:30px;height:3px}
  .mpm-wait__pin{top:50%;left:var(--p)}
  .mpm-c-step{grid-area:step}
  .mpm-c-owner{display:none}
  .mpm-c-quote{grid-area:quote;align-items:flex-end;text-align:right}
  .mpm-tbl__cell--dial{grid-area:dial}
  /* A step label has room to breathe once it is not fighting the whole row for width. */
  .mpm-c-step .mpm-cell__sub{white-space:normal}
}

/* ── Phone ─────────────────────────────────────────────────────────────────
   This is the dashboard most likely to be read on a phone: a salesperson checking their
   queue between calls, a handler routing leads without opening a laptop. */
@media (max-width:640px){
  .mpm-dash .mpm-grid{ grid-template-columns:1fr; }
  .mpm-board{ padding:var(--s-3); border-radius:var(--r-2); }
  .mpm-head{ gap:var(--s-2); }
  /* One line each, scrolled sideways rather than wrapped into three ragged rows. */
  .mpm-ranges,.mpm-pills{
    display:flex; flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none;
    -webkit-overflow-scrolling:touch; padding-bottom:2px;
  }
  .mpm-ranges::-webkit-scrollbar,.mpm-pills::-webkit-scrollbar{ display:none; }
  /* ── The find bar on a phone ──
     Three rows, each one deliberate: search, then the selects side by side, then Apply
     across the full width.

     Trying to fit the button on the end of the selects' row is what looked wrong. It fits
     at 390px and does not at 360 - so on the narrower phone it wrapped, and a 68px pill
     left-aligned under two half-width selects reads as something that fell off the row
     rather than the action that submits it. Given the whole width it is unmistakably the
     button for the two fields above it, it is the same at every width, and it holds a
     44px touch target without having to be squeezed. This also survives the sales view,
     which has one select rather than two. */
  .mpm-filterbar{ gap:var(--s-1h); }
  .mpm-search{ flex:1 1 100%; }
  .mpm-select{ flex:1 1 120px; min-width:0; max-width:none; }
  .mpm-filterbar .mpm-btn{
    flex:1 1 100%; justify-content:center; min-height:42px; font-size:var(--t-body);
  }
  /* "clear" belongs with the button it undoes, not tucked beside it. */
  .mpm-filterbar .mpm-clear{ flex:1 1 100%; text-align:center; padding:2px 0 0; }
  .mpm-range,.mpm-pill{ flex:none; min-height:36px; }
  /* The answer buttons are the one place on this board where a mis-tap writes to the
     database - marking a move won when you meant to snooze it - so they get a real
     target rather than the 28px that reads fine on a desk and misses on a phone. */
  .mpm-duep__btn{ min-height:40px; padding:0 14px; }
  .mpm-duep__q{ font-size:var(--t-meta); }
  /* The tray pills set their own 26px height with two classes, which outranks the rule
     above however late it comes. Measured on a 390x844 phone: 26px, against a 44px
     guideline, on the control a salesperson taps most while standing up. */
  .mpm-tray__body .mpm-pill{ min-height:36px; }
  /* A bare text link in a card header is a 20px target. It is the way out of this card,
     so it gets a thumb's worth of height without becoming a button. */
  .mpm-open{ padding:var(--s-2) 0; }
  /* Nothing to push against on a scrolling row; it just follows the date chips. */
  .mpm-range--mine{ margin-left:var(--s-2); }
  /* The selects stay: on a phone there is no other route to them. */
  .mpm-select{ flex:1 1 40%; max-width:none; }
  .mpm-tray>summary{ width:100%; justify-content:space-between; }
  .mpm-tray__caret{ margin-left:auto; }
  /* The board's padding drops to --s-3 on a phone, so the footer's bleed follows it -
     otherwise it hangs 12px past the card on both sides. */
  .mpm-pager{ justify-content:flex-start;
    margin:var(--s-3) calc(var(--s-3) * -1) calc(var(--s-3) * -1);
    padding:var(--s-3); }
  .mpm-pager__btns{ margin-left:auto; }
}
@media (max-width:520px){
  .mpm-stats{ gap:var(--s-2); }
  .mpm-stat{ padding:var(--s-3); }
  .mpm-stat__value{ font-size:26px; }
  /* Half a phone is ~170px: "longest wait 51d 22h" fills it, and the name beside it was
     truncated to a lone "…". Stacked, the wait keeps its line and the name gets a whole
     one of its own - still ellipsised if it is very long, but readable. */
  .mpm-stat__foot--who{ flex-direction:column; align-items:stretch; gap:2px; }
  .mpm-stat__who::before{ display:none; }
}

/* ══ Google look ════════════════════════════════════════════════════════════
   The dashboard follows Google's own apps: outlined white cards with no coloured caps,
   sentence-case labels, Google Sans numbers at regular weight, flat blue buttons, and
   Google's filter chips - 8px corners, a pale-blue fill and a tick when on. Written as
   one block at the end, so it reads as one decision and overrides the rules above it
   at the same specificity. */
.mpm-dash{ --r-1:8px; --r-2:16px; --card-radius:16px; --lift-1:none;
  --lift-2:0 1px 2px rgba(60,64,67,.3),0 1px 3px 1px rgba(60,64,67,.15); }
.mpm-h1{ font-family:var(--mpm-font-display); font-size:24px; font-weight:400; letter-spacing:0 }
.mpm-btn{ background:var(--mpm-grad); box-shadow:none; min-height:40px; padding:0 24px;
  font-family:var(--mpm-font-display); font-size:14px; font-weight:500; letter-spacing:.01em }
.mpm-btn:hover{ transform:none; filter:brightness(1.06); box-shadow:var(--lift-2) }

.mpm-stat{ box-shadow:none; border:1px solid var(--line); }
.mpm-stat::before{ display:none }
@media (hover:hover){ a.mpm-stat:hover{ transform:none; box-shadow:var(--lift-2); border-color:var(--line) } }
.mpm-stat__label{ font-size:14px; font-weight:500; letter-spacing:.01em; text-transform:none; color:var(--ink-2) }
.mpm-stat__label i{ display:none }
.mpm-stat__value{ font-family:var(--mpm-font-display); font-size:36px; font-weight:400; letter-spacing:0 }
.mpm-stat__delta{ font-weight:400 }
/* The one card that needs somebody: Google's pale amber container. */
.mpm-stat.is-alarm{ background:color-mix(in srgb,var(--mpm-warn) 9%,var(--paper));
  border-color:color-mix(in srgb,var(--mpm-warn) 35%,var(--line)) }
.mpm-stat.is-alarm::before{ display:none }

.mpm-board{ box-shadow:none; border:1px solid var(--line); }
.mpm-dash .mpm-card__head h3{ font-family:var(--mpm-font-display); font-size:18px; font-weight:400 }

/* Filter chips: the date range, the stages, the tray, the dropdowns. */
.mpm-range,.mpm-pill,.mpm-select,.mpm-tray>summary .mpm-pill{
  border-radius:8px; min-height:32px; border:1px solid var(--mpm-rule);
  background:transparent; color:var(--ink-2); font-size:14px; font-weight:500; letter-spacing:.01em }
.mpm-range:hover,.mpm-pill:hover{ background:var(--mpm-hover); border-color:var(--mpm-rule); color:var(--ink) }
.mpm-range.is-on,.mpm-pill.is-on,.mpm-pill--all.is-on{
  background:var(--mpm-sel-2); border-color:transparent; color:var(--mpm-on-sel-2) }
.mpm-range.is-on:hover{ color:var(--mpm-on-sel-2) }
.mpm-pill--all.is-on b,.mpm-pill.is-on b{ color:var(--mpm-on-sel-2) }
.mpm-range.is-on::before,.mpm-pill.is-on::before{
  content:""; width:18px; height:18px; margin-left:-4px; flex:none; background:currentColor;
  -webkit-mask:${materialUrl('check')} center/contain no-repeat; mask:${materialUrl('check')} center/contain no-repeat }
.mpm-pill.is-on i{ display:none }
/* The pipeline bar under each stage chip was a second colour code on top of the dot. */
.mpm-pill::after{ display:none }
.mpm-select{ padding:0 12px }

/* Gmail's search: one wide tinted pill - the wrapper, which holds the icon - that turns
   white with a lift when used. The input inside stays transparent, so there is one shape. */
.mpm-search{ background:color-mix(in srgb,var(--mpm-sel) 45%,var(--mpm-tint)); border:0;
  border-radius:999px; min-height:46px; padding:0 16px }
.mpm-search:focus-within{ background:var(--paper); box-shadow:var(--lift-2); color:var(--ink-2) }
[data-theme="dark"] .mpm-search{ background:#282A2C }
[data-theme="dark"] .mpm-search:focus-within{ background:#333537 }
.mpm-search input{ background:transparent; font-size:15px }

/* The promises strip: Google's warning banner - a pale amber band, no border. */
.mpm-due{ border:0; border-radius:12px; background:color-mix(in srgb,var(--mpm-warn) 10%,var(--paper)) }
.mpm-due__seg{ border-radius:8px }

.mpm-tbl__head{ font-size:13px; font-weight:500; letter-spacing:.01em; text-transform:none; color:var(--ink-2) }
.mpm-stage{ border-radius:8px; font-weight:500 }
.mpm-legend,.mpm-team__load,.mpm-rr__load{ letter-spacing:.01em; text-transform:none; font-weight:500 }
.mpm-duep__btn{ border-radius:999px; border-color:var(--mpm-rule); font-weight:500 }
.mpm-duep__btn--yes{ background:var(--mpm-grad); border-color:transparent }

/* The greeting: Google's home-page hello - large, regular, the date quietly below. */
.mpm-head{ align-items:flex-end; margin:0 0 var(--s-5) }
.mpm-head__text{ display:flex; flex-direction:column; gap:4px; min-width:0 }
.mpm-h1{ display:block; font-size:32px; line-height:1.2 }
.mpm-head__date{ margin:0; font-size:14px; font-weight:400; color:var(--ink-2) }
/* Each figure wears its icon in a pale tonal circle, as Google's dashboards do. */
.mpm-stat__label{ gap:12px; margin-bottom:14px }
.mpm-stat__ico{ box-sizing:border-box; width:40px; height:40px; padding:10px; border-radius:50%;
  background:var(--mpm-sel); color:var(--mpm-on-sel); flex:none }
.mpm-stat.is-alarm .mpm-stat__ico{ background:color-mix(in srgb,var(--mpm-warn) 18%,var(--paper)); color:var(--mpm-warn-ink) }
.mpm-stat__value{ font-size:40px; margin-bottom:8px }
.mpm-stat{ padding:20px 20px 16px }
.mpm-trend{ display:inline-flex; align-items:center; gap:2px; padding:1px 8px 1px 5px; border-radius:999px;
  font-size:12px; font-weight:500; font-variant-numeric:tabular-nums; vertical-align:1px }
.mpm-trend[data-dir="up"]{ background:#E6F4EA; color:#137333 }
.mpm-trend[data-dir="down"]{ background:#FCE8E6; color:#C5221F }
.mpm-trend[data-dir="flat"]{ background:var(--mpm-tint); color:var(--ink-2) }
[data-theme="dark"] .mpm-trend[data-dir="up"]{ background:rgba(129,201,149,.16); color:#81C995 }
[data-theme="dark"] .mpm-trend[data-dir="down"]{ background:rgba(242,139,130,.16); color:#F28B82 }
/* The board card: a touch more room, and its heading icon as a tonal circle. */
.mpm-board{ padding:24px }
.mpm-dash .mpm-card__head h3{ font-size:22px }
@media (max-width:640px){
  .mpm-h1{ font-size:26px }
  .mpm-stat__value{ font-size:32px }
  .mpm-stat__ico{ width:36px; height:36px; padding:8px }
  .mpm-board{ padding:16px }
}

`;
