import type { Payload, ServerProps } from 'payload';
import Link from 'next/link';

/**
 * Sidebar header (admin.components.beforeNavLinks): a live "Needs attention" panel —
 * new leads, new job applications and unread contact messages, each a one-tap link to
 * the filtered collection — plus a compact quick-access list. Server component so the
 * counts are always current. Payload theme variables + brand maroon.
 */
const BRAND = '#990010';

const QUICK = [
  { href: '/admin/collections/locations', label: 'Locations' },
  { href: '/admin/collections/reviews', label: 'Reviews' },
  { href: '/admin/collections/pages', label: 'Editorial pages' },
  { href: '/admin/collections/jobs', label: 'Job openings' },
  { href: '/admin/globals/home-content', label: 'Home page' },
];

async function tally(payload: Payload | undefined, collection: string): Promise<number> {
  if (!payload) return 0;
  try {
    const res = await payload.count({
      collection: collection as never,
      where: { status: { equals: 'new' } } as never,
      overrideAccess: true,
    });
    return res.totalDocs;
  } catch {
    return 0;
  }
}

export async function SidebarNav(props: ServerProps): Promise<React.JSX.Element> {
  const payload = props?.payload;
  const [leads, apps, messages] = await Promise.all([
    tally(payload, 'leads'),
    tally(payload, 'job-applications'),
    tally(payload, 'contact-messages'),
  ]);

  const alerts = [
    {
      label: 'New leads',
      count: leads,
      href: '/admin/collections/leads?where[status][equals]=new',
    },
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
  ];
  const totalOpen = leads + apps + messages;

  return (
    <div className="mpm-nav">
      <style>{CSS}</style>

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
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="mpm-nav__quick-link">
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const CSS = `
.mpm-nav { padding: 0 .25rem .6rem; margin-bottom: .6rem; border-bottom: 1px solid var(--theme-elevation-100); }
.mpm-nav__panel { background:var(--theme-elevation-50); border:1px solid var(--theme-elevation-100); border-radius:10px; padding:.6rem .65rem .5rem; margin-bottom:.8rem; }
.mpm-nav__panel-head { display:flex; align-items:center; gap:.4rem; margin:0 .1rem .5rem; }
.mpm-nav__panel-title { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--theme-elevation-500); }
.mpm-nav__panel-dot { width:7px; height:7px; border-radius:50%; background:${BRAND}; box-shadow:0 0 0 3px color-mix(in srgb, ${BRAND} 22%, transparent); }
.mpm-nav__alerts { display:flex; flex-direction:column; gap:.25rem; }
.mpm-nav__alert { display:flex; align-items:center; justify-content:space-between; gap:.5rem; text-decoration:none; padding:.4rem .5rem; border-radius:7px; border:1px solid transparent; }
.mpm-nav__alert:hover { background:var(--theme-elevation-100); }
.mpm-nav__alert-label { font-size:.8rem; color:var(--theme-elevation-700); }
.mpm-nav__alert-count { font-weight:700; font-size:.8rem; color:var(--theme-elevation-500); background:var(--theme-elevation-100); min-width:1.4rem; text-align:center; padding:.05rem .35rem; border-radius:99px; }
.mpm-nav__alert.is-hot { background:color-mix(in srgb, ${BRAND} 10%, var(--theme-elevation-50)); border-color:color-mix(in srgb, ${BRAND} 26%, transparent); }
.mpm-nav__alert.is-hot .mpm-nav__alert-label { color:var(--theme-elevation-1000); font-weight:600; }
.mpm-nav__alert.is-hot .mpm-nav__alert-count { color:#fff; background:${BRAND}; }

.mpm-nav__quick { display:flex; flex-direction:column; gap:.1rem; }
.mpm-nav__quick-title { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--theme-elevation-450); padding:.1rem .35rem .3rem; }
.mpm-nav__quick-link { font-size:.82rem; color:var(--theme-elevation-700); text-decoration:none; padding:.32rem .45rem; border-radius:6px; }
.mpm-nav__quick-link:hover { background:var(--theme-elevation-100); color:${BRAND}; }
`;
