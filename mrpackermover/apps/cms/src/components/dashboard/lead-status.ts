/**
 * The lead pipeline: one definition, shared by every dashboard.
 *
 * This lives in its own module rather than in Dashboard.tsx for two reasons.
 *
 * 1. Drift. The admin dashboard used to keep a private copy of this list. When
 *    `assigned` and `reassigned` were added to the Leads collection but not to that
 *    copy, an assigned lead fell through the lookup and rendered as "New", and the
 *    pipeline bars counted none of them, so the totals were quietly short.
 *
 * 2. Import cycles. Dashboard.tsx imports SalesDashboard.tsx, so SalesDashboard cannot
 *    read a constant from Dashboard at module-initialisation time — it crashes with
 *    "Cannot access 'LEAD_STATUS' before initialization". A leaf module both can import
 *    removes the cycle instead of tiptoeing around it.
 *
 * The values here MUST match the `status` field options on the Leads collection.
 * `verify-roles` asserts that, so the two cannot silently diverge again.
 */
export interface LeadStage {
  value: string;
  label: string;
  color: string;
}

export const LEAD_STATUS: LeadStage[] = [
  // ONE COLOUR PER STAGE, AND THE COLOUR SAYS WHAT THE STAGE IS.
  //
  // This used to be four colours shared out among twelve stages - three blues, two teals,
  // two greys - so a list of leads read as a handful of colours and the eye still had to
  // read every label. Now each stage has its own, chosen from the family its meaning
  // belongs to: blue and purples for routing (nobody has worked it yet), sky blue for a
  // first conversation, red for an attempt that failed, amber for a promise to ring back,
  // teal for a chase, orange for money on the table, olive for a booked move, bright
  // green for a win, grey for a loss and a muddy taupe for junk.
  //
  // The set was searched, not eyeballed: every pair is at least 15 apart in OKLab (the
  // floor at which people with full colour vision can tell two marks apart), and every
  // colour is visible on both the light and the dark admin surface. Red/green pairs still
  // collide for colour-blind readers - unavoidable with twelve hues - which is why a stage
  // colour never appears without the stage's name beside it.
  { value: 'new', label: 'New', color: '#2962FF' },
  { value: 'assigned', label: 'Assigned', color: '#673AB7' },
  { value: 'reassigned', label: 'Reassigned', color: '#BA68C8' },
  { value: 'contacted', label: 'Contacted', color: '#29B6F6' },
  { value: 'call-not-picked', label: 'Call not picked', color: '#D50000' },
  // The customer answered but asked for another time. Distinct from Call not picked,
  // which is nobody answering - one is a promise to ring back, the other is a retry.
  { value: 'call-later', label: 'Call later', color: '#FFC107' },
  // Spoken to, still deciding. The lead is warm and owed another contact.
  { value: 'follow-up', label: 'Follow up', color: '#006064' },
  { value: 'quoted', label: 'Quoted', color: '#FF6D00' },
  // Said yes, and the move has a date. The stage that was missing: until it existed a
  // booked customer sat in "Quoted", where the board chased them daily for a decision
  // they had already made.
  { value: 'scheduled', label: 'Scheduled', color: '#558B2F' },
  { value: 'won', label: 'Won', color: '#00C853' },
  { value: 'lost', label: 'Lost', color: '#BDC1C6' },
  { value: 'invalid', label: 'Invalid lead', color: '#A1887F' },
];

/** A stage's colour, for the few places that name a stage rather than iterate the list. */
export const stageColor = (value: string): string =>
  LEAD_STATUS.find((s) => s.value === value)?.color ?? '#8a8f98';

/**
 * Set by the assignment hook when a handler routes work, never chosen by a salesperson.
 * Defined here with the stages themselves so the collection, the select and any future
 * caller all read one list.
 */
export const ROUTING_STAGES = ['new', 'assigned', 'reassigned'];

/**
 * Stages that mean the lead is finished with, in one place.
 *
 * Three dashboard queries used to spell `['won', 'lost']` inline to mean "still open".
 * Adding "Invalid lead" without touching them would have left every wrong number and
 * spam entry sitting in somebody's open workload for good - counted on their dashboard,
 * counted in the per-salesperson load a handler reads before distributing work. A stage
 * added here now leaves the open queues by itself.
 *
 * Deliberately NOT the same set as the win-rate denominator. Win rate is won against
 * decided, and an invalid lead was never an opportunity anyone could have won - folding
 * it in would push the number down for reasons that have nothing to do with selling.
 */
export const CLOSED_STAGES = ['won', 'lost', 'invalid'];

/**
 * Everything a lead can be BEFORE it has been quoted.
 *
 * Proposals.ts used to spell this list out by hand to decide whether sending a proposal
 * should advance the lead to Quoted. Adding "Call later" and "Follow up" without touching
 * that copy would have meant a salesperson sending a proposal from either stage and
 * watching the lead sit there un-advanced - the silent kind of wrong, where nothing errors
 * and the pipeline is simply understated. Derived, so a new working stage joins by itself.
 */
export const PRE_QUOTE_STAGES = LEAD_STATUS.filter(
  (s) => s.value !== 'quoted' && !CLOSED_STAGES.includes(s.value),
).map((s) => s.value);

/** The stages a salesperson may move a lead into by hand. */
export const SALES_SETTABLE = LEAD_STATUS.filter((s) => !ROUTING_STAGES.includes(s.value));

/**
 * "A, B or C" - for telling someone what they may choose. Built from the stage list so the
 * sentence cannot name a stage that no longer exists, or omit one that was just added.
 */
export const humanList = (labels: string[]): string =>
  labels.length <= 1
    ? (labels[0] ?? '')
    : labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1];

/**
 * Look up a stage for display. An unrecognised value shows itself rather than being
 * silently relabelled as the first entry, so a future mismatch is visible on screen
 * instead of masquerading as a real status.
 */
export const statusMeta = (v?: string): { label: string; color: string } =>
  LEAD_STATUS.find((s) => s.value === v) ?? { label: v ?? 'Unknown', color: '#8a8f98' };

/** A relationship arrives as an id until populated; show a name only when we have one. */
export const ownerName = (
  v: { name?: string; email?: string } | string | number | null | undefined,
): string => (v && typeof v === 'object' ? personCase(v.name ?? v.email ?? '') : '');

/**
 * The exact moment, for the tooltip behind a relative time. "6m ago" is what you scan;
 * the precise stamp is what you need when a customer asks who called and when.
 */
export const exactTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/**
 * The pipeline, grouped the way somebody working it would say it out loud.
 *
 * Eleven stages is the right vocabulary for a lead record and far too many things to
 * offer as a first filter: nobody opens a dashboard thinking "show me reassigned". They
 * think in five buckets - fresh, owed a call, warm, priced, decided - so those are the
 * buttons, and the eleven exact stages sit behind them for when the coarse answer is not
 * enough.
 *
 * Every status belongs to at most ONE group, so the group counts add up to the whole
 * board rather than double-counting a lead into two buttons. `invalid` deliberately
 * belongs to none: a wrong number is not a stage of selling, and folding it into
 * "Won / Lost" would make that button disagree with the win rate beside it. It stays
 * reachable from the exact-status row, which renders every entry in LEAD_STATUS.
 *
 * `verify-roles` asserts the "at most one, and all real" part, so a stage added to the
 * collection cannot quietly end up counted twice or pointed at nothing.
 */
/**
 * A group's colour is one of its own stages' colours, never a seventh hue of its own, so a
 * button and the chips it filters to agree: the Quote sent button is the Quoted orange,
 * Follow-up is the Call later amber, and so on.
 */
export interface LeadGroup {
  key: string;
  label: string;
  statuses: string[];
  color: string;
  /** What the button means, shown on hover so nobody has to guess the mapping. */
  hint: string;
}

export const LEAD_GROUPS: LeadGroup[] = [
  {
    key: 'fresh',
    label: 'Fresh',
    statuses: ['new', 'assigned', 'reassigned'],
    color: stageColor('new'),
    hint: 'Arrived and nobody has spoken to them yet',
  },
  {
    key: 'follow-up',
    label: 'Follow-up',
    statuses: ['call-not-picked', 'call-later'],
    color: stageColor('call-later'),
    hint: 'Owed another attempt: nobody picked up, or they asked us to ring back',
  },
  {
    key: 'interested',
    label: 'Interested',
    statuses: ['contacted', 'follow-up'],
    color: stageColor('contacted'),
    hint: 'Spoken to, still deciding',
  },
  {
    key: 'quoted',
    label: 'Quote sent',
    statuses: ['quoted'],
    color: stageColor('quoted'),
    hint: 'Priced and waiting on the customer',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    statuses: ['scheduled'],
    color: stageColor('scheduled'),
    hint: 'Booked in, with a move date - waiting for the day rather than for the customer',
  },
  {
    key: 'closed',
    label: 'Won / Lost',
    statuses: ['won', 'lost'],
    color: stageColor('won'),
    hint: 'Decided, either way',
  },
];

/**
 * The stages where a lead has arrived but nobody has spoken to the customer yet.
 *
 * Derived from the group above rather than typed out again, because three places need
 * this set and they must agree: the board's waiting rail, the `waitingSince` stamp on
 * the collection, and the sort that orders by it. A hand-written copy is how the board
 * once called an assigned lead "New" for weeks.
 */
export const FRESH_STAGES: string[] = LEAD_GROUPS.find((g) => g.key === 'fresh')?.statuses ?? [];

/**
 * The lead review: how a salesperson's leads have turned out, in three answers.
 *
 * A different question from the board's groups. The groups ask "what is this lead waiting
 * for", which is how you work a list. The review asks "how did it go", which is how you
 * give somebody feedback - so it sorts the same stages into outcome, not next step:
 *
 *   Qualified          moved forward: priced, booked or done.
 *   Needs improvement  spoken to and still warm, but not yet pushed to a price. This is
 *                      the slice coaching can move.
 *   Lost               lost, junk, or never reached.
 *
 * Fresh leads (New / Assigned / Reassigned) are in none of them: nobody has worked them
 * yet, so they are not anybody's result. They are counted beside the chart as "waiting
 * for a first call" instead of being folded into a slice they would distort.
 *
 * Every other stage is in exactly one bucket - `verify-roles` asserts it, so a stage added
 * to the collection cannot drop out of the review or be counted in two slices.
 *
 * The colours are the theme's good / warning / critical, as CSS variables so they can step
 * lighter on the dark surface (see REVIEW_CSS). They never stand alone: every slice also
 * carries an icon, its name, a count and a share, because red and green cannot be told
 * apart by roughly one man in twelve.
 */
export interface ReviewBucket {
  key: 'qualified' | 'improve' | 'lost';
  label: string;
  statuses: string[];
  /** A CSS colour expression; a variable, so dark mode can lighten it. */
  color: string;
  icon: 'check' | 'trending_up' | 'close';
  hint: string;
}

export const REVIEW_BUCKETS: ReviewBucket[] = [
  {
    key: 'qualified',
    label: 'Qualified',
    statuses: ['quoted', 'scheduled', 'won'],
    color: 'var(--rv-qualified)',
    icon: 'check',
    hint: 'Moved forward: a price was sent, the move was booked, or it was won',
  },
  {
    key: 'improve',
    label: 'Needs improvement',
    statuses: ['contacted', 'follow-up', 'call-later'],
    color: 'var(--rv-improve)',
    icon: 'trending_up',
    hint: 'Spoken to and still warm, but not yet given a price - push these to a quote',
  },
  {
    key: 'lost',
    label: 'Lost',
    statuses: ['lost', 'invalid', 'call-not-picked'],
    color: 'var(--rv-lost)',
    icon: 'close',
    hint: 'Lost to a "no" or a competitor, a junk enquiry, or never reached',
  },
];

/** Stages that are nobody's result yet - shown beside the review, not inside it. */
export const REVIEW_PENDING: string[] = FRESH_STAGES;

export interface ReviewSlice {
  bucket: ReviewBucket;
  count: number;
  /** Share of the reviewed leads, 0-100, rounded. */
  pct: number;
  /** The stages inside the slice, for the legend's breakdown. Zero rows are left out. */
  stages: { value: string; label: string; color: string; count: number }[];
}

export interface Review {
  slices: ReviewSlice[];
  /** Qualified + needs improvement + lost. */
  reviewed: number;
  /** Fresh leads, outside the review. */
  pending: number;
  /** Qualified as a share of the reviewed leads, or null when there is nothing to judge. */
  score: number | null;
}

/**
 * Build the review from a count per stage. Every caller already has those counts - the
 * board's stage buttons, the team aggregation, the profile panel's fetch - so the review
 * is arithmetic on numbers shown elsewhere, never a second query that could disagree.
 *
 * Shares are rounded so they always add up to 100: the largest-remainder method, rather
 * than rounding each one and showing a reader 33 + 33 + 33.
 */
export function buildReview(countOf: (status: string) => number): Review {
  const raw = REVIEW_BUCKETS.map((bucket) => {
    const stages = bucket.statuses
      .map((v) => ({ ...statusMeta(v), value: v, count: countOf(v) }))
      .filter((s) => s.count > 0);
    return { bucket, count: stages.reduce((a, s) => a + s.count, 0), stages };
  });
  const reviewed = raw.reduce((a, r) => a + r.count, 0);
  const exact = raw.map((r) => (reviewed ? (r.count / reviewed) * 100 : 0));
  const pct = exact.map(Math.floor);
  let short = reviewed ? 100 - pct.reduce((a, b) => a + b, 0) : 0;
  exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem)
    .forEach(({ i }) => {
      if (short > 0) {
        pct[i] = (pct[i] ?? 0) + 1;
        short -= 1;
      }
    });
  const pending = REVIEW_PENDING.reduce((a, v) => a + countOf(v), 0);
  const qualified = raw[0]?.count ?? 0;
  return {
    slices: raw.map((r, i) => ({ ...r, pct: pct[i] ?? 0 })),
    reviewed,
    pending,
    score: reviewed ? Math.round((qualified / reviewed) * 100) : null,
  };
}

/**
 * Where a lead came from.
 *
 * Here rather than on the collection because three screens need it and they have to
 * agree: the collection's own select, the dashboard's source filter, and the multi-select
 * filter bar above the Leads list. It was written out twice before, and a fourth caller
 * would have made three.
 */
export interface LeadSource {
  value: string;
  label: string;
}

export const LEAD_SOURCES: LeadSource[] = [
  { value: 'quote-form', label: 'Quote form' },
  { value: 'price-check', label: 'Price check' },
  { value: 'facebook-ad', label: 'Facebook ad' },
  { value: 'webhook', label: 'Webhook' },
];

/** The label for a stored source value, or the value itself if it is one we retired. */
export const sourceLabel = (value?: string): string =>
  LEAD_SOURCES.find((s) => s.value === value)?.label ?? value ?? '';

/**
 * The stages that carry a date, and what that date means.
 *
 * One field on the lead (`dueAt`) serves three different promises, because the promise
 * is already written in the stage - and asking somebody to pick both a date AND what the
 * date is for would be asking a question the screen can answer:
 *
 *   call-later  the customer asked us to ring back at a time
 *   follow-up   we owe them a chase on the quote
 *   scheduled   the move itself is booked for that day
 *
 * The difference matters at exactly one moment - when the date arrives and somebody is
 * asked whether it happened - so the wording of that question lives here beside the list
 * rather than being rebuilt at the point of use.
 */
export const DATED_STAGES: string[] = ['call-later', 'follow-up', 'scheduled'];

export interface DuePrompt {
  /** What the date meant, in a word, for a column heading or a chip. */
  noun: string;
  /** The question asked on the day. */
  question: string;
  /** The answer that moves the lead on, and where it moves it to. */
  yes: { label: string; status: string };
  /** The answer that says it did not happen. Absent when there is nothing to fail. */
  no?: { label: string; status: string };
}

/**
 * Where a promised date sits relative to now, in the words a person would use.
 *
 * "in 1d" is what a duration function produces and not what anybody says. Near dates get
 * named - today, tomorrow - because that is how the promise was made in the first place
 * ("I'll call you tomorrow"), and only once a date is far enough away to be uncountable
 * does a duration become the clearer answer.
 *
 * The tone is the whole point of separating this out: `late` and `today` mean somebody
 * acts now, `tomorrow` means somebody should know, and `later` means nothing at all yet.
 * The board paints those three differently, and ember - which means "act" everywhere on
 * this page - is reserved for the first two.
 */
export type DueTone = 'late' | 'today' | 'tomorrow' | 'soon' | 'later';

/**
 * How far ahead a promise is announced: two days, not one.
 *
 * A move booked for the 26th surfaces on the 24th. The extra day is the difference
 * between being told and being able to do anything about it - confirming a truck,
 * chasing a society gate pass or finding a replacement packer are all next-morning jobs,
 * and a notice that arrives the evening before leaves no morning to use.
 *
 * One constant, read by the board, the counts and the sidebar, so all three agree about
 * what "coming up" means.
 */
export const NOTICE_DAYS = 2;

export interface DueState {
  tone: DueTone;
  /** Short enough for a 74px column. */
  text: string;
  /** The full stamp, for a tooltip - the column can only ever be an approximation. */
  exact: string;
}

export function dueState(dueAt: string, nowMs: number = Date.now()): DueState | null {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date(nowMs);
  // Calendar days, not 24-hour blocks. A move booked for 9am tomorrow is "tomorrow" at
  // 6pm tonight even though it is fifteen hours away, and it is still "tomorrow" at
  // 8am tomorrow-minus-one-minute. Anything measured in elapsed hours gets both wrong.
  const startOfDay = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(due) - startOfDay(now)) / 86400000);

  const time = due.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const exact = due.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  if (due.getTime() <= nowMs) {
    const lateFor = nowMs - due.getTime();
    return { tone: 'late', text: `${humanDuration(lateFor)} late`, exact };
  }
  if (days === 0) return { tone: 'today', text: time, exact };
  if (days === 1) return { tone: 'tomorrow', text: 'tomorrow', exact };
  // Named rather than measured, for the same reason tomorrow is: "in 1d 7h" is a
  // subtraction somebody has to do in their head to find out which morning it lands on.
  if (days === NOTICE_DAYS) return { tone: 'soon', text: `in ${days} days`, exact };
  return { tone: 'later', text: `in ${humanDuration(due.getTime() - nowMs)}`, exact };
}

export const duePrompt = (status?: string): DuePrompt =>
  status === 'scheduled'
    ? {
        noun: 'Move',
        question: 'Did the move happen?',
        // Short enough to sit beside its siblings in a 175px column, and still naming
        // the consequence: a bare "Yes" that silently marks a deal won is a surprise.
        yes: { label: 'Yes, won', status: 'won' },
        no: { label: 'No, lost', status: 'lost' },
      }
    : status === 'follow-up'
      ? {
          noun: 'Chase',
          question: 'Chased them?',
          // A chase that lands does not close anything - the customer now has the quote
          // in hand, which is what `quoted` means.
          yes: { label: 'Quoted', status: 'quoted' },
        }
      : {
          noun: 'Callback',
          question: 'Did you reach them?',
          yes: { label: 'Reached', status: 'contacted' },
          no: { label: 'No answer', status: 'call-not-picked' },
        };

/**
 * What to do next with a lead in this stage, and whether leaving it is a problem.
 *
 * A status says where a lead got to; it does not say what the person reading the row is
 * supposed to do about it, which is the only reason they opened the dashboard. `chase`
 * marks the stages where nothing is happening unless somebody rings - those rows earn
 * the ember treatment once they have been sitting.
 */
export const NEXT_STEP: Record<string, { label: string; chase: boolean }> = {
  new: { label: 'Make first call', chase: true },
  assigned: { label: 'Make first call', chase: true },
  reassigned: { label: 'Make first call', chase: true },
  contacted: { label: 'Call again', chase: true },
  'call-not-picked': { label: 'Try again', chase: true },
  'call-later': { label: 'Call back', chase: true },
  'follow-up': { label: 'Send the quote', chase: true },
  quoted: { label: 'Follow up on quote', chase: true },
  // `chase: false` because nothing is owed until the date arrives. The board reads this
  // to decide whether a lead is late, and a booked move is not late - it is waiting.
  // Instructions, not second names for the stage. "Move booked" and "Move done" sat
  // beside badges reading Scheduled and Won, so the same lead had two names in one row.
  scheduled: { label: 'Prepare for the move', chase: false },
  won: { label: 'Closed', chase: false },
  lost: { label: 'Closed', chase: false },
  invalid: { label: 'Closed', chase: false },
};

/** The next step for a stage, never undefined - an unmapped stage just says "Open it". */
export const nextStep = (status?: string): { label: string; chase: boolean } =>
  NEXT_STEP[status ?? ''] ?? { label: 'Open it', chase: false };

/**
 * "18m", "2h 14m", "1d 3h" - the shape someone would say out loud.
 *
 * Here rather than in a dashboard file because a client component cannot import from
 * SalesDashboard.tsx: that module pulls in `next/link` and Payload server types, so
 * importing it from a "use client" file drags a server module into the browser bundle.
 * This module has no imports at all, which is what makes it safe for both sides.
 */
export function humanDuration(ms: number): string {
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
 * Rupees the way the team says them: ₹32,000 under a lakh, ₹4.6L above it, ₹1.2Cr above
 * a crore. A column of full figures is unreadable at a glance, and "4.6 lakh" is exactly
 * how a quote gets described on the phone.
 */
export function money(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/**
 * The day and time an entry happened, as a person would write it: "Today, 11:20 AM" for
 * something from this morning, "21 Sep, 5:17 PM" for anything older. The relative half
 * is what you scan; the date is what you need when a customer asks.
 */
export const whenLabel = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
};

/**
 * A name as a person would write it.
 *
 * Two things arrive wrong and both are fixed here, in one place, because a name that
 * reads one way in the greeting and another way in the table is worse than either.
 *
 * SHOUTED IN CAPITALS. Quote forms take the name in whatever case the customer typed,
 * and on a phone that is very often all caps. Forty rows of caps are harder to read -
 * caps remove the word-shape the eye uses - and read as an alarm.
 *
 * typed in lower case. Somebody who signed up as "sushil" was greeted as "Hello, sushil"
 * and owned leads as "sushil", which reads as a username rather than a person.
 *
 * The decision is made on the WHOLE name, never word by word. A name carrying a capital
 * anywhere inside it was cased deliberately and is returned untouched - which is what
 * keeps "McKenzie", "van Rijn" and "d'Artagnan" intact. Word-by-word would capitalise
 * that "van".
 *
 * An email address is not a name and passes through as it is. Staff without a name on
 * their account fall back to their email, and "Sushil.aajneeti@gmail.com" would be
 * neither a name nor the address they typed.
 */
export function personCase(name: string): string {
  if (!name || name.includes('@')) return name;
  const allLower = name === name.toLowerCase();
  const allUpper = name === name.toUpperCase();
  if (!allLower && !allUpper) return name;
  return name
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{Ll})/gu, (_m, lead: string, ch: string) => lead + ch.toUpperCase());
}
