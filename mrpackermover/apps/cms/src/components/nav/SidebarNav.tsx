import type { ServerProps } from 'payload';
import Link from 'next/link';

/**
 * Sidebar enhancement rendered at the top of the nav (admin.components.beforeNavLinks):
 * a live "New leads" quick-action badge + a small quick-access list. Server component so
 * the badge count is always current. Colours use Payload theme variables + brand maroon.
 */
const BRAND = '#990010';

const QUICK = [
  { href: '/admin/collections/leads', label: 'Leads' },
  { href: '/admin/collections/locations', label: 'Locations' },
  { href: '/admin/collections/reviews', label: 'Reviews' },
  { href: '/admin/globals/home-content', label: 'Home page' },
];

export async function SidebarNav(props: ServerProps): Promise<React.JSX.Element> {
  const payload = props?.payload;
  let newLeads = 0;
  if (payload) {
    try {
      const res = await payload.count({
        collection: 'leads' as never,
        where: { status: { equals: 'new' } } as never,
        overrideAccess: true,
      });
      newLeads = res.totalDocs;
    } catch {
      newLeads = 0;
    }
  }

  return (
    <div className="mpm-nav">
      <style>{CSS}</style>

      <Link href="/admin/collections/leads" className="mpm-nav__leads">
        <span className="mpm-nav__leads-dot" aria-hidden="true" />
        <span className="mpm-nav__leads-text">
          <span className="mpm-nav__leads-title">New leads</span>
          <span className="mpm-nav__leads-sub">awaiting a first call</span>
        </span>
        <span className="mpm-nav__leads-count">{newLeads}</span>
      </Link>

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
.mpm-nav { padding: 0 .25rem .5rem; margin-bottom: .5rem; border-bottom: 1px solid var(--theme-elevation-100); }
.mpm-nav__leads { display:flex; align-items:center; gap:.6rem; text-decoration:none; padding:.6rem .7rem; border-radius:9px;
  background:color-mix(in srgb, ${BRAND} 12%, var(--theme-elevation-50)); border:1px solid color-mix(in srgb, ${BRAND} 28%, transparent); margin-bottom:.8rem; }
.mpm-nav__leads:hover { background:color-mix(in srgb, ${BRAND} 18%, var(--theme-elevation-50)); }
.mpm-nav__leads-dot { width:8px; height:8px; border-radius:50%; background:${BRAND}; flex:none; box-shadow:0 0 0 3px color-mix(in srgb, ${BRAND} 22%, transparent); }
.mpm-nav__leads-text { display:flex; flex-direction:column; line-height:1.15; min-width:0; flex:1; }
.mpm-nav__leads-title { font-weight:700; font-size:.82rem; color:var(--theme-elevation-1000); }
.mpm-nav__leads-sub { font-size:.68rem; color:var(--theme-elevation-500); }
.mpm-nav__leads-count { font-weight:800; font-size:.95rem; color:#fff; background:${BRAND}; min-width:1.5rem; text-align:center; padding:.1rem .4rem; border-radius:99px; }
.mpm-nav__quick { display:flex; flex-direction:column; gap:.1rem; }
.mpm-nav__quick-title { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--theme-elevation-450); padding:.1rem .35rem .3rem; }
.mpm-nav__quick-link { font-size:.82rem; color:var(--theme-elevation-700); text-decoration:none; padding:.32rem .45rem; border-radius:6px; }
.mpm-nav__quick-link:hover { background:var(--theme-elevation-100); color:${BRAND}; }
`;
