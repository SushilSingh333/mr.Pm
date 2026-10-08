import { LEAD_STATUS } from '../dashboard/lead-status.js';

/**
 * The calendar's vocabulary, shared by the server page that fetches and the browser
 * component that draws.
 *
 * One import only, the stage list, which is itself a leaf with no imports - so this file
 * stays safe for the server page and the browser alike. Every date here is a "day key" -
 * a plain `YYYY-MM-DD` string - worked with UTC arithmetic. That is deliberate: a day key means the same day on the server
 * (pinned to IST in next.config) and in any browser, so nothing drifts a day between the
 * two. Only the server turns a stored instant into a day key; after that it is text.
 */

export type DayKey = string;
export type CalView = 'month' | 'week' | 'day';

const DAY_MS = 86_400_000;

/** A day key as a UTC midnight, for arithmetic only - never for display in a zone. */
const utc = (key: DayKey): Date => new Date(`${key}T00:00:00Z`);
const keyOf = (d: Date): DayKey => d.toISOString().slice(0, 10);

export const isDayKey = (v: unknown): v is DayKey =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(utc(v).getTime());

export const addDays = (key: DayKey, n: number): DayKey =>
  keyOf(new Date(utc(key).getTime() + n * DAY_MS));

export const addMonths = (key: DayKey, n: number): DayKey => {
  const d = utc(key);
  // Clamp to the 1st so "31 Jan + 1 month" is February, not 3 March.
  return keyOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)));
};

/** Monday of the week the key falls in. The team counts a working week from Monday. */
export const weekStart = (key: DayKey): DayKey => addDays(key, -((utc(key).getUTCDay() + 6) % 7));

export const monthOf = (key: DayKey): string => key.slice(0, 7);

/**
 * The weeks a month view shows: Monday of the week holding the 1st, through Sunday of the
 * week holding the last day. Four to six rows - never padded to six, because an empty
 * trailing row is a row of days that belong to another month pretending to be this one.
 */
export function monthGrid(key: DayKey): DayKey[][] {
  const d = utc(key);
  const first = keyOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  const last = keyOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
  const weeks: DayKey[][] = [];
  for (let start = weekStart(first); start <= last; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
  }
  return weeks;
}

export const weekDays = (key: DayKey): DayKey[] =>
  Array.from({ length: 7 }, (_, i) => addDays(weekStart(key), i));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEK_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Formatted by hand from the key, not by `toLocaleDateString`: the same text on the
 *  server and in the browser, whatever either one's locale or zone. */
export const dayNum = (key: DayKey): number => utc(key).getUTCDate();
export const weekdayOf = (key: DayKey): string => WEEKDAYS[utc(key).getUTCDay()] ?? '';
export const isWeekend = (key: DayKey): boolean => [0, 6].includes(utc(key).getUTCDay());
export const shortDate = (key: DayKey): string =>
  `${dayNum(key)} ${MONTHS[utc(key).getUTCMonth()]}`;
export const longDate = (key: DayKey): string =>
  `${weekdayOf(key)}, ${dayNum(key)} ${MONTHS[utc(key).getUTCMonth()]} ${utc(key).getUTCFullYear()}`;
export const monthTitle = (key: DayKey): string =>
  `${MONTHS_LONG[utc(key).getUTCMonth()]} ${utc(key).getUTCFullYear()}`;
export const weekTitle = (key: DayKey): string => {
  const days = weekDays(key);
  const a = days[0]!;
  const b = days[6]!;
  return monthOf(a) === monthOf(b)
    ? `${dayNum(a)} – ${dayNum(b)} ${MONTHS[utc(b).getUTCMonth()]} ${utc(b).getUTCFullYear()}`
    : `${shortDate(a)} – ${shortDate(b)} ${utc(b).getUTCFullYear()}`;
};

/**
 * What a lead is, on the calendar.
 *
 * NAMED AND COLOURED BY THE STAGE LIST, NOT BY THIS FILE. The first version had its own
 * words - "Done", "Cancelled", "Callbacks" - for stages the rest of the admin calls Won,
 * Lost, Call later and Follow up, so a lead marked Won on its page turned up under a
 * different name here and looked as if it had gone missing. Every label and colour below
 * that names a stage is read from LEAD_STATUS, so the calendar cannot drift from the
 * Leads list, the dashboard or the status select again.
 *
 * The one thing the calendar adds is WHEN, for the Scheduled stage only: the same stage
 * is still ahead, today, or past its day without anybody saying whether the move
 * happened. Those three are grouped under the stage's own name on screen. "Overdue" is
 * the one that needs a person.
 */
export type CalState =
  'upcoming' | 'today' | 'overdue' | 'won' | 'lost' | 'call-later' | 'follow-up';

const stage = (value: string): { label: string; color: string } => {
  const s = LEAD_STATUS.find((x) => x.value === value);
  return { label: s?.label ?? value, color: s?.color ?? '#8a8f98' };
};

export const CAL_STATES: Array<{
  value: CalState;
  /** The filter button. */
  label: string;
  /** The badge on a lead's card. */
  pill: string;
  color: string;
  /** What it means, in a phrase: the button's tooltip. */
  hint: string;
  /** One of the three parts of Scheduled, grouped under it. */
  scheduled: boolean;
  /** Hidden until asked for: a promised call is not a move. */
  optIn?: boolean;
}> = [
  {
    value: 'upcoming',
    label: 'Upcoming',
    pill: stage('scheduled').label,
    color: stage('scheduled').color,
    hint: 'Scheduled, and the day is still ahead',
    scheduled: true,
  },
  {
    value: 'today',
    label: 'Today',
    pill: 'Today',
    color: '#0B57D0',
    hint: 'Scheduled for today',
    scheduled: true,
  },
  {
    value: 'overdue',
    label: 'Overdue',
    pill: 'Overdue',
    color: '#F4511E',
    hint: 'Scheduled, but the day has passed - mark it Won or Lost',
    scheduled: true,
  },
  {
    value: 'won',
    label: stage('won').label,
    pill: stage('won').label,
    color: stage('won').color,
    hint: 'Marked Won - the move happened',
    scheduled: false,
  },
  {
    value: 'lost',
    label: stage('lost').label,
    pill: stage('lost').label,
    color: stage('lost').color,
    hint: 'Was scheduled, then marked Lost',
    scheduled: false,
  },
  {
    value: 'call-later',
    label: stage('call-later').label,
    pill: stage('call-later').label,
    color: stage('call-later').color,
    hint: 'A promised callback - a call, not a move',
    scheduled: false,
    optIn: true,
  },
  {
    value: 'follow-up',
    label: stage('follow-up').label,
    pill: stage('follow-up').label,
    color: stage('follow-up').color,
    hint: 'A day to chase a quote - a call, not a move',
    scheduled: false,
    optIn: true,
  },
];

export const SCHEDULED_STATES: CalState[] = CAL_STATES.filter((c) => c.scheduled).map(
  (c) => c.value,
);

/**
 * The filter row, in three labelled groups, so the row reads as sentences rather than a
 * strip of seven colours: what is booked, how it ended, and the calls in between.
 *
 * "Scheduled shifting" keeps the stage's own word and says what it is in the words the
 * team and the customer both use - Home Shifting, Office Shifting. "Scheduled" on its
 * own read as a setting, not as the moves.
 */
export const CAL_GROUPS: Array<{ key: string; title: string; hint: string; states: CalState[] }> = [
  {
    key: 'scheduled',
    title: 'Scheduled shifting',
    hint: 'Moves at the Scheduled stage - before, on and after their day',
    states: ['upcoming', 'today', 'overdue'],
  },
  {
    key: 'outcome',
    title: 'Outcome',
    hint: 'Moves that are over - Won or Lost',
    states: ['won', 'lost'],
  },
  {
    key: 'calls',
    title: 'Calls',
    hint: 'Dates promised for a call, not a move',
    states: ['call-later', 'follow-up'],
  },
];
export const DEFAULT_STATES: CalState[] = CAL_STATES.filter((c) => !c.optIn).map((c) => c.value);

export const stateMeta = (s: CalState) => CAL_STATES.find((c) => c.value === s) ?? CAL_STATES[0]!;

export function stateOf(status: string, day: DayKey, today: DayKey): CalState {
  if (status === 'won') return 'won';
  if (status === 'lost' || status === 'invalid' || status === 'duplicate') return 'lost';
  if (status === 'call-later') return 'call-later';
  if (status === 'follow-up') return 'follow-up';
  if (day < today) return 'overdue';
  if (day === today) return 'today';
  return 'upcoming';
}

/** Moves that take a crew on their day. A lost move gave its slot back; a callback never
 *  had one. */
export const takesCapacity = (s: CalState): boolean =>
  s === 'upcoming' || s === 'today' || s === 'overdue' || s === 'won';

/**
 * How full a day is, by the plan's thresholds: green under 60%, amber to 85%, red above.
 * "Full" is its own step at 100%, because "nearly full" and "say no" are different
 * answers to a customer on the phone.
 */
export type Heat = 'free' | 'quiet' | 'busy' | 'tight' | 'full';

export function heatOf(load: number, capacity: number): Heat {
  if (load <= 0) return 'free';
  const r = capacity > 0 ? load / capacity : 1;
  if (r >= 1) return 'full';
  if (r > 0.85) return 'tight';
  if (r >= 0.6) return 'busy';
  return 'quiet';
}

export const HEAT_LABEL: Record<Heat, string> = {
  free: 'Free',
  quiet: 'Open',
  busy: 'Filling up',
  tight: 'Almost full',
  full: 'Full',
};

/** One move, as the browser needs it. Everything is pre-formatted on the server. */
export interface CalItem {
  id: string | number;
  name: string;
  phone: string;
  status: string;
  /** Stage label as the rest of the admin writes it - "Scheduled", "Call later". */
  statusLabel: string;
  state: CalState;
  day: DayKey;
  /** "11:00 am", in IST. */
  time: string;
  /** "11:00", 24h IST - what a reschedule keeps when it changes the day. */
  hhmm: string;
  pickup: string;
  drop: string;
  from: string;
  to: string;
  size: string;
  service: string;
  ownerId: string | null;
  ownerName: string;
}
