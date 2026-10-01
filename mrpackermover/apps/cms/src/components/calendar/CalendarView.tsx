import type { AdminViewServerProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import { LEAD_STATUS, personCase } from '../dashboard/lead-status.js';
import { CalendarApp, type CalFilters } from './CalendarApp.js';
import {
  CAL_STATES,
  DEFAULT_STATES,
  type CalItem,
  type CalState,
  type CalView,
  type DayKey,
  isDayKey,
  monthGrid,
  stateOf,
  takesCapacity,
} from './calendar-model.js';

/**
 * The move calendar: every scheduled lead on the day it happens.
 *
 * Built on the lead's own `dueAt` - the date the Scheduled stage already requires - so
 * there is no second record of a booking to keep in step with the first. A move is put on
 * the calendar by scheduling the lead, moved by dragging it here, and taken off by marking
 * it done or cancelled, which keeps it on its day in its new colour.
 *
 * WHO SEES WHAT. The moves are fetched as the person looking, so a salesperson sees their
 * own and a handler sees everyone's - the same rule as the Leads list, applied by the same
 * access function. The day totals behind the colours are the exception, fetched without
 * access and holding nothing but a date and a stage: a salesperson offering a customer
 * Saturday needs to know Saturday is full, and cannot know it from their own four leads.
 */

/** The admin's day is India's day. Stated here as well as pinned in next.config, because
 *  a day boundary drawn in the wrong zone moves a 2 AM job onto the previous date. */
const ZONE = 'Asia/Kolkata';
const IST = '+05:30';

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function toDayAndTime(iso: string): { day: DayKey; hhmm: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hhmm: `${p.hour}:${p.minute}` };
}

/** "14:30" -> "2:30 pm". Written out rather than formatted, so it cannot differ by locale. */
const clock = (hhmm: string): string => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

/** "Ballia, Uttar Pradesh, India" -> "Ballia". The city is what a coordinator scans for. */
const cityOf = (place?: string | null): string => (place ?? '').split(',')[0]?.trim() ?? '';

const one = (v: unknown): string =>
  Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : '';

/** The stages that can carry a date onto the calendar. */
const ON_CALENDAR = ['scheduled', 'won', 'lost', 'call-later', 'follow-up'];

interface LeadRow {
  id: string | number;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
  dueAt?: string | null;
  pickup?: string | null;
  dropLocation?: string | null;
  moveSize?: string | null;
  service?: string | null;
  assignedTo?:
    { id?: string | number; name?: string | null; email?: string | null } | string | number | null;
}

export async function CalendarView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps): Promise<React.JSX.Element> {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const { payload } = req;
  const user = req.user as {
    id: string | number;
    role?: string;
    name?: string;
    email?: string;
  } | null;
  const role = user?.role ?? '';
  const allowed = role === 'admin' || role === 'handler' || role === 'sales';

  const template = (children: React.ReactNode): React.JSX.Element => (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
      viewType="calendar"
    >
      <Gutter>{children}</Gutter>
    </DefaultTemplate>
  );

  if (!user || !allowed) {
    return template(
      <p style={{ padding: '40px 0', fontSize: 14 }}>
        The move calendar is for the sales desk. Ask an admin if you need access.
      </p>,
    );
  }

  const sp = (searchParams ?? {}) as Record<string, unknown>;
  const today = toDayAndTime(new Date().toISOString())!.day;
  const date = isDayKey(one(sp.date)) ? one(sp.date) : today;
  const viewParam = one(sp.view);
  const view: CalView = viewParam === 'week' || viewParam === 'day' ? viewParam : 'month';

  // One fetch window for every view: the whole month grid the date sits in. The week and
  // the day are always inside it, so switching views never needs a second shape of query.
  const grid = monthGrid(date);
  const first = grid[0]![0]!;
  const last = grid[grid.length - 1]![6]!;
  const range = {
    and: [
      { dueAt: { greater_than_equal: new Date(`${first}T00:00:00${IST}`).toISOString() } },
      { dueAt: { less_than_equal: new Date(`${last}T23:59:59.999${IST}`).toISOString() } },
    ],
  };

  const [visible, totals, settings, undatedWon] = await Promise.all([
    payload
      .find({
        collection: 'leads',
        where: { and: [...range.and, { status: { in: ON_CALENDAR } }] } as never,
        sort: 'dueAt',
        limit: 2000,
        pagination: false,
        depth: 1,
        overrideAccess: false,
        user: user as never,
        select: {
          name: true,
          phone: true,
          status: true,
          dueAt: true,
          pickup: true,
          dropLocation: true,
          moveSize: true,
          service: true,
          assignedTo: true,
        } as never,
      })
      .then((r) => r.docs as unknown as LeadRow[])
      .catch(() => [] as LeadRow[]),
    // Day totals for the colours - a date and a stage per move, nothing that identifies
    // a customer. See the note at the top of the file for why this skips access.
    payload
      .find({
        collection: 'leads',
        where: { and: [...range.and, { status: { in: ['scheduled', 'won'] } }] } as never,
        limit: 5000,
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { dueAt: true, status: true } as never,
      })
      .then((r) => r.docs as unknown as LeadRow[])
      .catch(() => [] as LeadRow[]),
    // Before the production migration adds this global's table, reading it throws; the
    // calendar still works on the default rather than failing to open.
    payload
      .findGlobal({ slug: 'schedule-settings' as never, overrideAccess: true, depth: 0 })
      .catch(() => null),
    // Won leads with no move date. The calendar places a lead by its date, so these can
    // never appear on it - which is why the dashboard can count two Won and the calendar
    // none. Counted with the viewer's own access, so a salesperson hears only about theirs.
    payload
      .count({
        collection: 'leads',
        where: { and: [{ status: { equals: 'won' } }, { dueAt: { exists: false } }] } as never,
        overrideAccess: false,
        user: user as never,
      })
      .then((r) => r.totalDocs)
      .catch(() => 0),
  ]);

  const capacity = Math.max(
    1,
    Number((settings as { movesPerDay?: number } | null)?.movesPerDay) || 4,
  );

  const dayLoad: Record<DayKey, number> = {};
  for (const row of totals) {
    const when = row.dueAt ? toDayAndTime(row.dueAt) : null;
    if (!when) continue;
    if (!takesCapacity(stateOf(String(row.status), when.day, today))) continue;
    dayLoad[when.day] = (dayLoad[when.day] ?? 0) + 1;
  }

  const statusLabel = (v: string): string => LEAD_STATUS.find((s) => s.value === v)?.label ?? v;

  const items: CalItem[] = [];
  for (const row of visible) {
    const when = row.dueAt ? toDayAndTime(row.dueAt) : null;
    if (!when) continue;
    const status = String(row.status ?? '');
    const owner = row.assignedTo;
    const ownerId =
      owner && typeof owner === 'object'
        ? String(owner.id ?? '')
        : owner != null
          ? String(owner)
          : null;
    const ownerName =
      owner && typeof owner === 'object'
        ? personCase(owner.name || owner.email || '')
        : owner != null
          ? String(owner) === String(user.id)
            ? personCase(user.name || user.email || '')
            : 'Assigned'
          : 'Unassigned';
    items.push({
      id: row.id,
      name: personCase(row.name?.trim() || '') || 'Unnamed',
      phone: row.phone ?? '',
      status,
      statusLabel: statusLabel(status),
      state: stateOf(status, when.day, today),
      day: when.day,
      time: clock(when.hhmm),
      hhmm: when.hhmm,
      pickup: row.pickup ?? '',
      drop: row.dropLocation ?? '',
      from: cityOf(row.pickup),
      to: cityOf(row.dropLocation),
      size: row.moveSize ?? '',
      service: row.service ?? '',
      ownerId: ownerId || null,
      ownerName,
    });
  }

  // Filters arrive in the URL so a filtered calendar can be bookmarked and shared.
  const stateList = one(sp.show)
    .split(',')
    .filter((s): s is CalState => CAL_STATES.some((c) => c.value === s));
  const initialFilters: CalFilters = {
    // Callbacks are opt-in: this is a calendar of moves, and a promised phone call on
    // the same grid would make a quiet Tuesday look busy.
    states: stateList.length ? stateList : DEFAULT_STATES,
    owner: one(sp.owner),
    service: one(sp.service),
    city: one(sp.city),
    mine: one(sp.mine) === '1',
  };

  return template(
    <CalendarApp
      view={view}
      date={date}
      today={today}
      items={items}
      dayLoad={dayLoad}
      capacity={capacity}
      undatedWon={undatedWon}
      canReschedule={role === 'admin' || role === 'handler'}
      canSeeTeam={role === 'admin' || role === 'handler'}
      meId={String(user.id)}
      initialFilters={initialFilters}
    />,
  );
}
