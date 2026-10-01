'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DuePrompt } from '../leads/DuePrompt.js';
import { PhoneButtons } from '../leads/PhoneActions.js';
import { MIcon } from '../icons/MIcon.js';
import { materialUrl } from '../icons/material.js';
import {
  CAL_GROUPS,
  CAL_STATES,
  DEFAULT_STATES,
  HEAT_LABEL,
  WEEK_HEAD,
  addDays,
  addMonths,
  dayNum,
  heatOf,
  isWeekend,
  longDate,
  monthGrid,
  monthOf,
  monthTitle,
  shortDate,
  stateMeta,
  stateOf,
  takesCapacity,
  weekDays,
  weekTitle,
  weekdayOf,
  type CalItem,
  type CalState,
  type CalView,
  type DayKey,
  type Heat,
} from './calendar-model.js';

/**
 * The calendar in the browser: the three views, the filters and drag-to-reschedule.
 *
 * Everything it draws arrives pre-computed from the server - day keys, times, states -
 * and nothing here reads the clock, so the first paint matches the server's exactly and
 * there is nothing to hydrate differently.
 *
 * FILTERS ARE LOCAL. A month is a few dozen moves; filtering them here is instant, where
 * a round trip per tick of a checkbox would not be. They are mirrored into the URL all
 * the same, so a filtered calendar can be bookmarked, shared, and survives the view and
 * date links - which carry the filters with them.
 */

export interface CalFilters {
  states: CalState[];
  owner: string;
  service: string;
  city: string;
  mine: boolean;
}

interface Props {
  view: CalView;
  date: DayKey;
  today: DayKey;
  items: CalItem[];
  /** Company-wide moves per day, for the colours - see the server file. */
  dayLoad: Record<DayKey, number>;
  capacity: number;
  /** Won leads with no move date - they exist, but nothing can place them on a day. */
  undatedWon: number;
  canReschedule: boolean;
  canSeeTeam: boolean;
  meId: string;
  initialFilters: CalFilters;
}

const UNASSIGNED = 'none';

/** Chips a month cell shows before it says "+N more". */
const MONTH_CHIPS = 3;

const sameStates = (a: CalState[], b: CalState[]): boolean =>
  a.length === b.length && a.every((s) => b.includes(s));

function calHref(view: CalView, date: DayKey, f: CalFilters): string {
  const p = new URLSearchParams();
  if (view !== 'month') p.set('view', view);
  p.set('date', date);
  if (!sameStates(f.states, DEFAULT_STATES)) p.set('show', f.states.join(','));
  if (f.owner) p.set('owner', f.owner);
  if (f.service) p.set('service', f.service);
  if (f.city) p.set('city', f.city);
  if (f.mine) p.set('mine', '1');
  return `/admin/calendar?${p.toString()}`;
}

const leadHref = (id: string | number): string => `/admin/collections/leads/${String(id)}`;

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

const routeOf = (it: CalItem): string =>
  it.from && it.to ? `${it.from} → ${it.to}` : it.from || it.to;

interface Toast {
  key: number;
  text: string;
  tone: 'ok' | 'warn' | 'error';
  undo?: () => void;
}

export function CalendarApp(props: Props): React.JSX.Element {
  const { view, date, today, capacity, canReschedule, canSeeTeam, meId } = props;
  const router = useRouter();
  const [filters, setFilters] = useState<CalFilters>(props.initialFilters);
  /** Where a dragged move now sits, until the server confirms it on the next refresh. */
  const [moved, setMoved] = useState<Record<string, DayKey>>({});
  const [drag, setDrag] = useState<CalItem | null>(null);
  const [over, setOver] = useState<DayKey | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fresh data from the server supersedes any move still waiting to be confirmed.
  useEffect(() => setMoved({}), [props.items]);

  // Keep the address bar in step with the filters, without a navigation.
  useEffect(() => {
    const next = calHref(view, date, filters);
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [filters, view, date]);

  useEffect(() => {
    if (!toast) return undefined;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), toast.undo ? 8000 : 5000);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  /** Items with any unconfirmed moves applied. */
  const items = useMemo(
    () =>
      props.items.map((it) => {
        const day = moved[String(it.id)];
        return day && day !== it.day ? { ...it, day, state: stateOf(it.status, day, today) } : it;
      }),
    [props.items, moved, today],
  );

  /** The day totals, adjusted for unconfirmed moves so a drop recolours the day at once. */
  const loadFor = (day: DayKey): number => {
    let n = props.dayLoad[day] ?? 0;
    for (const it of props.items) {
      const to = moved[String(it.id)];
      if (!to || to === it.day || !takesCapacity(it.state)) continue;
      if (it.day === day) n -= 1;
      if (to === day) n += 1;
    }
    return Math.max(0, n);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const passesOthers = (it: CalItem): boolean => {
    if (filters.mine && it.ownerId !== meId) return false;
    if (filters.owner) {
      if (filters.owner === UNASSIGNED ? it.ownerId !== null : it.ownerId !== filters.owner)
        return false;
    }
    if (filters.service && it.service !== filters.service) return false;
    if (filters.city && it.from !== filters.city && it.to !== filters.city) return false;
    return true;
  };
  const shown = items.filter((it) => passesOthers(it) && filters.states.includes(it.state));

  const byDay: Record<DayKey, CalItem[]> = {};
  for (const it of shown) (byDay[it.day] ??= []).push(it);
  for (const list of Object.values(byDay)) list.sort((a, b) => a.hhmm.localeCompare(b.hhmm));

  /** The days the chip counts cover: the month itself, the week, or the day. */
  const periodDays = useMemo<Set<DayKey>>(() => {
    if (view === 'day') return new Set([date]);
    if (view === 'week') return new Set(weekDays(date));
    return new Set(
      monthGrid(date)
        .flat()
        .filter((d) => monthOf(d) === monthOf(date)),
    );
  }, [view, date]);

  const stateCounts = Object.fromEntries(CAL_STATES.map((s) => [s.value, 0])) as Record<
    CalState,
    number
  >;
  for (const it of items)
    if (periodDays.has(it.day) && passesOthers(it)) stateCounts[it.state] += 1;

  const options = useMemo(() => {
    const owners = new Map<string, string>();
    const services = new Set<string>();
    const cities = new Set<string>();
    for (const it of props.items) {
      if (it.ownerId) owners.set(it.ownerId, it.ownerName);
      if (it.service) services.add(it.service);
      if (it.from) cities.add(it.from);
      if (it.to) cities.add(it.to);
    }
    const sort = (a: string, b: string): number => a.localeCompare(b);
    return {
      owners: [...owners.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      services: [...services].sort(sort),
      cities: [...cities].sort(sort),
    };
  }, [props.items]);

  const narrowed =
    Boolean(filters.owner || filters.service || filters.city || filters.mine) ||
    !sameStates(filters.states, DEFAULT_STATES);

  const toggleState = (s: CalState): void =>
    setFilters((f) => ({
      ...f,
      states: f.states.includes(s) ? f.states.filter((x) => x !== s) : [...f.states, s],
    }));

  /**
   * A group's heading switches its parts together. Anything less than all of them on
   * turns them all on; all on turns them all off - the way a "select all" box behaves,
   * which is also what its little box draws: a tick, a dash for "some", or empty.
   */
  const groupState = (states: CalState[]): 'all' | 'some' | 'none' => {
    const n = states.filter((s) => filters.states.includes(s)).length;
    return n === states.length ? 'all' : n === 0 ? 'none' : 'some';
  };
  const toggleGroup = (states: CalState[]): void =>
    setFilters((f) => ({
      ...f,
      states:
        groupState(states) === 'all'
          ? f.states.filter((s) => !states.includes(s))
          : [...new Set([...f.states, ...states])],
    }));

  const stateButton = (s: (typeof CAL_STATES)[number]): React.JSX.Element => {
    const on = filters.states.includes(s.value);
    return (
      <button
        key={s.value}
        type="button"
        className={`cal-state${on ? ' is-on' : ''}`}
        style={stateStyle(s.value)}
        aria-pressed={on}
        title={`${s.label}: ${s.hint}`}
        onClick={() => toggleState(s.value)}
      >
        <i aria-hidden="true" data-state={s.value} />
        {s.label}
        <b>{stateCounts[s.value]}</b>
      </button>
    );
  };

  // ── Rescheduling ──────────────────────────────────────────────────────────
  const draggable = (it: CalItem): boolean =>
    canReschedule && it.state !== 'won' && it.state !== 'lost';

  const move = async (it: CalItem, day: DayKey, isUndo = false): Promise<void> => {
    const from = it.day;
    if (day === from) return;
    setMoved((m) => ({ ...m, [String(it.id)]: day }));
    try {
      // The move keeps its time of day and changes only the date. Written with the IST
      // offset spelled out, so the result is the same whatever zone this browser is in.
      const dueAt = new Date(`${day}T${it.hhmm}:00+05:30`).toISOString();
      const res = await fetch(`/api/leads/${String(it.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueAt }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const over = takesCapacity(it.state) && loadFor(day) + (isUndo ? 0 : 1) > capacity;
      setToast({
        key: Date.now(),
        tone: over ? 'warn' : 'ok',
        text: isUndo
          ? `${it.name} is back on ${shortDate(day)}`
          : `${it.name} moved to ${weekdayOf(day)} ${shortDate(day)}${over ? ' - that day is now over capacity' : ''}`,
        undo: isUndo ? undefined : () => void move({ ...it, day }, from, true),
      });
      router.refresh();
    } catch {
      setMoved((m) => {
        const next = { ...m };
        delete next[String(it.id)];
        return next;
      });
      setToast({
        key: Date.now(),
        tone: 'error',
        text: `Could not move ${it.name}. Nothing changed - try again.`,
      });
    }
  };

  /** A day accepts a drop if something is being dragged and the day has not passed. */
  const dropProps = (day: DayKey): React.HTMLAttributes<HTMLElement> =>
    canReschedule
      ? {
          onDragOver: (e) => {
            if (!drag || day < today) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (over !== day) setOver(day);
          },
          onDragLeave: (e) => {
            if (over === day && !e.currentTarget.contains(e.relatedTarget as Node | null))
              setOver(null);
          },
          onDrop: (e) => {
            e.preventDefault();
            const it = drag;
            setOver(null);
            setDrag(null);
            if (it && day >= today) void move(it, day);
          },
        }
      : {};

  const dragProps = (it: CalItem): React.HTMLAttributes<HTMLElement> & { draggable?: boolean } =>
    draggable(it)
      ? {
          draggable: true,
          onDragStart: (e) => {
            e.dataTransfer.setData('text/plain', String(it.id));
            e.dataTransfer.effectAllowed = 'move';
            setDrag(it);
          },
          onDragEnd: () => {
            setDrag(null);
            setOver(null);
          },
        }
      : { draggable: false };

  const heatFor = (day: DayKey): Heat | 'past' =>
    day < today ? 'past' : heatOf(loadFor(day), capacity);

  const dayHref = (day: DayKey): string => calHref('day', day, filters);
  const prev =
    view === 'month'
      ? addMonths(date, -1)
      : view === 'week'
        ? addDays(date, -7)
        : addDays(date, -1);
  const next =
    view === 'month' ? addMonths(date, 1) : view === 'week' ? addDays(date, 7) : addDays(date, 1);
  const title =
    view === 'month' ? monthTitle(date) : view === 'week' ? weekTitle(date) : longDate(date);
  const periodWord = view === 'month' ? 'this month' : view === 'week' ? 'this week' : 'this day';

  const stateStyle = (s: CalState): React.CSSProperties => ({
    ['--c' as string]: stateMeta(s).color,
  });

  // ── Pieces ────────────────────────────────────────────────────────────────
  // Render functions, not components: a component declared in here would be a new type
  // on every render, so React would remount the card being dragged the moment the drag
  // started - and the browser cancels a drag whose element disappears.
  const moveCard = (it: CalItem): React.JSX.Element => (
    <article
      key={String(it.id)}
      className={`cal-card${drag?.id === it.id ? ' is-dragging' : ''}${draggable(it) ? ' is-movable' : ''}`}
      data-state={it.state}
      style={stateStyle(it.state)}
      title={draggable(it) ? 'Drag to another day to reschedule' : undefined}
      {...dragProps(it)}
    >
      <div className="cal-card__row">
        <span className="cal-card__time">{it.time}</span>
        <span className="cal-pill">{stateMeta(it.state).pill}</span>
      </div>
      <Link className="cal-card__name" href={leadHref(it.id)} draggable={false}>
        {it.name}
      </Link>
      {routeOf(it) && <div className="cal-card__route">{routeOf(it)}</div>}
      {(it.size || it.service) && (
        <div className="cal-card__meta">{[it.size, it.service].filter(Boolean).join(' · ')}</div>
      )}
      {canSeeTeam && (
        <div className={`cal-owner${it.ownerId ? '' : ' is-none'}`}>
          <i aria-hidden="true">{it.ownerId ? initials(it.ownerName) : '?'}</i>
          {it.ownerName}
        </div>
      )}
    </article>
  );

  /**
   * How full the day is, drawn as SLOTS - one dot per move the company can run that day,
   * filled for each one taken.
   *
   * It was a bare number in the corner, "2" or "2/4", and a number in the corner of a
   * filtered calendar reads as "how many of the leads I filtered for". It is not: it
   * counts every move that day, whatever the filters, because "can we take one more on
   * Saturday?" is a question about the whole company - it is how a salesperson who sees
   * only their own leads still knows a day is full. Dots cannot be misread as a lead
   * count, and the tooltip says it in words.
   *
   * Nothing on a past day: capacity is a question about days still to sell, and a
   * finished day's moves are already listed on it. Nothing on an untouched day in the
   * month either - see below.
   */
  const loadBadge = (day: DayKey, compact = false): React.JSX.Element | null => {
    const heat = heatFor(day);
    if (heat === 'past') return null;
    const load = loadFor(day);
    // On the month grid an untouched day stays clean: a row of empty rings in every cell
    // is noise, and the plain white cell already says "free". The week has room to say it.
    if (compact && load === 0) return null;
    const over = Math.max(0, load - capacity);
    const words = `${load} of ${capacity} slots taken · ${HEAT_LABEL[heat]}`;
    const title = `${words}. Counts every move that day, not only the ones your filters show.`;
    return (
      <span
        className={`cal-load${compact ? ' is-compact' : ''}`}
        data-heat={heat}
        title={title}
        aria-label={title}
      >
        {capacity <= 8 ? (
          <span className="cal-slots" aria-hidden="true">
            {Array.from({ length: capacity }, (_, i) => (
              <i key={i} className={i < load ? 'on' : undefined} />
            ))}
            {over > 0 && <b>+{over}</b>}
          </span>
        ) : (
          <span className="cal-load__n" aria-hidden="true">
            {load}
            <small>/{capacity}</small>
          </span>
        )}
        {!compact && (
          <span className="cal-load__words" aria-hidden="true">
            {load}/{capacity}
          </span>
        )}
      </span>
    );
  };

  // ── Views ─────────────────────────────────────────────────────────────────
  const monthView = (
    <div className="cal-m" role="grid" aria-label={monthTitle(date)}>
      <div className="cal-m__head" role="row">
        {WEEK_HEAD.map((d) => (
          <span
            key={d}
            role="columnheader"
            className={d === 'Sat' || d === 'Sun' ? 'is-we' : undefined}
          >
            {d}
          </span>
        ))}
      </div>
      {monthGrid(date).map((week) => (
        // A week wholly in the past is history: it keeps its place in the grid but not
        // its height, so the weeks still to come - the ones anybody is booking into - sit
        // on screen instead of under three rows of finished days.
        <div
          className="cal-m__week"
          role="row"
          key={week[0]}
          data-past={week[6]! < today || undefined}
        >
          {week.map((day) => {
            const list = byDay[day] ?? [];
            const heat = heatFor(day);
            return (
              <div
                key={day}
                role="gridcell"
                className="cal-m__cell"
                data-heat={heat}
                data-out={monthOf(day) !== monthOf(date) || undefined}
                data-today={day === today || undefined}
                data-we={isWeekend(day) || undefined}
                data-over={over === day || undefined}
                data-blocked={(drag && day < today) || undefined}
                {...dropProps(day)}
              >
                {/* The whole cell opens the day on a phone, where chips are too small to
                    tap; on a desktop the chips are the targets and this sits underneath. */}
                <Link
                  className="cal-m__hit"
                  href={dayHref(day)}
                  aria-label={`${longDate(day)}: ${list.length} ${list.length === 1 ? 'entry' : 'entries'}`}
                  draggable={false}
                />
                <div className="cal-m__top">
                  <Link className="cal-m__num" href={dayHref(day)} draggable={false} tabIndex={-1}>
                    {dayNum(day)}
                  </Link>
                  {loadBadge(day, true)}
                </div>
                <ul className="cal-m__items">
                  {list.slice(0, MONTH_CHIPS).map((it) => (
                    <li key={String(it.id)}>
                      <Link
                        className={`cal-chip${drag?.id === it.id ? ' is-dragging' : ''}`}
                        data-state={it.state}
                        style={stateStyle(it.state)}
                        href={leadHref(it.id)}
                        title={`${it.time} · ${it.name}${routeOf(it) ? ` · ${routeOf(it)}` : ''} · ${stateMeta(it.state).pill}`}
                        {...dragProps(it)}
                      >
                        <span className="cal-chip__time">{it.time.replace(':00', '')}</span>
                        <span className="cal-chip__name">{it.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {list.length > MONTH_CHIPS && (
                  <Link className="cal-m__more" href={dayHref(day)} draggable={false}>
                    +{list.length - MONTH_CHIPS} more
                  </Link>
                )}
                {list.length > 0 && (
                  <span className="cal-m__dots" aria-hidden="true">
                    {list.slice(0, 4).map((it) => (
                      <i key={String(it.id)} style={stateStyle(it.state)} />
                    ))}
                    {list.length > 4 && <b>+{list.length - 4}</b>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const weekView = (
    <div className="cal-w">
      {weekDays(date).map((day) => {
        const list = byDay[day] ?? [];
        return (
          <section
            key={day}
            className="cal-w__col"
            data-today={day === today || undefined}
            data-past={day < today || undefined}
            data-empty={list.length === 0 || undefined}
            data-over={over === day || undefined}
            data-blocked={(drag && day < today) || undefined}
            {...dropProps(day)}
          >
            {/* The whole day opens its Day view, as a day does in the month: the header
                is one link, and any empty space in the column is another underneath the
                cards. It used to be only the small date - the rest of the header, and
                the column, did nothing when tapped. */}
            <Link
              className="cal-w__hit"
              href={dayHref(day)}
              aria-hidden="true"
              tabIndex={-1}
              draggable={false}
            />
            <Link
              href={dayHref(day)}
              className="cal-w__head"
              draggable={false}
              aria-label={`Open ${longDate(day)}`}
            >
              <span className="cal-w__day">
                <span className="cal-w__wd">{weekdayOf(day)}</span>
                <span className="cal-w__dn">{dayNum(day)}</span>
              </span>
              <span className="cal-w__end">
                {loadBadge(day)}
                <svg
                  className="cal-w__go"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  aria-hidden="true"
                >
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
            <div className="cal-w__list">
              {list.map((it) => moveCard(it))}
              {list.length === 0 && (
                <p className="cal-w__none">{day < today ? 'Nothing' : 'Free'}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );

  const dayList = byDay[date] ?? [];
  const dayLoadNow = loadFor(date);
  const dayHeat = heatFor(date);
  const dayView = (
    <div className="cal-d">
      <div className="cal-d__cap" data-heat={dayHeat}>
        <div>
          <strong>
            {dayHeat === 'past'
              ? `${dayLoadNow} ${dayLoadNow === 1 ? 'move' : 'moves'} on this day`
              : `${dayLoadNow} of ${capacity} slots taken`}
          </strong>
          <span>
            {dayHeat === 'past'
              ? 'Past day'
              : dayHeat === 'full'
                ? 'Full - offer the customer another date'
                : dayHeat === 'free'
                  ? 'Nothing scheduled yet'
                  : `${HEAT_LABEL[dayHeat]} · ${Math.max(0, capacity - dayLoadNow)} ${capacity - dayLoadNow === 1 ? 'slot' : 'slots'} left · every move that day, whatever the filters`}
          </span>
        </div>
        {dayHeat !== 'past' && (
          <span className="cal-load__bar is-wide" aria-hidden="true">
            <i style={{ width: `${Math.min(100, Math.round((dayLoadNow / capacity) * 100))}%` }} />
          </span>
        )}
      </div>

      {dayList.length === 0 ? (
        <div className="cal-empty">
          <strong>Nothing on this day</strong>
          <span>
            {narrowed
              ? 'Your filters may be hiding something - clear them to see everything.'
              : 'Scheduled leads land here on their move date.'}
          </span>
        </div>
      ) : (
        <ol className="cal-d__list">
          {dayList.map((it) => (
            <li key={String(it.id)}>
              <article
                className={`cal-dcard${draggable(it) ? ' is-movable' : ''}`}
                data-state={it.state}
                style={stateStyle(it.state)}
              >
                <div className="cal-dcard__time">{it.time}</div>
                <div className="cal-dcard__body">
                  <div className="cal-dcard__top">
                    <Link className="cal-dcard__name" href={leadHref(it.id)}>
                      {it.name}
                    </Link>
                    <span className="cal-pill">{stateMeta(it.state).pill}</span>
                  </div>
                  <div className="cal-dcard__route">
                    <span>{it.pickup || 'Pickup not given'}</span>
                    <i aria-hidden="true">→</i>
                    <span>{it.drop || 'Drop not given'}</span>
                  </div>
                  {(it.size || it.service) && (
                    <div className="cal-dcard__meta">
                      {[it.size, it.service].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <div className="cal-dcard__foot">
                    {canSeeTeam ? (
                      <span className={`cal-owner${it.ownerId ? '' : ' is-none'}`}>
                        <i aria-hidden="true">{it.ownerId ? initials(it.ownerName) : '?'}</i>
                        {it.ownerName}
                      </span>
                    ) : (
                      <span />
                    )}
                    {it.phone && (
                      <PhoneButtons
                        phone={it.phone}
                        lead={{
                          name: it.name,
                          service: it.service,
                          moveSize: it.size,
                          pickup: it.pickup,
                          dropLocation: it.drop,
                          status: it.status,
                        }}
                      />
                    )}
                  </div>
                  {it.state === 'overdue' && <DuePrompt id={it.id} status={it.status} />}
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="mpm-cal">
      <style>{CSS}</style>

      {/* Google Calendar's toolbar, in its order: Today, back, forward, then the period
          in large type; the view switch sits on the right. The page's own name is for
          screen readers - the app bar already says where you are. */}
      <header className="cal-head">
        <h1 className="cal-sr">Calendar</h1>
        <nav className="cal-nav" aria-label="Move through dates">
          <Link
            className={`cal-nav__today${date === today ? ' is-on' : ''}`}
            href={calHref(view, today, filters)}
          >
            Today
          </Link>
          <Link
            className="cal-nav__btn"
            href={calHref(view, prev, filters)}
            aria-label="Previous"
            title="Previous"
          >
            <MIcon name="chevron_left" size={24} />
          </Link>
          <Link
            className="cal-nav__btn"
            href={calHref(view, next, filters)}
            aria-label="Next"
            title="Next"
          >
            <MIcon name="chevron_right" size={24} />
          </Link>
        </nav>
        <span className="cal-head__period">{title}</span>
        <nav className="cal-views" aria-label="View">
          {(['month', 'week', 'day'] as CalView[]).map((v) => (
            <Link
              key={v}
              className={`cal-views__opt${view === v ? ' is-on' : ''}`}
              href={calHref(v, date, filters)}
              aria-current={view === v ? 'page' : undefined}
            >
              {v === 'month' ? 'Month' : v === 'week' ? 'Week' : 'Day'}
            </Link>
          ))}
          {/* The same moves as a list, on the Leads page - one tap away, not a copy. */}
          <Link
            className="cal-views__opt"
            href="/admin/collections/leads?where%5Bstatus%5D%5Bequals%5D=scheduled"
          >
            List
          </Link>
        </nav>
      </header>

      <div className="cal-bar">
        <div className="cal-states" role="group" aria-label={`Show, with counts for ${periodWord}`}>
          {CAL_GROUPS.map((g) => {
            const gs = groupState(g.states);
            return (
              <span
                key={g.key}
                className={`cal-group cal-group--${g.key}`}
                data-state={gs}
                role="group"
                aria-label={g.title}
              >
                <button
                  type="button"
                  className="cal-group__head"
                  aria-pressed={gs === 'all' ? true : gs === 'some' ? 'mixed' : false}
                  title={`${g.hint}. Tap to ${gs === 'all' ? 'hide' : 'show'} all of them.`}
                  onClick={() => toggleGroup(g.states)}
                >
                  <span className="cal-group__box" aria-hidden="true">
                    {gs === 'all' ? (
                      <svg viewBox="0 0 16 16" width="10" height="10">
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : gs === 'some' ? (
                      <svg viewBox="0 0 16 16" width="10" height="10">
                        <path
                          d="M4 8h8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  {g.title}
                </button>
                <span className="cal-group__chips">
                  {g.states.map((v) => stateButton(stateMeta(v) as (typeof CAL_STATES)[number]))}
                </span>
              </span>
            );
          })}
        </div>
        <div className="cal-pick">
          {canSeeTeam && (
            <select
              aria-label="Owner"
              className={filters.owner ? 'is-on' : undefined}
              value={filters.owner}
              onChange={(e) => setFilters((f) => ({ ...f, owner: e.target.value }))}
            >
              <option value="">All owners</option>
              <option value={UNASSIGNED}>Unassigned</option>
              {options.owners.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Service"
            className={filters.service ? 'is-on' : undefined}
            value={filters.service}
            onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))}
          >
            <option value="">All services</option>
            {options.services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="City"
            className={filters.city ? 'is-on' : undefined}
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          >
            <option value="">All cities</option>
            {options.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {canSeeTeam && (
            <label className={`cal-mine${filters.mine ? ' is-on' : ''}`}>
              <input
                type="checkbox"
                checked={filters.mine}
                onChange={(e) => setFilters((f) => ({ ...f, mine: e.target.checked }))}
              />
              Only mine
            </label>
          )}
          {narrowed && (
            <button
              type="button"
              className="cal-clear"
              onClick={() =>
                setFilters({
                  states: DEFAULT_STATES,
                  owner: '',
                  service: '',
                  city: '',
                  mine: false,
                })
              }
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {props.undatedWon > 0 && (
        <p className="cal-note" role="status">
          <MIcon name="event" size={20} className="cal-note__ico" />
          <span>
            {props.undatedWon} Won {props.undatedWon === 1 ? 'lead has' : 'leads have'} no move
            date, so {props.undatedWon === 1 ? 'it is' : 'they are'} not on the calendar.
          </span>
          <Link
            className="cal-note__link"
            href="/admin/collections/leads?where%5Band%5D%5B0%5D%5Bstatus%5D%5Bequals%5D=won&where%5Band%5D%5B1%5D%5BdueAt%5D%5Bexists%5D=false"
          >
            Add {props.undatedWon === 1 ? 'its date' : 'their dates'}
          </Link>
        </p>
      )}

      <div className={`cal-body cal-body--${view}${drag ? ' is-dragging' : ''}`}>
        {view === 'month' ? monthView : view === 'week' ? weekView : dayView}
      </div>

      <footer className="cal-foot">
        <span className="cal-key">
          <span className="cal-key__title">
            Each day has {capacity} {capacity === 1 ? 'slot' : 'slots'}
          </span>
          {(['quiet', 'busy', 'tight', 'full'] as Heat[]).map((h) => (
            <span key={h} className="cal-key__item" data-heat={h}>
              <i aria-hidden="true" />
              {HEAT_LABEL[h]}
            </span>
          ))}
          {canSeeTeam && (
            <Link className="cal-key__edit" href="/admin/globals/schedule-settings">
              Change
            </Link>
          )}
        </span>
        {canReschedule && view !== 'day' && (
          <span className="cal-foot__tip">Drag a move to another day to reschedule it.</span>
        )}
      </footer>

      {toast && (
        <div className="cal-toast" data-tone={toast.tone} role="status" key={toast.key}>
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                const undo = toast.undo;
                setToast(null);
                undo?.();
              }}
            >
              Undo
            </button>
          )}
          <button
            type="button"
            className="cal-toast__x"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

const CSS = `
/* PIXELS, as on the dashboard: the admin root font is 13px, so rem here would shrink
   every size by a fifth. Colours come from the admin theme, so dark mode follows. */
.mpm-cal{
  --ink:var(--mpm-ink,#0F1523); --ink-2:var(--mpm-ink-2,#3A4254); --ink-3:var(--mpm-ink-3,#737E93);
  --paper:var(--mpm-paper,#fff); --line:var(--mpm-line,#E3E7EF); --tint:var(--mpm-tint,#F4F6FA);
  --v:var(--mpm-v-500,#2558E6); --v-4:var(--mpm-v-400,#4A7BF7);
  --h-quiet:#12A150; --h-busy:#D48A00; --h-tight:#E0661B; --h-full:#D23A2F;
  --shadow:var(--mpm-shadow,rgba(15,21,35,.13));
  padding:8px 0 40px; color:var(--ink); font-size:14px;
}

/* Header */
.cal-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 16px}
.cal-head__title{display:flex;flex-direction:column;gap:2px;min-width:0}
.cal-head__title h1{margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.cal-head__period{font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1.15;color:var(--ink)}
.cal-head__controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.cal-nav{display:flex;align-items:center;gap:6px}
.cal-nav__btn,.cal-nav__today{display:inline-flex;align-items:center;justify-content:center;
  min-height:38px;border:1px solid var(--line);background:var(--paper);color:var(--ink-2);
  border-radius:999px;text-decoration:none;font-size:13px;font-weight:600;transition:border-color .12s,color .12s}
.cal-nav__btn{width:38px}
.cal-nav__today{padding:0 16px}
.cal-nav__today.is-on{color:var(--ink-3)}
.cal-nav__btn:hover,.cal-nav__today:hover{border-color:var(--v);color:var(--v)}
.cal-views{display:inline-flex;padding:3px;border:1px solid var(--line);border-radius:999px;background:var(--tint)}
.cal-views__opt{display:inline-flex;align-items:center;min-height:32px;padding:0 14px;border-radius:999px;
  font-size:13px;font-weight:600;color:var(--ink-2);text-decoration:none}
.cal-views__opt:hover{color:var(--ink)}
.cal-views__opt.is-on{background:var(--paper);color:var(--ink);box-shadow:0 1px 2px var(--shadow),0 4px 10px -6px var(--shadow)}
.cal-views__opt:last-child{border-left:1px solid var(--line);border-radius:0 999px 999px 0;margin-left:3px;padding-left:13px}

/* Filters */
.cal-bar{display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;margin:0 0 14px}
.cal-states{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
/* A group: a tray holding its chips, headed by a real button. */
.cal-group{display:inline-flex;align-items:center;gap:6px;padding:4px;border:1px solid var(--line);border-radius:999px;
  background:var(--tint)}
.cal-group__chips{display:inline-flex;align-items:center;gap:4px}
.cal-group .cal-state{min-height:30px;padding:0 11px}
/* The heading looks like what it is - something to press - with a box that says whether
   the group is all on, partly on or off. */
.cal-group__head{display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:0 12px 0 9px;
  border:1.5px solid color-mix(in srgb,var(--ink-3) 45%,var(--line));border-radius:999px;background:var(--paper);
  color:var(--ink-2);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;
  font-family:inherit;cursor:pointer;transition:border-color .12s,color .12s,background .12s}
.cal-group__head:hover{border-color:var(--v);color:var(--v)}
.cal-group__head:focus-visible{outline:2px solid var(--v-4);outline-offset:2px}
.cal-group__box{display:inline-grid;place-items:center;width:15px;height:15px;border-radius:5px;
  border:1.5px solid color-mix(in srgb,var(--ink-3) 70%,transparent);color:#fff;flex:none}
.cal-group[data-state="all"] .cal-group__box,.cal-group[data-state="some"] .cal-group__box{background:var(--v);border-color:var(--v)}
.cal-group[data-state="all"] .cal-group__head,.cal-group[data-state="some"] .cal-group__head{
  border-color:color-mix(in srgb,var(--v) 55%,var(--line));color:var(--ink)}
.cal-state{--c:var(--v);display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 12px;
  border:1px solid var(--line);border-radius:999px;background:var(--paper);color:var(--ink-3);
  font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:border-color .12s,background .12s,color .12s}
.cal-state i{width:8px;height:8px;border-radius:50%;background:var(--c);opacity:.35}
.cal-state i[data-state="lost"]{border-radius:2px}
.cal-state b{font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink-3)}
.cal-state.is-on{color:var(--ink);border-color:color-mix(in srgb,var(--c) 45%,var(--line));
  background:color-mix(in srgb,var(--c) 9%,var(--paper))}
.cal-state.is-on i{opacity:1}
.cal-state.is-on b{color:var(--c)}
.cal-state:focus-visible,.cal-pick select:focus-visible{outline:2px solid var(--v-4);outline-offset:2px}
.cal-pick{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cal-pick select{min-height:34px;max-width:180px;padding:0 30px 0 12px;border:1px solid var(--line);border-radius:999px;
  background:var(--paper) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' fill='none' stroke='%23737E93' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center/12px;
  -webkit-appearance:none;appearance:none;color:var(--ink-2);font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer}
.cal-pick select.is-on{border-color:color-mix(in srgb,var(--v) 45%,var(--line));color:var(--ink);
  background-color:color-mix(in srgb,var(--v) 8%,var(--paper))}
.cal-mine{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:0 12px;border:1px solid var(--line);
  border-radius:999px;background:var(--paper);font-size:12.5px;font-weight:600;color:var(--ink-2);cursor:pointer}
.cal-mine input{margin:0;width:14px;height:14px;accent-color:var(--v)}
.cal-mine.is-on{border-color:color-mix(in srgb,var(--v) 45%,var(--line));color:var(--ink)}
.cal-clear{border:0;background:none;padding:4px 2px;color:var(--v);font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer}
.cal-clear:hover{text-decoration:underline}

/* Status pill and owner, shared by the week and day cards */
.cal-pill{display:inline-flex;align-items:center;gap:5px;flex:none;padding:2px 8px;border-radius:999px;
  background:color-mix(in srgb,var(--c) 12%,transparent);color:var(--c);
  font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
[data-theme="dark"] .cal-pill{color:color-mix(in srgb,var(--c) 70%,#fff)}
.cal-owner{display:inline-flex;align-items:center;gap:6px;min-width:0;font-size:12px;font-weight:600;color:var(--ink-2)}
.cal-owner i{display:inline-grid;place-items:center;flex:none;width:20px;height:20px;border-radius:50%;
  background:color-mix(in srgb,var(--v) 14%,transparent);color:var(--v);font-size:9.5px;font-style:normal;font-weight:700}
.cal-owner.is-none{color:var(--mpm-ember-ink,#C24200)}
.cal-owner.is-none i{background:color-mix(in srgb,var(--mpm-ember-ink,#C24200) 14%,transparent);color:inherit}

/* Capacity: a number and a bar, coloured by how full the day is */
.cal-load{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--ink-3);
  font-variant-numeric:tabular-nums}
.cal-load small{font-size:10px;font-weight:600;opacity:.75}
.cal-load__bar{position:relative;display:inline-block;width:34px;height:5px;border-radius:999px;background:var(--line);overflow:hidden}
.cal-load__bar.is-wide{width:100%;max-width:220px;height:7px}
.cal-load__bar i{position:absolute;inset:0 auto 0 0;border-radius:inherit;background:var(--h-quiet)}
[data-heat="quiet"] .cal-load__bar i,[data-heat="quiet"].cal-load__bar i{background:var(--h-quiet)}
[data-heat="busy"] .cal-load__bar i{background:var(--h-busy)}
[data-heat="tight"] .cal-load__bar i{background:var(--h-tight)}
[data-heat="full"] .cal-load__bar i{background:var(--h-full)}
.cal-load[data-heat="quiet"]{color:var(--h-quiet)}
.cal-load[data-heat="busy"]{color:var(--h-busy)}
.cal-load[data-heat="tight"]{color:var(--h-tight)}
.cal-load[data-heat="full"]{color:var(--h-full)}
.cal-load.is-compact{padding:3px 6px;border-radius:999px;background:color-mix(in srgb,currentColor 12%,transparent)}
/* Slots: one ring per move the day can take, filled for each one taken. */
.cal-slots{display:inline-flex;align-items:center;gap:2px}
.cal-slots i{width:6px;height:6px;border-radius:50%;box-sizing:border-box;border:1.4px solid currentColor;opacity:.45}
.cal-slots i.on{background:currentColor;opacity:1}
.cal-slots b{margin-left:2px;font-size:10px;font-weight:800;color:var(--h-full)}
.cal-load__words{font-size:11px;font-weight:700;font-variant-numeric:tabular-nums}
.cal-load[data-heat="free"]{color:color-mix(in srgb,var(--h-quiet) 80%,var(--ink-3))}
.cal-load[data-heat="past"]{color:var(--ink-3)}

.cal-body{border:1px solid var(--line);border-radius:16px;background:var(--paper);
  box-shadow:0 1px 2px color-mix(in srgb,var(--shadow) 45%,transparent),0 12px 26px -18px var(--shadow);overflow:hidden}
.cal-body--day{background:none;border:0;box-shadow:none;overflow:visible}

/* ── Month ── */
.cal-m__head,.cal-m__week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.cal-m__head{border-bottom:1px solid var(--line);background:var(--tint)}
.cal-m__head span{padding:9px 10px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.cal-m__head span.is-we{color:color-mix(in srgb,var(--ink-3) 70%,var(--v))}
.cal-m__week+.cal-m__week .cal-m__cell{border-top:1px solid var(--line)}
.cal-m__cell{--heat:transparent;position:relative;display:flex;flex-direction:column;gap:5px;min-width:0;min-height:124px;
  padding:8px 8px 9px;background:var(--heat);transition:background .15s,box-shadow .15s}
.cal-m__cell+.cal-m__cell{border-left:1px solid var(--line)}
/* The heatmap: a wash of the day's colour, strong enough to read across a month at a
   glance, faint enough that the text on it stays the thing you read. */
.cal-m__cell[data-heat="quiet"]{--heat:color-mix(in srgb,var(--h-quiet) 7%,transparent)}
.cal-m__cell[data-heat="busy"]{--heat:color-mix(in srgb,var(--h-busy) 11%,transparent)}
.cal-m__cell[data-heat="tight"]{--heat:color-mix(in srgb,var(--h-tight) 13%,transparent)}
.cal-m__cell[data-heat="full"]{--heat:color-mix(in srgb,var(--h-full) 14%,transparent)}
.cal-m__cell[data-heat="past"]{--heat:color-mix(in srgb,var(--tint) 70%,transparent)}
/* Next month's first days keep their colour. On the 28th they are the days a customer is
   being offered, and a full 1st shown as blank because it belongs to October would be the
   calendar hiding the one thing it is for. Only the date itself steps back. */
.cal-m__cell[data-out] .cal-m__num{color:var(--ink-3);opacity:.65}
.cal-m__cell[data-out] .cal-m__items{opacity:.85}
.cal-m__week[data-past] .cal-m__cell{min-height:78px}
.cal-m__top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:6px;pointer-events:none}
.cal-m__num{display:inline-grid;place-items:center;min-width:26px;height:26px;padding:0 4px;border-radius:999px;
  font-size:13px;font-weight:700;color:var(--ink);text-decoration:none;pointer-events:auto}
.cal-m__num:hover{background:var(--tint)}
.cal-m__cell[data-heat="past"] .cal-m__num{color:var(--ink-3)}
.cal-m__cell[data-today] .cal-m__num{background:var(--v);color:#fff}
.cal-m__cell[data-today]{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--v) 55%,transparent)}
.cal-m__hit{position:absolute;inset:0;z-index:0}
.cal-m__items{position:relative;z-index:1;display:flex;flex-direction:column;gap:3px;margin:0;padding:0;list-style:none;min-width:0}
.cal-chip{--c:var(--v);display:flex;align-items:center;gap:5px;min-width:0;padding:3px 7px 3px 6px;border-radius:7px;
  border-left:3px solid var(--c);background:color-mix(in srgb,var(--c) 12%,var(--paper));
  color:var(--ink);text-decoration:none;font-size:11.5px;line-height:1.35}
.cal-chip:hover{background:color-mix(in srgb,var(--c) 20%,var(--paper))}
.cal-chip__time{flex:none;font-weight:700;color:color-mix(in srgb,var(--c) 75%,var(--ink));font-variant-numeric:tabular-nums}
.cal-chip__name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.cal-chip[data-state="lost"] .cal-chip__name,.cal-card[data-state="lost"] .cal-card__name,
.cal-dcard[data-state="lost"] .cal-dcard__name{text-decoration:line-through;text-decoration-thickness:1.5px;opacity:.75}
.cal-chip[draggable="true"]{cursor:grab}
.cal-chip.is-dragging,.cal-card.is-dragging{opacity:.4}
.cal-m__more{position:relative;z-index:1;align-self:flex-start;padding:1px 6px;border-radius:6px;font-size:11.5px;font-weight:700;
  color:var(--v);text-decoration:none}
.cal-m__more:hover{background:color-mix(in srgb,var(--v) 10%,transparent)}
.cal-m__dots{display:none}

/* A drop target lights up; a day in the past says no. */
.cal-m__cell[data-over],.cal-w__col[data-over]{box-shadow:inset 0 0 0 2px var(--v);background:color-mix(in srgb,var(--v) 10%,var(--heat,transparent))}
.cal-body.is-dragging [data-blocked]{opacity:.45;cursor:not-allowed}

/* ── Week ── */
.cal-w{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.cal-w__col{position:relative;display:flex;flex-direction:column;min-width:0;min-height:420px;transition:background .15s,box-shadow .15s}
/* The column's own tap target sits under everything; the list lets taps fall through
   to it except on the cards themselves. */
.cal-w__hit{position:absolute;inset:0;z-index:0}
.cal-w__head,.cal-w__list{position:relative;z-index:1}
.cal-w__list{pointer-events:none}
.cal-w__list .cal-card{pointer-events:auto}
.cal-w__head{text-decoration:none;color:var(--ink);cursor:pointer;transition:background .12s}
.cal-w__head:hover{background:color-mix(in srgb,var(--v) 7%,transparent)}
.cal-w__head:hover .cal-w__go{color:var(--v);transform:translateX(2px)}
.cal-w__head:focus-visible{outline:2px solid var(--v-4);outline-offset:-2px}
.cal-w__end{display:inline-flex;align-items:center;gap:6px;min-width:0}
.cal-w__go{flex:none;color:var(--ink-3);transition:color .12s,transform .12s}
.cal-w__col:hover .cal-w__none{color:var(--v)}
.cal-w__col+.cal-w__col{border-left:1px solid var(--line)}
.cal-w__col[data-past]{background:color-mix(in srgb,var(--tint) 60%,transparent)}
.cal-w__head{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:10px 10px 9px;
  border-bottom:1px solid var(--line)}
.cal-w__day{display:flex;align-items:baseline;gap:6px;text-decoration:none;color:var(--ink)}
.cal-w__wd{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.cal-w__dn{font-size:18px;font-weight:700;letter-spacing:-.02em}
.cal-w__col[data-today] .cal-w__dn{display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:999px;
  background:var(--v);color:#fff;font-size:15px}
.cal-w__col[data-today] .cal-w__head{background:color-mix(in srgb,var(--v) 6%,transparent)}
.cal-w__head .cal-load__bar{width:26px}
.cal-w__list{display:flex;flex-direction:column;gap:7px;padding:8px}
.cal-w__none{margin:6px 2px;font-size:12px;color:var(--ink-3)}

.cal-card{--c:var(--v);position:relative;display:flex;flex-direction:column;gap:4px;min-width:0;padding:9px 10px 10px 12px;
  border:1px solid color-mix(in srgb,var(--c) 22%,var(--line));border-radius:11px;background:var(--paper);
  box-shadow:0 1px 2px color-mix(in srgb,var(--shadow) 40%,transparent)}
.cal-card::before{content:"";position:absolute;inset:8px auto 8px 0;width:3px;border-radius:0 3px 3px 0;background:var(--c)}
.cal-card.is-movable{cursor:grab}
.cal-card__row{display:flex;align-items:center;justify-content:space-between;gap:6px}
.cal-card__time{flex:none;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink-2);white-space:nowrap}
/* The time never wraps; in a narrow column the pill gives way instead. */
.cal-card .cal-pill{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:9.5px;padding:1px 6px}
.cal-card__name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:700;
  color:var(--ink);text-decoration:none}
.cal-card__name:hover{color:var(--v)}
.cal-card__route,.cal-card__meta{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--ink-2)}
.cal-card__meta{color:var(--ink-3)}
.cal-card .cal-owner{margin-top:3px;font-size:11.5px}
.cal-card .cal-owner i{width:18px;height:18px;font-size:9px}

/* ── Day ── */
.cal-d{display:flex;flex-direction:column;gap:12px}
.cal-d__cap{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border:1px solid var(--line);
  border-radius:14px;background:var(--paper)}
.cal-d__cap>div{display:flex;flex-direction:column;gap:2px}
.cal-d__cap strong{font-size:15px;font-weight:700}
.cal-d__cap span{font-size:12.5px;color:var(--ink-3)}
.cal-d__cap[data-heat="full"]{border-color:color-mix(in srgb,var(--h-full) 40%,var(--line));background:color-mix(in srgb,var(--h-full) 7%,var(--paper))}
.cal-d__cap[data-heat="full"] span{color:var(--h-full);font-weight:600}
.cal-d__list{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}
.cal-dcard{--c:var(--v);position:relative;display:grid;grid-template-columns:92px minmax(0,1fr);gap:14px;padding:14px 16px 14px 18px;
  border:1px solid var(--line);border-radius:14px;background:var(--paper);
  box-shadow:0 1px 2px color-mix(in srgb,var(--shadow) 40%,transparent),0 10px 22px -18px var(--shadow)}
.cal-dcard::before{content:"";position:absolute;inset:12px auto 12px 0;width:4px;border-radius:0 4px 4px 0;background:var(--c)}
.cal-dcard__time{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink);padding-top:1px}
.cal-dcard__body{display:flex;flex-direction:column;gap:6px;min-width:0}
.cal-dcard__top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cal-dcard__name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px;font-weight:700;color:var(--ink);text-decoration:none}
.cal-dcard__name:hover{color:var(--v)}
.cal-dcard__route{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;font-size:13px;color:var(--ink-2)}
.cal-dcard__route i{font-style:normal;color:var(--ink-3)}
.cal-dcard__meta{font-size:12.5px;color:var(--ink-3)}
.cal-dcard__foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:4px}
.cal-dcard .mpm-duep{margin-top:6px}
.cal-empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:40px 20px;border:1px dashed var(--line);
  border-radius:14px;text-align:center}
.cal-empty strong{font-size:15px}
.cal-empty span{font-size:13px;color:var(--ink-3)}

/* ── Footer key ── */
/* Google's inline notice: a quiet tonal strip, an icon, one sentence and the fix. */
.cal-note{display:flex;align-items:center;gap:10px 12px;flex-wrap:wrap;margin:0 0 12px;
  padding:10px 16px;border-radius:12px;background:var(--mpm-sel,#D3E3FD);color:var(--mpm-on-sel,#041E49);
  font-size:14px;line-height:1.4}
.cal-note__ico{flex:none}
.cal-note__link{margin-left:auto;font-weight:500;color:inherit;text-decoration:underline;text-underline-offset:3px}
.cal-note__link:hover{text-decoration-thickness:2px}
.cal-foot{display:flex;align-items:center;justify-content:space-between;gap:10px 18px;flex-wrap:wrap;margin-top:12px}
.cal-key{display:flex;align-items:center;gap:6px 14px;flex-wrap:wrap;font-size:12px;color:var(--ink-3)}
.cal-key__title{font-weight:700;color:var(--ink-2)}
.cal-key__item{display:inline-flex;align-items:center;gap:6px}
.cal-key__item i{width:12px;height:12px;border-radius:4px}
.cal-key__item[data-heat="quiet"] i{background:color-mix(in srgb,var(--h-quiet) 30%,transparent)}
.cal-key__item[data-heat="busy"] i{background:color-mix(in srgb,var(--h-busy) 35%,transparent)}
.cal-key__item[data-heat="tight"] i{background:color-mix(in srgb,var(--h-tight) 38%,transparent)}
.cal-key__item[data-heat="full"] i{background:color-mix(in srgb,var(--h-full) 40%,transparent)}
.cal-key__edit{font-weight:600;color:var(--v);text-decoration:none}
.cal-key__edit:hover{text-decoration:underline}
.cal-foot__tip{font-size:12px;color:var(--ink-3)}
/* Drag is a mouse gesture; on a touchscreen the tip would promise something that is not
   there. Rescheduling from a phone is done on the lead itself. */
@media (hover:none),(pointer:coarse){.cal-foot__tip{display:none}}

/* ── Toast ── */
.cal-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:90;
  display:flex;align-items:center;gap:12px;max-width:calc(100vw - 32px);padding:10px 10px 10px 16px;border-radius:14px;
  background:#101624;color:#fff;font-size:13px;font-weight:500;box-shadow:0 18px 40px -16px rgba(0,0,0,.5);
  animation:cal-in .18s ease-out}
.cal-toast[data-tone="warn"]{background:#5A3A00}
.cal-toast[data-tone="error"]{background:#6E1D16}
.cal-toast button{border:0;border-radius:999px;padding:6px 12px;background:rgba(255,255,255,.14);color:#fff;
  font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer}
.cal-toast button:hover{background:rgba(255,255,255,.24)}
.cal-toast .cal-toast__x{padding:4px 9px;background:none;font-size:16px;line-height:1;opacity:.7}
@keyframes cal-in{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
@media (prefers-reduced-motion:reduce){.cal-toast{animation:none}}

/* ══ Google look ═════════════════════════════════════════════════════════════
   Google Calendar, as closely as this calendar's job allows: a white grid with hairlines
   on the pale page, weekday names centred over their columns, the date at the top of
   each day, today in a filled blue circle, and each move a solid chip in its colour with
   white text. Capacity stays, but quietly - dots in blue, and a tint only when a day is
   nearly full or full, the one moment it should catch the eye. */
.mpm-cal{ --h-quiet:var(--mpm-v-500); --h-busy:var(--mpm-v-500); --h-tight:#E37400; --h-full:#D93025; }
.cal-sr{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
.cal-head{ align-items:center; justify-content:flex-start; gap:8px 12px; margin:0 0 14px; }
.cal-head__period{ margin-right:auto; font-family:var(--mpm-font-display); font-size:22px; font-weight:400; letter-spacing:0; color:var(--ink); }
.cal-nav{ gap:2px; }
.cal-nav__today{ min-height:36px; padding:0 16px; margin-right:6px; border:1px solid var(--mpm-rule); border-radius:999px;
  background:transparent; color:var(--ink); font-family:var(--mpm-font-display); font-size:14px; font-weight:500; }
.cal-nav__today:hover,.cal-nav__today.is-on:hover{ background:var(--mpm-hover); border-color:var(--mpm-rule); color:var(--ink); }
.cal-nav__today.is-on{ color:var(--ink); }
.cal-nav__btn{ width:40px; min-height:40px; border:0; border-radius:50%; background:transparent; color:var(--ink-2); }
.cal-nav__btn:hover{ background:var(--mpm-hover); color:var(--ink); border:0; }
/* Google's segmented button: one outlined pill, the chosen part pale blue with a tick. */
.cal-views{ padding:0; gap:0; border:1px solid var(--mpm-rule); border-radius:999px; background:transparent; overflow:hidden; }
.cal-views__opt,.cal-views__opt:last-child{ min-height:36px; margin:0; padding:0 16px; border-radius:0; font-size:14px; font-weight:500; color:var(--ink); }
.cal-views__opt + .cal-views__opt{ border-left:1px solid var(--mpm-rule); }
.cal-views__opt:hover{ background:var(--mpm-hover); color:var(--ink); }
.cal-views__opt.is-on{ gap:6px; background:var(--mpm-sel-2); color:var(--mpm-on-sel-2); box-shadow:none; }
.cal-views__opt.is-on::before,.cal-state.is-on::before{
  content:""; width:18px; height:18px; flex:none; background:currentColor;
  -webkit-mask:${materialUrl('check')} center/contain no-repeat; mask:${materialUrl('check')} center/contain no-repeat; }

/* Filter chips. */
.cal-group{ padding:0; border:0; background:transparent; gap:6px; }
.cal-group__head{ min-height:32px; padding:0 12px 0 10px; border:1px solid var(--mpm-rule); border-radius:8px; background:transparent;
  color:var(--ink); font-size:14px; font-weight:500; letter-spacing:.01em; text-transform:none; }
.cal-group__head:hover{ background:var(--mpm-hover); border-color:var(--mpm-rule); color:var(--ink); }
.cal-group__box{ width:16px; height:16px; border-radius:3px; border-color:var(--ink-2); }
.cal-group[data-state="all"] .cal-group__head,.cal-group[data-state="some"] .cal-group__head{ border-color:var(--mpm-rule); color:var(--ink); }
.cal-state,.cal-group .cal-state{ min-height:32px; padding:0 12px; border:1px solid var(--mpm-rule); border-radius:8px; background:transparent;
  color:var(--ink-2); font-size:14px; font-weight:500; }
.cal-state i{ opacity:1; }
.cal-state b{ font-weight:500; color:var(--ink-2); }
.cal-state:hover{ background:var(--mpm-hover); }
.cal-state.is-on{ background:var(--mpm-sel-2); border-color:transparent; color:var(--mpm-on-sel-2); }
.cal-state.is-on i{ display:none; }
.cal-state.is-on b{ color:inherit; }
.cal-pick select,.cal-mine{ min-height:32px; border-radius:8px; border-color:var(--mpm-rule); background-color:transparent; font-size:14px; font-weight:500; }
.cal-pick select.is-on,.cal-mine.is-on{ background-color:var(--mpm-sel-2); border-color:transparent; color:var(--mpm-on-sel-2); }
.cal-clear{ font-weight:500; }

/* The grid. */
.cal-body{ border:1px solid var(--line); border-radius:16px; box-shadow:none; background:var(--paper); }
.cal-body--day{ border:0; background:none; }
.cal-m__head{ background:var(--paper); border-bottom:1px solid var(--line); }
.cal-m__head span,.cal-m__head span.is-we{ padding:10px 0 6px; text-align:center; font-size:11px; font-weight:500; letter-spacing:.08em; color:var(--ink-2); }
.cal-m__cell{ padding:4px 4px 6px; gap:2px; }
.cal-m__top{ justify-content:center; }
.cal-m__top .cal-load{ position:absolute; right:2px; top:3px; }
.cal-m__num{ min-width:24px; height:24px; font-size:12px; font-weight:500; color:var(--ink); }
.cal-m__num:hover{ background:var(--mpm-hover); }
.cal-m__cell[data-today]{ box-shadow:none; }
.cal-m__cell[data-today] .cal-m__num{ background:#0B57D0; color:#fff; }
html[data-theme="dark"] .cal-m__cell[data-today] .cal-m__num{ background:#A8C7FA; color:#062E6F; }
.cal-m__cell[data-heat="quiet"],.cal-m__cell[data-heat="busy"],.cal-m__cell[data-heat="free"],
.cal-m__cell[data-heat="past"],.cal-m__cell[data-out]{ --heat:transparent; }
.cal-m__cell[data-heat="tight"]{ --heat:color-mix(in srgb,#E37400 7%,transparent); }
.cal-m__cell[data-heat="full"]{ --heat:color-mix(in srgb,#D93025 8%,transparent); }
.cal-m__cell[data-heat="past"] .cal-m__num,.cal-m__cell[data-out] .cal-m__num{ color:var(--ink-3); opacity:1; }
/* Moves, as Google Calendar draws its events: solid colour, white text, 4px corners. */
.cal-chip{ border-left:0; border-radius:4px; background:var(--c); color:#fff; padding:1px 6px; font-size:12px; line-height:18px; }
.cal-chip:hover{ background:var(--c); filter:brightness(.92); }
.cal-chip__time{ color:#fff; font-weight:500; opacity:.9; }
.cal-chip__name{ font-weight:500; }
.cal-m__more{ padding:0 6px; border-radius:4px; color:var(--ink); font-weight:500; }
.cal-m__more:hover{ background:var(--mpm-hover); }
.cal-load.is-compact{ background:transparent; padding:3px 2px; }
.cal-load[data-heat="quiet"],.cal-load[data-heat="busy"],.cal-load[data-heat="free"]{ color:var(--mpm-v-500); }

/* The week. */
.cal-w__head{ padding:10px 10px 8px; }
.cal-w__wd{ font-size:11px; font-weight:500; letter-spacing:.08em; color:var(--ink-2); }
.cal-w__dn{ font-family:var(--mpm-font-display); font-size:22px; font-weight:400; }
.cal-w__col[data-today] .cal-w__dn{ min-width:36px; height:36px; font-size:18px; background:#0B57D0; color:#fff; }
html[data-theme="dark"] .cal-w__col[data-today] .cal-w__dn{ background:#A8C7FA; color:#062E6F; }
.cal-w__col[data-today] .cal-w__head,.cal-w__col[data-past]{ background:transparent; }
.cal-card{ border:0; border-radius:8px; background:color-mix(in srgb,var(--c) 13%,var(--paper)); box-shadow:none; padding:8px 10px 9px 14px; }
.cal-card::before{ inset:6px auto 6px 5px; width:4px; border-radius:2px; }
.cal-card__name,.cal-dcard__name{ font-weight:500; }
.cal-card__time{ font-weight:500; }
.cal-pill,.cal-card .cal-pill{ border-radius:4px; font-size:11px; font-weight:500; letter-spacing:.01em; text-transform:none; }

/* The day. */
.cal-d__cap,.cal-dcard{ border-radius:12px; box-shadow:none; }
.cal-dcard__time{ font-family:var(--mpm-font-display); font-weight:400; }
.cal-owner i{ background:var(--mpm-sel); color:var(--mpm-on-sel); font-weight:500; }

/* Google's snackbar. */
.cal-toast,.cal-toast[data-tone="warn"],.cal-toast[data-tone="error"]{ background:#313033; border-radius:8px; box-shadow:0 4px 8px 3px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.3); }
.cal-toast button{ background:none; color:#A8C7FA; font-weight:500; }
.cal-toast button:hover{ background:rgba(168,199,250,.12); }

/* ── Tablet: seven columns of cards stop fitting, so the week becomes a list of days ── */
@media (max-width:1000px){
  .cal-w{grid-template-columns:1fr}
  .cal-w__col{min-height:0}
  .cal-w__col+.cal-w__col{border-left:0;border-top:1px solid var(--line)}
  .cal-w__col[data-empty] .cal-w__list{padding-top:0}
  .cal-w__list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
  .cal-w__none{margin:0 2px 6px}
  .cal-m__cell{min-height:104px;padding:6px}
  .cal-chip{font-size:11px;padding:2px 5px 2px 5px}
}

/* ── Phone: the month is a heatmap you tap into; the day is where you work ── */
@media (max-width:640px){
  .mpm-cal{padding-top:4px}
  .cal-head{align-items:stretch;gap:12px}
  .cal-head__period{font-size:20px}
  .cal-head__controls{width:100%;justify-content:space-between}
  .cal-nav{flex:1}
  .cal-nav__today{flex:1}
  .cal-views{flex:1 1 100%;order:-1}
  .cal-views__opt{flex:1;justify-content:center;padding:0 8px}
  /* nowrap matters: a WRAPPING column flexbox sizes each line to its widest child, and
     the one-line strip of states is very wide - so the selects under it stretched to
     that width and ran off the screen, clipped rather than scrollable. A single-line
     column takes the screen's width instead. */
  .cal-bar{flex-direction:column;align-items:stretch;flex-wrap:nowrap}
  /* Every state on screen, none behind a swipe - Overdue is the one that needs a person,
     and a scrolling row put it exactly where nobody looks. The Scheduled group takes the
     full width with its three parts in equal columns; the other four sit two by two. */
  .cal-states{display:flex;flex-direction:column;align-items:stretch;gap:8px}
  .cal-group{display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:6px;border-radius:16px}
  .cal-group__head{align-self:flex-start;min-height:30px}
  .cal-group__chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
  .cal-group--scheduled .cal-group__chips{grid-template-columns:repeat(3,minmax(0,1fr))}
  .cal-state{justify-content:center;min-width:0;padding:0 6px;gap:5px;font-size:12px}
  .cal-group .cal-state{padding:0 6px;min-height:34px}
  /* Two chips leave room for their heading on the same line - less scrolling before the
     calendar starts. Scheduled shifting keeps its heading above its three. */
  .cal-group--outcome,.cal-group--calls{flex-direction:row;align-items:center}
  .cal-group--outcome .cal-group__head,.cal-group--calls .cal-group__head{flex:none;align-self:center}
  .cal-group--outcome .cal-group__chips,.cal-group--calls .cal-group__chips{flex:1;min-width:0}
  /* minmax(0,1fr), not 1fr: a select is as wide as its longest option, and one long
     service name pushed the second column off the screen. */
  .cal-pick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .cal-pick select{max-width:none;width:100%;min-width:0}
  .cal-mine{justify-content:center}
  .cal-clear{grid-column:1/-1;justify-self:start}

  .cal-body--month{border-radius:14px}
  .cal-m__head span{padding:7px 0;text-align:center;font-size:10px;letter-spacing:.04em}
  .cal-m__cell{min-height:62px;padding:5px 2px 6px;align-items:center;gap:4px}
  .cal-m__week[data-past] .cal-m__cell{min-height:44px}
  .cal-m__top{justify-content:center}
  .cal-m__num{min-width:24px;height:24px;font-size:12.5px}
  .cal-m__items,.cal-m__more,.cal-m__top .cal-load{display:none}
  .cal-m__dots{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:3px;flex-wrap:wrap;
    max-width:100%;pointer-events:none}
  .cal-m__dots i{width:6px;height:6px;border-radius:50%;background:var(--c)}
  .cal-m__dots b{font-size:9px;font-weight:700;color:var(--ink-3)}

  .cal-w__list{grid-template-columns:1fr}
  .cal-dcard{grid-template-columns:1fr;gap:6px;padding:12px 14px 14px 16px}
  .cal-dcard__time{font-size:13px;color:var(--ink-3)}
  .cal-dcard__name{font-size:15px;white-space:normal}
  .cal-d__cap{flex-direction:column;align-items:stretch;gap:10px}
  .cal-load__bar.is-wide{max-width:none}
  .cal-foot{flex-direction:column;align-items:flex-start}
}
`;
