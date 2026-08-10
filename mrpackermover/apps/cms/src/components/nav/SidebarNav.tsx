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
.mpm-nav { padding: 0 .25rem .7rem; margin-bottom: .7rem; border-bottom: 1px solid var(--theme-elevation-100); }
.mpm-nav__panel { background:color-mix(in srgb, ${V} 6%, var(--theme-elevation-50)); border:1px solid color-mix(in srgb, ${V} 12%, var(--theme-elevation-100)); border-radius:14px; padding:.65rem .7rem .55rem; margin-bottom:.85rem; }
.mpm-nav__panel-head { display:flex; align-items:center; gap:.4rem; margin:0 .1rem .55rem; }
.mpm-nav__panel-title { font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--theme-elevation-600); }
.mpm-nav__panel-dot { width:7px; height:7px; border-radius:50%; background:${V}; box-shadow:0 0 0 3px color-mix(in srgb, ${V} 24%, transparent); }
.mpm-nav__alerts { display:flex; flex-direction:column; gap:.28rem; }
.mpm-nav__alert { display:flex; align-items:center; justify-content:space-between; gap:.5rem; text-decoration:none; padding:.42rem .55rem; border-radius:9px; border:1px solid transparent; transition:background .12s,border-color .12s; }
.mpm-nav__alert:hover { background:var(--theme-elevation-100); }
.mpm-nav__alert-label { font-size:.9rem; color:var(--theme-elevation-800); }
.mpm-nav__alert-count { font-weight:700; font-size:.85rem; color:var(--theme-elevation-600); background:var(--theme-elevation-100); min-width:1.5rem; text-align:center; padding:.1rem .4rem; border-radius:99px; }
.mpm-nav__alert.is-hot { background:color-mix(in srgb, ${V} 11%, var(--theme-elevation-50)); border-color:color-mix(in srgb, ${V} 28%, transparent); }
.mpm-nav__alert.is-hot .mpm-nav__alert-label { color:var(--theme-elevation-1000); font-weight:600; }
.mpm-nav__alert.is-hot .mpm-nav__alert-count { color:#fff; background:linear-gradient(140deg,#8B7CF0,#5A46D6); }

.mpm-nav__quick { display:flex; flex-direction:column; gap:.1rem; }
.mpm-nav__quick-title { font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; font-weight:700; color:var(--theme-elevation-500); padding:.15rem .4rem .35rem; }
.mpm-nav__quick-link { font-size:.94rem; color:var(--theme-elevation-800); text-decoration:none; padding:.44rem .55rem; border-radius:9px; transition:background .12s,color .12s; }
.mpm-nav__quick-link:hover { background:color-mix(in srgb, ${V} 10%, transparent); color:${V}; }
`;
