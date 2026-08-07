import type { Payload } from 'payload';
import Link from 'next/link';

/**
 * Full dashboard VIEW (admin.components.views.dashboard) — replaces Payload's default
 * dashboard so the redundant collection-group cards are gone (the sidebar already lists
 * them). A server component: it reads live counts through the local API, every query
 * guarded so one failure degrades a single card. Sales (leads) + Careers (job openings /
 * applications) + Inbox (messages) + content coverage, in Payload's light/dark theme with
 * the brand maroon accent.
 */

const BRAND = '#990010';
const NAVY = '#092341';

const LEAD_STATUS = [
  { value: 'new', label: 'New', color: BRAND },
  { value: 'contacted', label: 'Contacted', color: '#2f6df6' },
  { value: 'quoted', label: 'Quoted', color: '#c98a00' },
  { value: 'won', label: 'Won', color: '#1a9d5a' },
  { value: 'lost', label: 'Lost', color: '#8a8f98' },
];
const APP_STATUS = [
  { value: 'new', label: 'New', color: BRAND },
  { value: 'reviewing', label: 'Reviewing', color: '#2f6df6' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#c98a00' },
  { value: 'hired', label: 'Hired', color: '#1a9d5a' },
  { value: 'rejected', label: 'Rejected', color: '#8a8f98' },
];

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
const fmt = (n: number): string => n.toLocaleString('en-IN');
function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

interface LeadDoc {
  id: string | number;
  name?: string;
  phone?: string;
  service?: string;
  pickup?: string;
  status?: string;
  createdAt: string;
}
interface AppDoc {
  id: string | number;
  name?: string;
  position?: string;
  email?: string;
  status?: string;
  createdAt: string;
}
interface JobStat {
  count?: number;
  onTimePct?: number;
}

// Props come from the admin view; payload/user may sit at the top level or under initPageResult.
interface ViewProps {
  payload?: Payload;
  user?: { email?: string; name?: string } | null;
  initPageResult?: { req?: { payload?: Payload; user?: { email?: string; name?: string } | null } };
}

export async function Dashboard(props: ViewProps): Promise<React.JSX.Element> {
  const payload = props?.payload ?? props?.initPageResult?.req?.payload;
  const user = props?.user ?? props?.initPageResult?.req?.user ?? null;

  if (!payload) {
    return (
      <div className="mpm-dash">
        <style>{CSS}</style>
        <p className="mpm-empty">Dashboard data is unavailable.</p>
      </div>
    );
  }

  const count = (collection: string, where?: unknown): Promise<number> =>
    safe(
      async () =>
        (
          await payload.count({
            collection: collection as never,
            where: where as never,
            overrideAccess: true,
          })
        ).totalDocs,
      0,
    );
  const findDocs = (collection: string, opts: Record<string, unknown>): Promise<unknown[]> =>
    safe(async () => {
      const res = (await payload.find({
        collection: collection as never,
        overrideAccess: true,
        ...opts,
      } as never)) as { docs: unknown[] };
      return res.docs;
    }, []);

  const [
    leadByStatus,
    recentLeadsRaw,
    appByStatus,
    recentAppsRaw,
    openJobs,
    msgNew,
    msgHandled,
    cities,
    localities,
    services,
    reviews,
    guides,
    faqs,
    jobStatsRaw,
  ] = await Promise.all([
    Promise.all(LEAD_STATUS.map((s) => count('leads', { status: { equals: s.value } }))),
    findDocs('leads', { limit: 6, sort: '-createdAt', depth: 0 }),
    Promise.all(APP_STATUS.map((s) => count('job-applications', { status: { equals: s.value } }))),
    findDocs('job-applications', { limit: 5, sort: '-createdAt', depth: 0 }),
    count('jobs', { isOpen: { equals: true } }),
    count('contact-messages', { status: { equals: 'new' } }),
    count('contact-messages', { status: { equals: 'handled' } }),
    count('locations', { type: { equals: 'city' } }),
    count('locations', { type: { equals: 'locality' } }),
    count('services'),
    count('reviews'),
    count('guides'),
    count('faqs'),
    findDocs('jobs-stats', { limit: 500, depth: 0 }),
  ]);

  const leads = LEAD_STATUS.map((s, i) => ({ ...s, count: leadByStatus[i] ?? 0 }));
  const totalLeads = leads.reduce((a, c) => a + c.count, 0);
  const newLeads = leads.find((c) => c.value === 'new')?.count ?? 0;
  const won = leads.find((c) => c.value === 'won')?.count ?? 0;
  const decided = won + (leads.find((c) => c.value === 'lost')?.count ?? 0);
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : null;
  const maxLead = Math.max(1, ...leads.map((c) => c.count));

  const apps = APP_STATUS.map((s, i) => ({ ...s, count: appByStatus[i] ?? 0 }));
  const totalApps = apps.reduce((a, c) => a + c.count, 0);
  const newApps = apps.find((c) => c.value === 'new')?.count ?? 0;
  const hired = apps.find((c) => c.value === 'hired')?.count ?? 0;
  const maxApp = Math.max(1, ...apps.map((c) => c.count));

  const jobStats = jobStatsRaw as JobStat[];
  const totalMoves = jobStats.reduce((a, d) => a + (Number(d.count) || 0), 0);
  const onTimeVals = jobStats.map((d) => Number(d.onTimePct)).filter((n) => !Number.isNaN(n));
  const onTimeAvg = onTimeVals.length
    ? Math.round(onTimeVals.reduce((a, b) => a + b, 0) / onTimeVals.length)
    : null;

  const recentLeads = recentLeadsRaw as LeadDoc[];
  const recentApps = recentAppsRaw as AppDoc[];
  const firstName = (user?.name || user?.email || '').split(/[@\s]/)[0];

  const kpis = [
    {
      label: 'New leads',
      value: fmt(newLeads),
      hint: 'need a first call',
      accent: BRAND,
      hot: true,
      href: '/admin/collections/leads?where[status][equals]=new',
    },
    {
      label: 'New applications',
      value: fmt(newApps),
      hint: `${fmt(totalApps)} all time`,
      accent: '#2f6df6',
      hot: newApps > 0,
      href: '/admin/collections/job-applications',
    },
    {
      label: 'Unread messages',
      value: fmt(msgNew),
      hint: 'from the contact form',
      accent: '#c98a00',
      hot: msgNew > 0,
      href: '/admin/collections/contact-messages',
    },
    {
      label: 'Won',
      value: fmt(won),
      hint: winRate != null ? `${winRate}% win rate` : 'no wins yet',
      accent: '#1a9d5a',
      href: '/admin/collections/leads?where[status][equals]=won',
    },
    {
      label: 'Moves logged',
      value: fmt(totalMoves),
      hint: 'from jobs data',
      accent: NAVY,
      href: '/admin/collections/jobs-stats',
    },
    {
      label: 'On-time',
      value: onTimeAvg != null ? `${onTimeAvg}%` : '—',
      hint: 'avg across cities',
      accent: NAVY,
    },
  ];

  const content = [
    { label: 'Cities', value: cities },
    { label: 'Localities', value: localities },
    { label: 'Services', value: services },
    { label: 'Reviews', value: reviews },
    { label: 'Guides', value: guides },
    { label: 'FAQs', value: faqs },
  ];

  return (
    <div className="mpm-dash">
      <style>{CSS}</style>

      <div className="mpm-dash__head">
        <div>
          <h1 className="mpm-dash__title">
            {firstName ? `Welcome back, ${firstName}` : 'Operations overview'}
          </h1>
          <p className="mpm-dash__sub">Live from your data — leads, careers, inbox and coverage.</p>
        </div>
        <Link href="/admin/collections/leads" className="mpm-dash__cta">
          View all leads →
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mpm-kpis">
        {kpis.map((k) => {
          const inner = (
            <>
              <span className="mpm-kpi__bar" style={{ background: k.accent }} />
              <span className="mpm-kpi__label">{k.label}</span>
              <span className="mpm-kpi__value">{k.value}</span>
              <span className="mpm-kpi__hint">{k.hint}</span>
            </>
          );
          const cls = `mpm-kpi${k.hot ? ' mpm-kpi--hot' : ''}`;
          return k.href ? (
            <Link
              key={k.label}
              href={k.href}
              className={cls}
              style={{ ['--c' as string]: k.accent }}
            >
              {inner}
            </Link>
          ) : (
            <div key={k.label} className={cls} style={{ ['--c' as string]: k.accent }}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Sales: pipeline + recent leads */}
      <div className="mpm-grid">
        <section className="mpm-card">
          <div className="mpm-card__head">
            <h3>Lead pipeline</h3>
            <span className="mpm-muted">{fmt(totalLeads)} total</span>
          </div>
          {totalLeads === 0 ? (
            <p className="mpm-empty">No leads yet. Quote-form submissions appear here.</p>
          ) : (
            <ul className="mpm-bars">
              {leads.map((c) => (
                <li key={c.value} className="mpm-bar">
                  <span className="mpm-bar__label">
                    <i style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="mpm-bar__track">
                    <span
                      className="mpm-bar__fill"
                      style={{ width: `${(c.count / maxLead) * 100}%`, background: c.color }}
                    />
                  </span>
                  <span className="mpm-bar__count">{fmt(c.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mpm-card">
          <div className="mpm-card__head">
            <h3>Recent leads</h3>
            <Link href="/admin/collections/leads" className="mpm-muted mpm-link">
              open →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mpm-empty">Nothing yet.</p>
          ) : (
            <ul className="mpm-rows">
              {recentLeads.map((l) => {
                const meta = LEAD_STATUS.find((s) => s.value === l.status) ?? LEAD_STATUS[0]!;
                return (
                  <li key={String(l.id)} className="mpm-row">
                    <Link href={`/admin/collections/leads/${l.id}`} className="mpm-row__main">
                      <span className="mpm-row__name">{l.name || 'Unnamed'}</span>
                      <span className="mpm-row__meta">
                        {[l.service, l.pickup].filter(Boolean).join(' · ') || l.phone || '—'}
                      </span>
                    </Link>
                    <span className="mpm-badge" style={{ ['--c' as string]: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="mpm-row__time">{timeAgo(l.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Careers + Inbox */}
      <div className="mpm-grid">
        <section className="mpm-card">
          <div className="mpm-card__head">
            <h3>Careers</h3>
            <Link href="/admin/collections/job-applications" className="mpm-muted mpm-link">
              applications →
            </Link>
          </div>
          <div className="mpm-mini">
            <Link
              href="/admin/collections/jobs?where[isOpen][equals]=true"
              className="mpm-mini__stat"
            >
              <span className="mpm-mini__value">{fmt(openJobs)}</span>
              <span className="mpm-mini__label">Open roles</span>
            </Link>
            <div className="mpm-mini__stat">
              <span className="mpm-mini__value">{fmt(totalApps)}</span>
              <span className="mpm-mini__label">Applications</span>
            </div>
            <div className="mpm-mini__stat">
              <span className="mpm-mini__value" style={{ color: '#1a9d5a' }}>
                {fmt(hired)}
              </span>
              <span className="mpm-mini__label">Hired</span>
            </div>
          </div>
          {totalApps === 0 ? (
            <p className="mpm-empty">No applications yet. Careers-page submissions land here.</p>
          ) : (
            <ul className="mpm-bars mpm-bars--tight">
              {apps.map((c) => (
                <li key={c.value} className="mpm-bar">
                  <span className="mpm-bar__label">
                    <i style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="mpm-bar__track">
                    <span
                      className="mpm-bar__fill"
                      style={{ width: `${(c.count / maxApp) * 100}%`, background: c.color }}
                    />
                  </span>
                  <span className="mpm-bar__count">{fmt(c.count)}</span>
                </li>
              ))}
            </ul>
          )}
          {recentApps.length > 0 && (
            <ul className="mpm-rows mpm-rows--sep">
              {recentApps.slice(0, 3).map((a) => {
                const meta = APP_STATUS.find((s) => s.value === a.status) ?? APP_STATUS[0]!;
                return (
                  <li key={String(a.id)} className="mpm-row">
                    <Link
                      href={`/admin/collections/job-applications/${a.id}`}
                      className="mpm-row__main"
                    >
                      <span className="mpm-row__name">{a.name || 'Unnamed'}</span>
                      <span className="mpm-row__meta">{a.position || a.email || '—'}</span>
                    </Link>
                    <span className="mpm-badge" style={{ ['--c' as string]: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="mpm-row__time">{timeAgo(a.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mpm-card">
          <div className="mpm-card__head">
            <h3>Inbox</h3>
            <Link href="/admin/collections/contact-messages" className="mpm-muted mpm-link">
              messages →
            </Link>
          </div>
          <div className="mpm-mini">
            <Link
              href="/admin/collections/contact-messages?where[status][equals]=new"
              className="mpm-mini__stat"
            >
              <span className="mpm-mini__value" style={{ color: BRAND }}>
                {fmt(msgNew)}
              </span>
              <span className="mpm-mini__label">Unread</span>
            </Link>
            <div className="mpm-mini__stat">
              <span className="mpm-mini__value">{fmt(msgHandled)}</span>
              <span className="mpm-mini__label">Handled</span>
            </div>
            <div className="mpm-mini__stat">
              <span className="mpm-mini__value">{fmt(msgNew + msgHandled)}</span>
              <span className="mpm-mini__label">Total</span>
            </div>
          </div>
          <p className="mpm-note">
            Contact-form messages arrive here. Quote requests are under <strong>Leads</strong>; job
            applicants under <strong>Careers</strong>.
          </p>
        </section>
      </div>

      {/* Content coverage */}
      <section className="mpm-card">
        <div className="mpm-card__head">
          <h3>Content coverage</h3>
          <span className="mpm-muted">what’s published in the catalogue</span>
        </div>
        <div className="mpm-chips">
          {content.map((c) => (
            <div key={c.label} className="mpm-chip">
              <span className="mpm-chip__value">{fmt(c.value)}</span>
              <span className="mpm-chip__label">{c.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const CSS = `
.mpm-dash { padding: 1.75rem clamp(1rem, 4vw, 2.5rem) 3rem; max-width: 1200px; margin-inline: auto; }
.mpm-dash__head { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
.mpm-dash__title { margin:0; font-size:1.55rem; line-height:1.1; color:var(--theme-elevation-1000); }
.mpm-dash__sub { margin:.35rem 0 0; color:var(--theme-elevation-600); font-size:.85rem; }
.mpm-dash__cta { font-size:.82rem; font-weight:600; color:#fff; background:${BRAND}; padding:.55rem .95rem; border-radius:6px; text-decoration:none; white-space:nowrap; }
.mpm-dash__cta:hover { background:#7e0311; }

.mpm-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.85rem; margin-bottom:1.1rem; }
.mpm-kpi { position:relative; overflow:hidden; display:flex; flex-direction:column; gap:.15rem; padding:1rem 1rem 1rem 1.15rem; background:var(--theme-elevation-50); border:1px solid var(--theme-elevation-100); border-radius:10px; text-decoration:none; transition:transform .12s, box-shadow .12s; }
a.mpm-kpi:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); border-color:color-mix(in srgb, var(--c) 45%, var(--theme-elevation-100)); }
.mpm-kpi--hot { background:color-mix(in srgb, var(--c) 9%, var(--theme-elevation-50)); border-color:color-mix(in srgb, var(--c) 32%, var(--theme-elevation-100)); }
.mpm-kpi__bar { position:absolute; left:0; top:0; bottom:0; width:4px; }
.mpm-kpi__label { font-size:.72rem; text-transform:uppercase; letter-spacing:.04em; color:var(--theme-elevation-600); font-weight:600; }
.mpm-kpi__value { font-size:1.85rem; font-weight:700; line-height:1; color:var(--theme-elevation-1000); }
.mpm-kpi__hint { font-size:.72rem; color:var(--theme-elevation-500); }

.mpm-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
@media (max-width:1000px){ .mpm-grid{ grid-template-columns:1fr; } }

.mpm-card { background:var(--theme-elevation-50); border:1px solid var(--theme-elevation-100); border-radius:12px; padding:1.1rem 1.25rem 1.25rem; }
.mpm-card__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.9rem; }
.mpm-card__head h3 { margin:0; font-size:1rem; color:var(--theme-elevation-1000); }
.mpm-muted { color:var(--theme-elevation-500); font-size:.78rem; }
.mpm-link { text-decoration:none; } .mpm-link:hover { color:${BRAND}; }
.mpm-empty { color:var(--theme-elevation-500); font-size:.85rem; margin:.4rem 0 0; }
.mpm-note { color:var(--theme-elevation-500); font-size:.78rem; margin:.9rem 0 0; line-height:1.5; }
.mpm-note strong { color:var(--theme-elevation-800); }

.mpm-mini { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; margin-bottom:1rem; }
.mpm-mini__stat { display:flex; flex-direction:column; align-items:center; gap:.15rem; padding:.7rem .4rem; background:var(--theme-elevation-0); border:1px solid var(--theme-elevation-100); border-radius:9px; text-decoration:none; }
a.mpm-mini__stat:hover { border-color:color-mix(in srgb, ${BRAND} 40%, var(--theme-elevation-100)); }
.mpm-mini__value { font-size:1.5rem; font-weight:700; line-height:1; color:var(--theme-elevation-1000); }
.mpm-mini__label { font-size:.7rem; color:var(--theme-elevation-600); }

.mpm-bars { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.7rem; }
.mpm-bars--tight { gap:.5rem; }
.mpm-bar { display:grid; grid-template-columns:104px 1fr 40px; align-items:center; gap:.6rem; }
.mpm-bar__label { display:flex; align-items:center; gap:.5rem; font-size:.82rem; color:var(--theme-elevation-800); }
.mpm-bar__label i { width:9px; height:9px; border-radius:50%; flex:none; }
.mpm-bar__track { height:8px; border-radius:99px; background:var(--theme-elevation-100); overflow:hidden; }
.mpm-bar__fill { display:block; height:100%; border-radius:99px; min-width:3px; }
.mpm-bar__count { text-align:right; font-weight:700; font-size:.88rem; color:var(--theme-elevation-1000); }

.mpm-rows { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
.mpm-rows--sep { margin-top:1rem; padding-top:.4rem; border-top:1px dashed var(--theme-elevation-150); }
.mpm-row { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:.7rem; padding:.5rem 0; border-top:1px solid var(--theme-elevation-100); }
.mpm-row:first-child { border-top:0; }
.mpm-row__main { display:flex; flex-direction:column; gap:.1rem; text-decoration:none; min-width:0; }
.mpm-row__name { font-weight:600; font-size:.88rem; color:var(--theme-elevation-1000); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-row__main:hover .mpm-row__name { color:${BRAND}; }
.mpm-row__meta { font-size:.74rem; color:var(--theme-elevation-500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-row__time { font-size:.72rem; color:var(--theme-elevation-450); white-space:nowrap; }
.mpm-badge { font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--c); background:color-mix(in srgb, var(--c) 14%, transparent); border:1px solid color-mix(in srgb, var(--c) 35%, transparent); padding:.15rem .5rem; border-radius:99px; white-space:nowrap; }

.mpm-chips { display:grid; grid-template-columns:repeat(auto-fit,minmax(96px,1fr)); gap:.7rem; }
.mpm-chip { display:flex; flex-direction:column; align-items:center; gap:.2rem; padding:.8rem .5rem; background:var(--theme-elevation-0); border:1px solid var(--theme-elevation-100); border-radius:9px; }
.mpm-chip__value { font-size:1.4rem; font-weight:700; color:var(--theme-elevation-1000); line-height:1; }
.mpm-chip__label { font-size:.72rem; color:var(--theme-elevation-600); }
`;
