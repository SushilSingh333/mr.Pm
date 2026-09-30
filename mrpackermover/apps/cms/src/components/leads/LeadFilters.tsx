'use client';
import Link from 'next/link';
import { materialUrl } from '../icons/material.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useListQuery } from '@payloadcms/ui';
import { DATED_STAGES, LEAD_SOURCES, LEAD_STATUS, personCase } from '../dashboard/lead-status.js';

/**
 * Pick several filters at once, above the Leads list.
 *
 * Payload's own Filters panel can express all of this and more - it is a full where
 * builder - but every condition costs five interactions: open the panel, add a filter,
 * choose the field, choose the operator, choose the value. Asking "which of these five
 * stages, for these two people" is a form to fill in, and it is a question somebody asks
 * twenty times a day. Here every value is one tick.
 *
 * WITHIN a group the values are OR (status is New or Quoted); BETWEEN groups they are
 * AND (status is New or Quoted, AND the owner is Preeti). That is what people mean when
 * they tick several boxes, and it is the one sentence worth knowing to read this file.
 *
 * THREE MENUS, NOT NINETEEN CHIPS. Laid out flat, every value of every group sat on
 * screen at once - a wall of furniture above the thing you came to read, four rows deep
 * on a phone. Folded away, the bar is a single line of three buttons that say how many
 * of each are on, and the values appear when you ask for them. Nothing became harder to
 * reach: opening a menu you were going to click into anyway costs nothing.
 *
 * IT GOES THROUGH PAYLOAD'S OWN QUERY STATE, never around it. The first version pushed
 * its own URL with `router.push`, which looked right and was not: Payload's
 * ListQueryProvider owns `where`, and when a push removed the parameters it had put
 * there, it rewrote the URL from its own state a moment later. The result was a list
 * showing every row under an address bar that still said "filtered" - a screen lying
 * about what it was showing. `useListQuery` is the provider's own handle; reading and
 * writing through it means there is one owner of the query and nothing to race.
 *
 * Reading the selection back OUT of that state, rather than keeping a copy, is the other
 * half: the menus tick from whatever the list is actually filtered by, so a filter set in
 * Payload's own panel shows here too, and the two can never disagree.
 */

type Leaf = Record<string, Record<string, unknown>>;

/** Flatten a where tree into the leaf conditions it is built from. */
function leaves(where: unknown, out: Leaf[] = []): Leaf[] {
  if (!where || typeof where !== 'object') return out;
  const node = where as Record<string, unknown>;
  for (const key of ['and', 'or']) {
    const branch = node[key];
    if (Array.isArray(branch)) branch.forEach((b) => leaves(b, out));
  }
  const rest = Object.entries(node).filter(([k]) => k !== 'and' && k !== 'or');
  if (rest.length) out.push(Object.fromEntries(rest) as Leaf);
  return out;
}

/** What this bar controls. */
interface Picked {
  status: string[];
  source: string[];
  owner: string[];
  /** One range at a time - see DateRange. */
  date: DateRange;
}

const UNASSIGNED = 'none';
const EMPTY: Picked = { status: [], source: [], owner: [], date: { from: '', to: '' } };

/**
 * The date filter: two dates off a calendar, against whichever date the rest of the bar
 * is talking about.
 *
 * Three drafts, and the last one is the point.
 *
 * It began as six named ranges - today, last 7 days, overdue. Every one was a guess at
 * which window somebody wanted, and a guess is only right by accident: the real
 * questions are "what came in over Diwali week" and "which moves are booked for March".
 * A calendar answers all of them in the same two taps.
 *
 * It then asked WHICH date to measure, with a toggle. That is a question put to the
 * reader that the screen can answer itself.
 *
 * So it answers it. A lead has two dates and which one you mean is already implied by
 * what you are looking at: ask for Scheduled or Call later and you mean the day the
 * work happens; ask for New, or for a source, or for nothing at all, and you mean the
 * day it came in. The field follows the stages picked, and an open date range moves
 * with it rather than silently measuring the wrong thing.
 *
 * The control itself just says "Date", and then the days. It once named the field too -
 * "Date arrived", "Arrived 1 Oct - 11 Oct" - with a line of explanation under the
 * calendars, and all of that was the screen talking about its own mechanics. Whoever
 * picked Scheduled already knows they are looking at moves.
 */
export type DateField = 'createdAt' | 'dueAt';

export interface DateRange {
  /** yyyy-mm-dd, as an input[type=date] speaks it. Empty means open-ended. */
  from: string;
  to: string;
}

const NO_RANGE: DateRange = { from: '', to: '' };
const hasRange = (r: DateRange): boolean => Boolean(r.from || r.to);

/**
 * Which date the picked stages are about.
 *
 * Every selected stage must be a dated one. A mixed selection - Scheduled and Quoted
 * together - is not asking about move days, because half of it has no move day, so it
 * falls back to the date every lead has.
 */
function dateFieldFor(status: string[]): DateField {
  return status.length > 0 && status.every((v) => DATED_STAGES.includes(v)) ? 'dueAt' : 'createdAt';
}

/** yyyy-mm-dd in LOCAL time. `toISOString` would shift the day backwards for anybody
 *  east of UTC - which is everybody here - and hand back yesterday's date. */
const asInputDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "11 Oct" - short enough for a button, unambiguous in a way that 11/10 is not. */
const asShortDate = (v: string): string => {
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Read the selection back out of the list's where clause.
 *
 * `equals` is handled as well as `in` so that a filter somebody built in Payload's own
 * panel still ticks the right boxes here instead of leaving the bar looking empty above
 * a filtered list.
 */
function parse(where: unknown): Picked {
  const picked: Picked = { status: [], source: [], owner: [], date: { ...NO_RANGE } };
  const add = (list: string[], value: unknown): void => {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      const s = String(v);
      if (s && !list.includes(s)) list.push(s);
    }
  };
  const day = (v: unknown): string =>
    typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? asInputDate(new Date(v)) : '';

  for (const leaf of leaves(where)) {
    for (const [field, op] of Object.entries(leaf)) {
      if (!op || typeof op !== 'object') continue;
      const { in: inOp, equals, exists } = op as Record<string, unknown>;
      if (field === 'status') add(picked.status, inOp ?? equals);
      if (field === 'source') add(picked.source, inOp ?? equals);
      if (field === 'assignedTo') {
        if (exists === false || exists === 'false') add(picked.owner, UNASSIGNED);
        else add(picked.owner, inOp ?? equals);
      }
      // Either date can carry the range; which one it was is re-derived from the
      // stages, so only the days themselves need reading back.
      if (field === 'dueAt' || field === 'createdAt') {
        const from = (op as Record<string, unknown>).greater_than_equal;
        const to = (op as Record<string, unknown>).less_than_equal;
        if (from || to) picked.date = { from: day(from), to: day(to) };
      }
    }
  }
  return picked;
}

/** Build the where clause for a selection. */
function build(picked: Picked): Record<string, unknown> {
  const and: Array<Record<string, unknown>> = [];
  if (picked.status.length) and.push({ status: { in: picked.status } });
  if (picked.source.length) and.push({ source: { in: picked.source } });
  if (picked.owner.length) {
    const ids = picked.owner.filter((o) => o !== UNASSIGNED);
    const or: Array<Record<string, unknown>> = [];
    if (ids.length) or.push({ assignedTo: { in: ids } });
    // "Unassigned" is the absence of a value, not an id, so it cannot ride in the same
    // `in` as the people. It becomes its own branch of an OR - which is why this group
    // nests where the other two do not.
    if (picked.owner.includes(UNASSIGNED)) or.push({ assignedTo: { exists: false } });
    and.push(or.length === 1 ? (or[0] as Record<string, unknown>) : { or });
  }
  // Both bounds in ONE leaf, never two entries of an `and`: split apart they filter
  // correctly and then read back wrong, because the parser meets one leaf at a time and
  // would see a lone "from" and a lone "to".
  const when = dateWhere(picked.date, dateFieldFor(picked.status));
  if (when) and.push(when);

  // An empty selection must clear the filter, and an empty object is how Payload spells
  // that. An empty `and: []` is not the same thing - adapters disagree about it, and one
  // of them matches nothing at all, which would empty the list rather than restore it.
  if (and.length === 0) return {};
  return and.length === 1 ? (and[0] as Record<string, unknown>) : { and };
}

/** The where clause for a range, or null when neither end is set. */
function dateWhere(r: DateRange, field: DateField): Record<string, unknown> | null {
  const bounds: Record<string, unknown> = {};
  // Whole days, inclusive at both ends. Picking the 1st to the 30th means the whole of
  // the 30th, not everything up to the moment it began.
  if (r.from) bounds.greater_than_equal = new Date(`${r.from}T00:00:00`).toISOString();
  if (r.to) bounds.less_than_equal = new Date(`${r.to}T23:59:59.999`).toISOString();
  return Object.keys(bounds).length ? { [field]: bounds } : null;
}

interface Person {
  id: string | number;
  name?: string;
  email?: string;
}

interface Option {
  value: string;
  label: string;
  /** Stage colour, shown as a dot so the menu reads like the Status column. */
  color?: string;
}

/**
 * One group, folded into a menu.
 *
 * At module scope rather than inside `LeadFilters`, and that is not a style preference:
 * a component declared inside another is a new type on every render, so React unmounts
 * and remounts it - and an open menu would close itself the moment anything above it
 * re-rendered, which here is every time a filter is applied.
 */
function Dropdown({
  label,
  options,
  picked,
  busy,
  onToggle,
  onClear,
}: {
  label: string;
  options: Option[];
  picked: string[];
  busy: boolean;
  onToggle: (value: string) => void;
  onClear: () => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent): void => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const n = picked.length;

  return (
    <div className="mpm-lf__dd" ref={box}>
      <button
        type="button"
        className={`mpm-lf__trigger${n > 0 ? ' is-on' : ''}${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        {n > 0 && <span className="mpm-lf__badge">{n}</span>}
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          aria-hidden="true"
          className="mpm-lf__caret"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="mpm-lf__panel" role="group" aria-label={label}>
          <div className="mpm-lf__panel-head">
            <span className="mpm-lf__panel-title">{label}</span>
            {n > 0 && (
              <button type="button" className="mpm-lf__panel-clear" onClick={onClear}>
                Clear
              </button>
            )}
          </div>
          <div className="mpm-lf__opts">
            {options.map((o) => {
              const on = picked.includes(o.value);
              return (
                /* A real checkbox inside a label, not a div with a tick drawn on it: the
                   whole row becomes the control, so the hit area is the row rather than
                   the 15px box, and the keyboard and screen reader work for free. */
                <label
                  key={o.value}
                  className={`mpm-lf__opt${on ? ' is-on' : ''}`}
                  style={o.color ? ({ ['--c']: o.color } as React.CSSProperties) : undefined}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={busy}
                    onChange={() => onToggle(o.value)}
                  />
                  {o.color && <i className="mpm-lf__dot" aria-hidden="true" />}
                  <span className="mpm-lf__opt-label">{o.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The date menu: the two ends of the window.
 *
 * Which date they measure is not its business - `build` decides that from the stages -
 * so it takes and hands back nothing but the two days.
 *
 * Its own component rather than a mode of `Dropdown`: that one is a list of checkboxes,
 * this one is two calendars, and bending one into both shapes would have cost more than
 * the lines it saved.
 *
 * At module scope for the same reason `Dropdown` is - a component declared inside
 * another is a new type on every render, and the menu would close itself every time a
 * date was picked.
 */
function DateDropdown({
  picked,
  busy,
  onPick,
}: {
  picked: DateRange;
  busy: boolean;
  onPick: (value: DateRange) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent): void => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const on = hasRange(picked);

  /**
   * The button says WHICH window is on, not merely that one is.
   *
   * Every other control here shows a count, because "Status 2" is all you need. A date
   * filter has one value and the value is the useful part - a number would be standing
   * in for words that fit perfectly well.
   */
  const label = !on
    ? 'Date'
    : picked.from && picked.to
      ? picked.from === picked.to
        ? asShortDate(picked.from)
        : `${asShortDate(picked.from)} – ${asShortDate(picked.to)}`
      : picked.from
        ? `From ${asShortDate(picked.from)}`
        : `Until ${asShortDate(picked.to)}`;

  const set = (next: Partial<DateRange>): void => {
    const merged = { ...picked, ...next };
    // Both boxes emptied means no date filter at all, rather than a range of everything.
    onPick(hasRange(merged) ? merged : NO_RANGE);
  };

  return (
    <div className="mpm-lf__dd" ref={box}>
      <button
        type="button"
        className={`mpm-lf__trigger${on ? ' is-on' : ''}${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          aria-hidden="true"
          className="mpm-lf__caret"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="mpm-lf__panel" role="group" aria-label="Date">
          <div className="mpm-lf__panel-head">
            <span className="mpm-lf__panel-title">Date</span>
            {on && (
              <button
                type="button"
                className="mpm-lf__panel-clear"
                onClick={() => onPick(NO_RANGE)}
              >
                Clear
              </button>
            )}
          </div>

          <div className="mpm-lf__range">
            {/* A native date input, not a bundled picker: it is the calendar the
                person's own phone and desktop already open, it is keyboard-accessible
                with no work, and it adds nothing to the bundle. */}
            <label className="mpm-lf__date">
              <span>From</span>
              <input
                type="date"
                value={picked.from}
                disabled={busy}
                max={picked.to || undefined}
                onChange={(e) => set({ from: e.target.value })}
              />
            </label>
            <label className="mpm-lf__date">
              <span>To</span>
              <input
                type="date"
                value={picked.to}
                disabled={busy}
                // Stops the two ends crossing, which would ask for an empty window.
                min={picked.from || undefined}
                onChange={(e) => set({ to: e.target.value })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function LeadFilters(): React.JSX.Element | null {
  const { query, handleWhereChange } = useListQuery();
  const { user } = useAuth();
  const [team, setTeam] = useState<Person[]>([]);
  /**
   * Only the people who hand leads out get an Owner menu.
   *
   * A salesperson's list is their own leads and nothing else, so the menu could only
   * ever offer them their own name. Gating on the role rather than on what the staff
   * lookup returns matters: a salesperson CAN read one user record - their own - so the
   * lookup succeeded with a list of one, and the menu appeared anyway.
   */
  const role = (user as { role?: string } | null)?.role;
  const routes = role === 'admin' || role === 'handler';
  const [busy, setBusy] = useState(false);

  const picked = useMemo(() => parse(query?.where), [query?.where]);
  const total =
    picked.status.length +
    picked.source.length +
    picked.owner.length +
    (hasRange(picked.date) ? 1 : 0);

  useEffect(() => {
    if (!routes) return undefined;
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(
          '/api/users?limit=100&depth=0&where[role][in][0]=sales&where[role][in][1]=handler',
          { credentials: 'include' },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { docs?: Person[] };
        if (alive) setTeam(json.docs ?? []);
      } catch {
        // Offline or refused: no Owner menu, and the other three still work.
      }
    })();
    return () => {
      alive = false;
    };
  }, [routes]);

  const apply = (next: Picked): void => {
    if (!handleWhereChange) return;
    setBusy(true);
    void Promise.resolve(handleWhereChange(build(next) as never)).finally(() => setBusy(false));
  };

  // The three OR-able groups. `date` is deliberately not one of them.
  const toggle = (group: 'status' | 'source' | 'owner', value: string): void => {
    const current = picked[group];
    apply({
      ...picked,
      [group]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  return (
    <div className="mpm-lf">
      <style>{CSS}</style>

      <Dropdown
        label="Status"
        options={LEAD_STATUS.map((s) => ({ value: s.value, label: s.label, color: s.color }))}
        picked={picked.status}
        busy={busy}
        onToggle={(v) => toggle('status', v)}
        onClear={() => apply({ ...picked, status: [] })}
      />

      <Dropdown
        label="Source"
        options={LEAD_SOURCES}
        picked={picked.source}
        busy={busy}
        onToggle={(v) => toggle('source', v)}
        onClear={() => apply({ ...picked, source: [] })}
      />

      {routes && team.length > 0 && (
        <Dropdown
          label="Owner"
          options={[
            { value: UNASSIGNED, label: 'Unassigned' },
            ...team.map((p) => ({
              value: String(p.id),
              label: personCase(p.name ?? p.email ?? String(p.id)),
            })),
          ]}
          picked={picked.owner}
          busy={busy}
          onToggle={(v) => toggle('owner', v)}
          onClear={() => apply({ ...picked, owner: [] })}
        />
      )}

      <DateDropdown
        picked={picked.date}
        busy={busy}
        onPick={(date) => apply({ ...picked, date })}
      />

      {/* Looking at booked moves as a list, the same moves on a calendar are one tap
          away. Only offered when Scheduled is picked - on any other filter the calendar
          would open on moves this list is not showing. */}
      {picked.status.includes('scheduled') && (
        <Link className="mpm-lf__cal" href="/admin/calendar">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          Calendar view
        </Link>
      )}

      {total > 0 && (
        <span className="mpm-lf__summary">
          <span className="mpm-lf__count">
            {total} filter{total === 1 ? '' : 's'} on
          </span>
          <button
            type="button"
            className="mpm-lf__clear"
            disabled={busy}
            onClick={() => apply(EMPTY)}
          >
            Clear all
          </button>
        </span>
      )}
    </div>
  );
}

const CSS = `
/* One line. The bar is chrome above the list, not a second screen. */
.mpm-lf{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:0 0 14px; }
.mpm-lf__dd{ position:relative; }

.mpm-lf__trigger{
  display:inline-flex; align-items:center; gap:7px;
  min-height:36px; padding:0 13px; border-radius:999px;
  border:1px solid var(--mpm-line, var(--theme-elevation-150));
  background:var(--mpm-paper, var(--theme-elevation-0));
  color:var(--mpm-ink-2, var(--theme-elevation-700));
  font-size:13px; font-weight:600; font-family:inherit; cursor:pointer;
  transition:border-color .12s, background .12s, color .12s;
}
.mpm-lf__trigger:hover:not(:disabled){
  border-color:var(--mpm-v-500, #2558E6); color:var(--mpm-ink, var(--theme-elevation-1000));
}
.mpm-lf__trigger:focus-visible{ outline:2px solid var(--mpm-v-400, #4A7BF7); outline-offset:2px; }
.mpm-lf__trigger:disabled{ opacity:.6; cursor:default; }
/* Carrying a filter, the button says so without being opened: tinted, with the number on
   it. That count is the whole point - a closed menu hiding three active filters would be
   worse than no menu at all. */
.mpm-lf__trigger.is-on{
  background:color-mix(in srgb, var(--mpm-v-500, #2558E6) 11%, transparent);
  border-color:color-mix(in srgb, var(--mpm-v-500, #2558E6) 42%, transparent);
  color:var(--mpm-ink, var(--theme-elevation-1000));
}
.mpm-lf__badge{
  display:inline-grid; place-items:center; min-width:18px; height:18px; padding:0 5px;
  border-radius:999px; background:var(--mpm-v-500, #2558E6); color:#fff;
  font-size:11px; font-weight:700; font-variant-numeric:tabular-nums;
}
.mpm-lf__caret{ opacity:.55; transition:transform .14s; }
.mpm-lf__trigger.is-open .mpm-lf__caret{ transform:rotate(180deg); }

.mpm-lf__panel{
  position:absolute; top:calc(100% + 6px); left:0; z-index:30;
  min-width:220px; max-width:280px;
  background:var(--mpm-paper, var(--theme-elevation-0));
  border:1px solid var(--mpm-line, var(--theme-elevation-150));
  border-radius:var(--style-radius-m, 14px);
  box-shadow:0 1px 2px rgba(15,21,35,.10), 0 18px 38px -14px rgba(15,21,35,.30);
  overflow:hidden;
}
.mpm-lf__panel-head{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  padding:9px 12px; border-bottom:1px solid var(--mpm-line, var(--theme-elevation-150));
}
.mpm-lf__panel-title{
  font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--mpm-ink-3, var(--theme-elevation-500));
}
.mpm-lf__panel-clear{
  border:0; background:none; padding:0; cursor:pointer;
  font-size:11px; font-weight:700; font-family:inherit;
  color:var(--mpm-v-500, #2558E6);
}
.mpm-lf__panel-clear:hover{ text-decoration:underline; }
/* Twelve stages would push the list off the screen, so the menu scrolls, not the page. */
.mpm-lf__opts{ max-height:290px; overflow-y:auto; padding:5px; }
.mpm-lf__opt{
  --c:var(--mpm-v-500, #2558E6);
  display:flex; align-items:center; gap:9px;
  padding:7px 9px; border-radius:9px; cursor:pointer;
  font-size:13px; font-weight:500;
  color:var(--mpm-ink-2, var(--theme-elevation-700));
}
.mpm-lf__opt:hover{ background:color-mix(in srgb, var(--mpm-v-500, #2558E6) 8%, transparent); }
.mpm-lf__opt.is-on{ color:var(--mpm-ink, var(--theme-elevation-1000)); font-weight:600; }
.mpm-lf__opt input{
  width:15px; height:15px; margin:0; flex:none;
  accent-color:var(--mpm-v-500, #2558E6); cursor:pointer;
}
.mpm-lf__dot{ width:7px; height:7px; border-radius:50%; background:var(--c); flex:none; }
.mpm-lf__opt-label{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
/* The calendar half of the menu. */
.mpm-lf__range{ display:flex; flex-direction:column; gap:8px; padding:10px 12px 12px; }
.mpm-lf__date{ display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600;
  color:var(--mpm-ink-3, var(--theme-elevation-500)); }
.mpm-lf__date > span{ width:34px; flex:none; }
.mpm-lf__date input{
  flex:1; min-width:0; min-height:32px; padding:0 9px;
  border:1px solid var(--mpm-line, var(--theme-elevation-150));
  border-radius:9px; background:var(--mpm-paper, var(--theme-elevation-0));
  color:var(--theme-text); font-size:12px; font-family:inherit;
}
.mpm-lf__date input:focus{ outline:2px solid var(--mpm-v-400, #4A7BF7); outline-offset:1px; }

.mpm-lf__summary{ display:inline-flex; align-items:center; gap:9px; margin-left:2px; }
.mpm-lf__cal{
  display:inline-flex; align-items:center; gap:7px; order:9; margin-left:auto;
  min-height:36px; padding:0 14px; border-radius:999px; text-decoration:none;
  border:1px solid color-mix(in srgb, var(--mpm-v-500, #2558E6) 40%, transparent);
  color:var(--mpm-v-500, #2558E6); font-size:13px; font-weight:600;
}
.mpm-lf__cal:hover{ background:color-mix(in srgb, var(--mpm-v-500, #2558E6) 9%, transparent); }
.mpm-lf__count{
  font-size:12px; font-weight:600;
  color:var(--mpm-ink-3, var(--theme-elevation-500));
  font-variant-numeric:tabular-nums;
}
.mpm-lf__clear{
  border:0; background:none; padding:4px 0; cursor:pointer;
  font-size:12px; font-weight:600; font-family:inherit;
  color:var(--mpm-v-500, #2558E6);
}
.mpm-lf__clear:hover:not(:disabled){ text-decoration:underline; }
.mpm-lf__clear:disabled{ opacity:.6; cursor:default; }

/* ══ Google look ══ Google's filter chips and menus (Gmail, Drive): 32px chips with 8px
   corners and a hairline; a chip carrying a filter fills pale blue and shows a tick;
   the menu is a white sheet on Google's two-part shadow. */
.mpm-lf__trigger{ min-height:32px; padding:0 12px; border-radius:8px; border-color:var(--mpm-rule);
  background:transparent; color:var(--mpm-ink-2); font-size:14px; font-weight:500; letter-spacing:.01em; }
.mpm-lf__trigger:hover:not(:disabled){ background:var(--mpm-hover); border-color:var(--mpm-rule); color:var(--mpm-ink); }
.mpm-lf__trigger.is-on{ background:var(--mpm-sel-2); border-color:transparent; color:var(--mpm-on-sel-2); }
.mpm-lf__trigger.is-on::before{ content:""; width:18px; height:18px; margin-left:-4px; flex:none; background:currentColor;
  -webkit-mask:${materialUrl('check')} center/contain no-repeat; mask:${materialUrl('check')} center/contain no-repeat; }
/* How many are picked: a small round count in the chip's own ink, inverted - the way
   Gmail badges a number. It used to be "· 2" typed into an 18px grid box, where the dot
   and the digit became two grid rows and the digit fell out below the chip. */
.mpm-lf__badge{ display:inline-flex; align-items:center; justify-content:center; flex:none;
  min-width:18px; height:18px; padding:0 5px; box-sizing:border-box; border-radius:999px;
  background:var(--mpm-on-sel-2); color:var(--mpm-sel-2);
  font-size:11px; font-weight:600; line-height:1; font-variant-numeric:tabular-nums; }
.mpm-lf__panel{ border:0; border-radius:8px;
  box-shadow:0 1px 2px rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15); }
html[data-theme="dark"] .mpm-lf__panel{ background:#2D2F31; box-shadow:0 1px 3px rgba(0,0,0,.6), 0 4px 8px 3px rgba(0,0,0,.3); }
.mpm-lf__panel-head{ border-bottom:1px solid var(--mpm-line); }
.mpm-lf__panel-title{ font-size:14px; font-weight:500; letter-spacing:.01em; text-transform:none; color:var(--mpm-ink); }
.mpm-lf__opt{ min-height:40px; padding:0 12px; border-radius:0; font-size:14px; font-weight:400; }
.mpm-lf__opts{ padding:6px 0; }
.mpm-lf__opt:hover{ background:var(--mpm-hover); }
.mpm-lf__opt.is-on{ font-weight:500; }
.mpm-lf__opt input{ width:18px; height:18px; accent-color:var(--mpm-v-500); }
.mpm-lf__date input{ border-radius:4px; border-color:var(--mpm-rule); min-height:40px; font-size:14px; }
.mpm-lf__clear,.mpm-lf__panel-clear{ font-weight:500; }
.mpm-lf__cal{ min-height:32px; border-radius:8px; border-color:var(--mpm-rule); font-weight:500; }

/* On a phone the four buttons do not fit one row, and wrapped as they come they left Date
   alone on a second line, three-and-one. A two-by-two grid of equal buttons - label left,
   arrow right - is the same shape as Payload's own Columns / Filters pair directly above,
   so the two rows read as one set of controls rather than two styles stacked. */
@media (max-width:640px){
  .mpm-lf{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .mpm-lf__trigger{ width:100%; min-height:40px; justify-content:space-between; padding:0 14px; }
  .mpm-lf__trigger .mpm-lf__badge{ margin-left:auto; }
  /* An odd one out takes the whole row: a salesperson has no Owner menu, and three
     buttons in a two-column grid would otherwise leave a hole beside the last. Only the
     menus are divs here - the style tag and the summary are not - so of-type counts them. */
  .mpm-lf__dd:nth-of-type(odd):last-of-type{ grid-column:1 / -1; }
  .mpm-lf__summary{ grid-column:1 / -1; justify-content:space-between; margin:2px 2px 0; }
  .mpm-lf__cal{ grid-column:1 / -1; justify-content:center; margin-left:0; min-height:40px; }

  /* Each menu opens under its own button but spans the whole bar: a 220px panel hanging
     off the right-hand column would run off a 390px screen. The left column reaches
     right by one column and the gap; the right column reaches left the same distance. */
  .mpm-lf__panel{ min-width:0; max-width:none; }
  .mpm-lf__dd:nth-of-type(odd) .mpm-lf__panel{ left:0; right:calc(-100% - 8px); }
  .mpm-lf__dd:nth-of-type(even) .mpm-lf__panel{ left:calc(-100% - 8px); right:0; }
  .mpm-lf__dd:nth-of-type(odd):last-of-type .mpm-lf__panel{ right:0; }
  .mpm-lf__opt{ padding:10px 9px; }
}
`;
