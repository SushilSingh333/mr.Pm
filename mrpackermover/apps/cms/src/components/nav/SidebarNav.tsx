import type { Payload, ServerProps } from 'payload';
import Link from 'next/link';
import { CLOSED_STAGES } from '../dashboard/lead-status.js';
import { BrandIcon } from '../graphics/BrandIcon.js';
import { MIcon } from '../icons/MIcon.js';
import { NavRow } from './NavRow.js';

/**
 * Sidebar header (admin.components.beforeNavLinks): a live "Needs attention" panel —
 * new leads, new job applications and unread contact messages, each a one-tap link to
 * the filtered collection — plus Create and the schedule shortcuts. Server component so
 * the counts are always current. Styled as Google's side navigation.
 */

/**
 * Count rows this person is actually allowed to see.
 *
 * This ran with `overrideAccess: true`, which bypasses the access layer entirely: a
 * salesperson's "New leads" badge showed every lead in the business — 33 — sitting next
 * to a list that correctly showed none of them. Both wrong and a small leak, since the
 * number told them how much work exists that they cannot see.
 */
async function tally(
  payload: Payload | undefined,
  collection: string,
  user: unknown,
  where: Record<string, unknown>,
): Promise<number> {
  if (!payload) return 0;
  try {
    const res = await payload.count({
      collection: collection as never,
      where: where as never,
      overrideAccess: false,
      user: user as never,
    });
    return res.totalDocs;
  } catch {
    return 0;
  }
}

export async function SidebarNav(props: ServerProps): Promise<React.JSX.Element> {
  const payload = props?.payload;
  // This is a hand-built nav, so Payload's `admin.hidden` does not touch it. Without
  // this the sales hierarchy saw links (and unread counts) for content and careers
  // collections they are refused by the API anyway — noise at best, and a hint about
  // data they have no business knowing exists.
  const user = props?.user;
  const role = (user as { role?: string } | undefined)?.role;
  const userId = (user as { id?: string | number } | undefined)?.id;
  const salesOnly = role === 'handler' || role === 'sales';
  const isSales = role === 'sales';
  const isHandler = role === 'handler';

  // The same predicate the dashboard card uses, closed stages and all. Without the
  // `not_in`, one unassigned lead marked "Invalid lead" inflates this badge forever while
  // the card three inches to the right stays right - and the two are meant to be the same
  // number, because they are meant to be the same queue.
  const leadBadgeWhere: Record<string, unknown> = isSales
    ? {
        and: [
          { assignedTo: { equals: userId } },
          { acknowledgedAt: { exists: false } },
          { status: { not_in: CLOSED_STAGES } },
        ],
      }
    : isHandler
      ? { and: [{ assignedTo: { exists: false } }, { status: { not_in: CLOSED_STAGES } }] }
      : { status: { equals: 'new' } };
  const leadBadgeLabel = isSales ? 'New to you' : isHandler ? 'Unassigned leads' : 'New leads';
  // Both sales roles land on their own dashboard with that queue already filtered, which
  // is the only screen where the badge's number and the list underneath it are the same
  // query. The sales link used to be ?where[status][equals]=new - and a salesperson's
  // leads are never `new`, as the note below already says, so the badge read 4 and opened
  // an empty list. Content staff keep the list link: they have no lead board.
  const leadBadgeHref = salesOnly
    ? '/admin?range=all&filter=queue#leads'
    : '/admin/collections/leads?where[status][equals]=new';
  /**
   * Every booked move, which is exactly what the button opens.
   *
   * The count and the destination run the SAME condition on purpose. An earlier version
   * counted everything promised inside the notice window and then opened a list of
   * booked moves - a badge reading 6 above a page showing 4, which is the kind of small
   * lie that stops people trusting the number. One query, one meaning.
   *
   * The two-days-early warning has not gone anywhere; it lives on the dashboard strip,
   * which is where urgency belongs. This is a destination, not an alarm.
   */
  const scheduleWhere = { status: { equals: 'scheduled' } };

  const [leads, scheduled, apps, messages] = await Promise.all([
    // "Needs attention" means something different in each chair, and the badge has to
    // match what that person's dashboard puts in front of them:
    //
    //   sales   — leads handed to them that they have not acted on ("New to you").
    //             Their own leads are never status `new`; they become `assigned` the
    //             moment they are handed over, so counting `new` would always show 0.
    //   handler — leads with nobody on them yet ("Unassigned leads"). A handler routes
    //             work rather than receiving it, so counting leads assigned TO them
    //             would sit at 0 while the queue filled up behind them.
    //   others  — leads nobody has touched at all.
    tally(payload, 'leads', user, leadBadgeWhere),
    // Content staff have no moves to keep track of.
    role === 'editor' || role === 'ops'
      ? Promise.resolve(0)
      : tally(payload, 'leads', user, scheduleWhere),
    salesOnly
      ? Promise.resolve(0)
      : tally(payload, 'job-applications', user, { status: { equals: 'new' } }),
    salesOnly
      ? Promise.resolve(0)
      : tally(payload, 'contact-messages', user, { status: { equals: 'new' } }),
  ]);

  const alerts = [
    {
      label: leadBadgeLabel,
      count: leads,
      href: leadBadgeHref,
      icon: (isHandler ? 'person_add' : 'inbox') as 'person_add' | 'inbox' | 'assignment' | 'mail',
    },
    // Careers and the contact inbox belong to content staff, not the sales desk.
    ...(salesOnly
      ? []
      : [
          {
            label: 'New applications',
            count: apps,
            icon: 'assignment' as const,
            href: '/admin/collections/job-applications?where[status][equals]=new',
          },
          {
            label: 'Unread messages',
            count: messages,
            icon: 'mail' as const,
            href: '/admin/collections/contact-messages?where[status][equals]=new',
          },
        ]),
  ];

  const showSchedule = role !== 'editor' && role !== 'ops';

  return (
    <div className="mpm-nav">
      <style>{CSS}</style>

      {/* The logo, for the top-left corner beside the menu button while the sidebar is
          open (placed there by AdminTheme, laptop widths only) - where Google Calendar
          and Gmail keep theirs. The header drops its own copy meanwhile. */}
      <Link href="/admin" className="mpm-nav__brand" title="Dashboard" prefetch={false}>
        <BrandIcon />
      </Link>

      {/* Google Calendar's "Create": the one thing in the sidebar that makes something,
          so it is the one raised object - a white button with a soft lift, above the
          plain navigation rows. */}
      <Link
        href="/admin/collections/proposals/create"
        className="mpm-nav__create"
        title="Create and download a PDF quote"
        prefetch={false}
      >
        <MIcon name="add" size={24} className="mpm-nav__create-ico" />
        <span>New proposal</span>
      </Link>

      {/* The way into the schedule, from anywhere in the admin: the Leads list filtered to
          Scheduled (so the list's own tools - dial strip, owner, bulk assign - come with
          it) and the same moves on the calendar. Only the filter rides in the link:
          Payload saves sort and column choices as preferences the moment a URL carries
          them, and the soonest-first order comes from the collection instead (Leads'
          beforeOperation hook). */}
      {showSchedule && (
        <>
          <NavRow
            href="/admin/collections/leads?where%5Bstatus%5D%5Bequals%5D=scheduled"
            icon="format_list_bulleted"
            label="Schedule"
            count={scheduled}
            title="Every booked move, on the Leads list"
          />
          <NavRow
            href="/admin/calendar"
            icon="calendar_month"
            label="Calendar"
            activeOn="/admin/calendar"
            title="Booked moves by day"
          />
        </>
      )}

      {/* Things waiting on somebody. Gmail's unread treatment: a row goes bold, count and
          all, while there is something in it. */}
      <div className="mpm-nav__section" role="group" aria-label="Needs attention">
        <div className="mpm-nav__section-title">Needs attention</div>
        {alerts.map((a) => (
          <NavRow
            key={a.label}
            href={a.href}
            icon={a.icon}
            label={a.label}
            count={a.count}
            strong={a.count > 0}
          />
        ))}
      </div>
    </div>
  );
}

const CSS = `
/* Google's side navigation (Calendar, Gmail): a raised Create button, then flat rows -
   a full pill each, a 20px icon, the text in ink, pale blue under the page you are on. */
.mpm-nav { padding: 6px 0 10px; margin-bottom: 6px; border-bottom: 0; }
.mpm-nav__create {
  display:inline-flex; align-items:center; gap:12px; height:56px; padding:0 24px 0 16px;
  margin:2px 0 14px 6px; border-radius:16px; text-decoration:none;
  /* Gmail's Compose: a tonal blue block. The sidebar is a white panel now, where a white
     button with a lift would vanish into it. */
  background:var(--mpm-sel-2); color:var(--mpm-on-sel-2);
  font-family:var(--mpm-font-display); font-size:14px; font-weight:500; letter-spacing:.01em;
  transition:box-shadow .15s; }
.mpm-nav__create:hover { box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); }
html[data-theme="dark"] .mpm-nav__create:hover { box-shadow:0 1px 3px rgba(0,0,0,.6); }
.mpm-nav__create-ico { color:inherit; }

.mpm-nav__row {
  display:flex; align-items:center; gap:16px; min-height:36px;
  padding:0 16px 0 14px; margin:1px 10px 1px 6px; border-radius:999px;
  text-decoration:none; color:var(--mpm-ink);
  font-size:14px; font-weight:400; letter-spacing:.01em;
  transition:background .12s; }
.mpm-nav__row:hover { background:var(--mpm-hover); }
.mpm-nav__row-ico { flex:none; color:var(--mpm-ink-2); }
.mpm-nav__row-label { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-nav__row-n { flex:none; font-size:12px; font-weight:500; font-variant-numeric:tabular-nums; color:var(--mpm-ink-2); }
.mpm-nav__row.is-strong .mpm-nav__row-label,
.mpm-nav__row.is-strong .mpm-nav__row-n { font-weight:700; color:var(--mpm-ink); }
.mpm-nav__row.is-active { background:var(--mpm-sel); color:var(--mpm-on-sel); font-weight:700; }
.mpm-nav__row.is-active .mpm-nav__row-ico,
.mpm-nav__row.is-active .mpm-nav__row-n { color:inherit; }
.mpm-nav__row:focus-visible { outline:2px solid var(--mpm-v-400); outline-offset:-2px; }

.mpm-nav__section { margin-top:14px; }
.mpm-nav__section-title { padding:6px 16px 6px 20px; font-size:14px; font-weight:500; color:var(--mpm-ink); }

/* The phone drawer: the same rows, sized for a thumb. */
.nav--nav-open .mpm-nav__row { min-height:48px; margin:1px 0; }
.nav--nav-open .mpm-nav__create { margin-left:0; }
`;
