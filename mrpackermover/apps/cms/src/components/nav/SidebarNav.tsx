import type { Payload, ServerProps } from 'payload';
import Link from 'next/link';

/**
 * Sidebar header (admin.components.beforeNavLinks): a live "Needs attention" panel —
 * new leads, new job applications and unread contact messages, each a one-tap link to
 * the filtered collection — plus a compact quick-access list. Server component so the
 * counts are always current. Payload theme variables + the violet admin accent
 * (matches the redesigned dashboard and global admin theme).
 */
const V = '#6D5AE6';

const QUICK = [
  { href: '/admin/collections/leads', label: 'Leads', sales: true },
  { href: '/admin/collections/proposals', label: 'Proposals', sales: true },
  { href: '/admin/collections/locations', label: 'Locations' },
  { href: '/admin/collections/reviews', label: 'Reviews' },
  { href: '/admin/collections/pages', label: 'Editorial pages' },
  { href: '/admin/collections/jobs', label: 'Job openings' },
  { href: '/admin/globals/home-content', label: 'Home page' },
];

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

  const leadBadgeWhere: Record<string, unknown> = isSales
    ? { and: [{ assignedTo: { equals: userId } }, { acknowledgedAt: { exists: false } }] }
    : isHandler
      ? { assignedTo: { exists: false } }
      : { status: { equals: 'new' } };
  const leadBadgeLabel = isSales ? 'New to you' : isHandler ? 'Needs an owner' : 'New leads';
  const leadBadgeHref = isHandler
    ? '/admin/collections/leads?where[assignedTo][exists]=false'
    : '/admin/collections/leads?where[status][equals]=new';
  const [leads, apps, messages] = await Promise.all([
    // "Needs attention" means something different in each chair, and the badge has to
    // match what that person's dashboard puts in front of them:
    //
    //   sales   — leads handed to them that they have not acted on ("New to you").
    //             Their own leads are never status `new`; they become `assigned` the
    //             moment they are handed over, so counting `new` would always show 0.
    //   handler — leads with nobody on them yet ("Needs an owner"). A handler routes
    //             work rather than receiving it, so counting leads assigned TO them
    //             would sit at 0 while the queue filled up behind them.
    //   others  — leads nobody has touched at all.
    tally(payload, 'leads', user, leadBadgeWhere),
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
    },
    // Careers and the contact inbox belong to content staff, not the sales desk.
    ...(salesOnly
      ? []
      : [
          {
            label: 'New applications',
            count: apps,
            href: '/admin/collections/job-applications?where[status][equals]=new',
          },
          {
            label: 'Unread messages',
            count: messages,
            href: '/admin/collections/contact-messages?where[status][equals]=new',
          },
        ]),
  ];

  const quickLinks = QUICK.filter((q) => !salesOnly || q.sales);
  const totalOpen = leads + apps + messages;

  return (
    <div className="mpm-nav">
      <style>{CSS}</style>

      <Link href="/admin/collections/proposals/create" className="mpm-nav__studio">
        <span className="mpm-nav__studio-title">＋ New proposal</span>
        <span className="mpm-nav__studio-sub">Create &amp; download a PDF quote</span>
      </Link>

      <div className="mpm-nav__panel">
        <div className="mpm-nav__panel-head">
          <span className="mpm-nav__panel-title">Needs attention</span>
          {totalOpen > 0 && <span className="mpm-nav__panel-dot" aria-hidden="true" />}
        </div>
        <div className="mpm-nav__alerts">
          {alerts.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`mpm-nav__alert${a.count > 0 ? ' is-hot' : ''}`}
            >
              <span className="mpm-nav__alert-label">{a.label}</span>
              <span className="mpm-nav__alert-count">{a.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mpm-nav__quick">
        <span className="mpm-nav__quick-title">Quick access</span>
        {/*
          A plain anchor, not next/link, on purpose.

          The alert above links to a FILTERED list - "New leads" is
          ?where[status][equals]=new. Navigating from there to the unfiltered list with a
          client-side Link leaves the old query string in the address bar: the rows update
          correctly (19 of 19, measured), but Payload's list provider re-serialises its
          own state into the URL and carries the stale `where` along with it. The page
          looks right until you refresh, and then the filter comes back from the URL.

          A real navigation rebuilds that provider from the address you actually clicked,
          so what you see and what a refresh gives you are the same thing. It costs a
          document load on a nav click, which is the right trade for a link whose whole
          job is "show me everything".
        */}
        {quickLinks.map((q) => (
          <a key={q.href} href={q.href} className="mpm-nav__quick-link">
            {q.label}
          </a>
        ))}
      </div>
    </div>
  );
}

const CSS = `
.mpm-nav { padding: 0 .25rem .7rem; margin-bottom: .7rem; border-bottom: 1px solid var(--theme-elevation-100); }
.mpm-nav__studio { display:flex; flex-direction:column; gap:.05rem; text-decoration:none; padding:.6rem .75rem; margin-bottom:.85rem; border-radius:12px; background:linear-gradient(140deg,#8B7CF0,#5A46D6); box-shadow:0 6px 16px color-mix(in srgb, ${V} 35%, transparent); transition:transform .12s, box-shadow .12s; }
.mpm-nav__studio:hover { transform:translateY(-1px); box-shadow:0 10px 22px color-mix(in srgb, ${V} 45%, transparent); }
.mpm-nav__studio-title { color:#fff; font-weight:700; font-size:1.1rem; }
.mpm-nav__studio-sub { color:rgba(255,255,255,.82); font-size:.85rem; }
.mpm-nav__panel { background:color-mix(in srgb, ${V} 6%, var(--theme-elevation-50)); border:1px solid color-mix(in srgb, ${V} 12%, var(--theme-elevation-100)); border-radius:14px; padding:.65rem .7rem .55rem; margin-bottom:.85rem; }
.mpm-nav__panel-head { display:flex; align-items:center; gap:.4rem; margin:0 .1rem .55rem; }
.mpm-nav__panel-title { font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--theme-elevation-600); }
.mpm-nav__panel-dot { width:7px; height:7px; border-radius:50%; background:${V}; box-shadow:0 0 0 3px color-mix(in srgb, ${V} 24%, transparent); }
.mpm-nav__alerts { display:flex; flex-direction:column; gap:.28rem; }
.mpm-nav__alert { display:flex; align-items:center; justify-content:space-between; gap:.5rem; text-decoration:none; padding:.42rem .55rem; border-radius:9px; border:1px solid transparent; transition:background .12s,border-color .12s; }
.mpm-nav__alert:hover { background:var(--theme-elevation-100); }
.mpm-nav__alert-label { font-size:1.05rem; color:var(--theme-elevation-800); }
.mpm-nav__alert-count { font-weight:700; font-size:.85rem; color:var(--theme-elevation-600); background:var(--theme-elevation-100); min-width:1.5rem; text-align:center; padding:.1rem .4rem; border-radius:99px; }
.mpm-nav__alert.is-hot { background:color-mix(in srgb, ${V} 11%, var(--theme-elevation-50)); border-color:color-mix(in srgb, ${V} 28%, transparent); }
.mpm-nav__alert.is-hot .mpm-nav__alert-label { color:var(--theme-elevation-1000); font-weight:600; }
.mpm-nav__alert.is-hot .mpm-nav__alert-count { color:#fff; background:linear-gradient(140deg,#8B7CF0,#5A46D6); }

.mpm-nav__quick { display:flex; flex-direction:column; gap:.1rem; }
.mpm-nav__quick-title { font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--theme-elevation-500); padding:.15rem .4rem .35rem; }
.mpm-nav__quick-link { font-size:1.1rem; color:var(--theme-elevation-800); text-decoration:none; padding:.44rem .55rem; border-radius:9px; transition:background .12s,color .12s; }
.mpm-nav__quick-link:hover { background:color-mix(in srgb, ${V} 10%, transparent); color:${V}; }
`;
