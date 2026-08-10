import type { Payload } from 'payload';
import Link from 'next/link';

/**
 * Full dashboard VIEW (admin.components.views.dashboard) — replaces Payload's default
 * dashboard so the redundant collection-group cards are gone (the sidebar already lists
 * them). A server component: it reads live counts through the local API, every query
 * guarded so one failure degrades a single card. Sales (leads) + Careers (job openings /
 * applications) + Inbox (messages) + content coverage.
 *
 * Visual language: a "Dropify"-style dashboard — soft elevated cards on a lavender wash,
 * dark circular icon badges, one violet-gradient hero KPI, big bold numbers. The palette
 * is layered over Payload's theme tokens so it stays coherent in light AND dark mode.
 * DATA AND BEHAVIOUR ARE UNCHANGED — this pass is purely the design.
 */

const LEAD_STATUS = [
  { value: 'new', label: 'New', color: '#6D5AE6' },
  { value: 'contacted', label: 'Contacted', color: '#2f6df6' },
  { value: 'quoted', label: 'Quoted', color: '#c98a00' },
  { value: 'won', label: 'Won', color: '#1a9d5a' },
  { value: 'lost', label: 'Lost', color: '#8a8f98' },
];
const APP_STATUS = [
  { value: 'new', label: 'New', color: '#6D5AE6' },
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
const initial = (s?: string): string => (s || '?').trim().charAt(0).toUpperCase() || '?';
function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

/* Inline stroke icons (currentColor). Kept tiny so the badge, not the glyph, carries weight. */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
const ICONS: Record<string, React.JSX.Element> = {
  leads: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...S}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.7-5 5.5-5s5.5 2 5.5 5" />
      <path d="M18 7.5v5M15.5 10h5" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...S}>
      <rect x="3" y="7" width="18" height="12" rx="2.5" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...S}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </svg>
  ),
  won: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...S}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4.5v1A2.5 2.5 0 0 0 7 8.5M17 5h2.5v1A2.5 2.5 0 0 1 17 8.5" />
      <path d="M12 13v3M9.5 20h5M10.5 20l.4-3.5M13.5 20l-.4-3.5" />
    </svg>
  ),
  moves: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...S}>
      <path d="M3 7.5h11v8H3zM14 10.5h4l3 3v2h-7z" />
      <circle cx="7.5" cy="17" r="1.6" />
      <circle cx="17.5" cy="17" r="1.6" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="20" height="20" {...S}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  funnel: (
    <svg viewBox="0 0 24 24" width="18" height="18" {...S}>
      <path d="M4 5.5h16l-6 7v6l-4 2v-8z" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" width="18" height="18" {...S}>
      <path d="M8.5 7h11M8.5 12h11M8.5 17h11" />
      <circle cx="4.7" cy="7" r="1" />
      <circle cx="4.7" cy="12" r="1" />
      <circle cx="4.7" cy="17" r="1" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" width="18" height="18" {...S}>
      <path d="M12 4l8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" width="16" height="16" {...S}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

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
      icon: 'leads',
      hero: true,
      href: '/admin/collections/leads?where[status][equals]=new',
    },
    {
      label: 'New applications',
      value: fmt(newApps),
      hint: `${fmt(totalApps)} all time`,
      icon: 'briefcase',
      hot: newApps > 0,
      href: '/admin/collections/job-applications',
    },
    {
      label: 'Unread messages',
      value: fmt(msgNew),
      hint: 'from the contact form',
      icon: 'inbox',
      hot: msgNew > 0,
      href: '/admin/collections/contact-messages',
    },
    {
      label: 'Won',
      value: fmt(won),
      hint: winRate != null ? `${winRate}% win rate` : 'no wins yet',
      icon: 'won',
      href: '/admin/collections/leads?where[status][equals]=won',
    },
    {
      label: 'Moves logged',
      value: fmt(totalMoves),
      hint: 'from jobs data',
      icon: 'moves',
      href: '/admin/collections/jobs-stats',
    },
    {
      label: 'On-time',
      value: onTimeAvg != null ? `${onTimeAvg}%` : '—',
      hint: 'avg across cities',
      icon: 'clock',
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
          View all leads {ICONS.arrow}
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mpm-kpis">
        {kpis.map((k) => {
          const cls = `mpm-kpi${k.hero ? ' mpm-kpi--hero' : ''}${k.hot ? ' mpm-kpi--hot' : ''}`;
          const inner = (
            <>
              {k.hero && <span className="mpm-kpi__glow" aria-hidden="true" />}
              <span className={`mpm-ico${k.hero ? ' mpm-ico--ghost' : ''}`} aria-hidden="true">
                {ICONS[k.icon]}
              </span>
              <span className="mpm-kpi__label">{k.label}</span>
              <span className="mpm-kpi__value">{k.value}</span>
              <span className="mpm-kpi__hint">{k.hint}</span>
            </>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={k.label} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Sales: pipeline + recent leads */}
      <div className="mpm-grid">
        <section className="mpm-card">
          <div className="mpm-card__head">
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.funnel}
              </span>
              Lead pipeline
            </h3>
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
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.list}
              </span>
              Recent leads
            </h3>
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
                    <span className="mpm-avatar" aria-hidden="true">
                      {initial(l.name)}
                    </span>
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
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.briefcase}
              </span>
              Careers
            </h3>
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
                    <span className="mpm-avatar" aria-hidden="true">
                      {initial(a.name)}
                    </span>
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
            <h3>
              <span className="mpm-card__ico" aria-hidden="true">
                {ICONS.inbox}
              </span>
              Inbox
            </h3>
            <Link href="/admin/collections/contact-messages" className="mpm-muted mpm-link">
              messages →
            </Link>
          </div>
          <div className="mpm-mini">
            <Link
              href="/admin/collections/contact-messages?where[status][equals]=new"
              className="mpm-mini__stat"
            >
              <span className="mpm-mini__value" style={{ color: '#6D5AE6' }}>
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
          <h3>
            <span className="mpm-card__ico" aria-hidden="true">
              {ICONS.layers}
            </span>
            Content coverage
          </h3>
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
.mpm-dash {
  --v-100:#ECE8FB; --v-300:#A99BF0; --v-400:#8B7CF0; --v-500:#6D5AE6; --v-600:#5A46D6; --v-700:#4A38B5;
  --ico-bg:#17162A; --ico-fg:#ffffff;
  --card-radius:20px;
  --card-shadow:0 18px 40px -24px color-mix(in srgb, var(--v-700) 55%, transparent), 0 2px 6px -2px rgba(20,18,45,.05);
  padding: 1.9rem clamp(1rem, 4vw, 2.5rem) 3.5rem;
  max-width: 1240px; margin-inline: auto;
  background: radial-gradient(120% 340px at 78% -40px, color-mix(in srgb, var(--v-500) 16%, var(--theme-bg)) 0%, transparent 70%), var(--theme-bg);
}
[data-theme="dark"] .mpm-dash { --ico-bg:linear-gradient(140deg,var(--v-400),var(--v-600)); }

.mpm-dash__head { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.4rem; }
.mpm-dash__title { margin:0; font-size:1.7rem; line-height:1.05; letter-spacing:-.02em; font-weight:800; color:var(--theme-elevation-1000); }
.mpm-dash__sub { margin:.4rem 0 0; color:var(--theme-elevation-600); font-size:.85rem; }
.mpm-dash__cta { display:inline-flex; align-items:center; gap:.4rem; font-size:.82rem; font-weight:600; color:#fff; background:linear-gradient(140deg,var(--v-400),var(--v-600)); padding:.62rem 1.05rem; border-radius:99px; text-decoration:none; white-space:nowrap; box-shadow:0 10px 22px -12px color-mix(in srgb, var(--v-600) 80%, transparent); transition:transform .12s, box-shadow .12s; }
.mpm-dash__cta:hover { transform:translateY(-1px); box-shadow:0 14px 26px -12px color-mix(in srgb, var(--v-600) 90%, transparent); }
.mpm-dash__cta svg { width:15px; height:15px; }

.mpm-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.15rem; }
@media (max-width:860px){ .mpm-kpis{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px){ .mpm-kpis{ grid-template-columns:1fr; } }
.mpm-kpi { position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:flex-start; gap:.35rem; padding:1.15rem 1.2rem 1.25rem; background:var(--theme-elevation-0); border:1px solid color-mix(in srgb, var(--v-500) 10%, var(--theme-elevation-100)); border-radius:var(--card-radius); text-decoration:none; box-shadow:var(--card-shadow); transition:transform .14s, box-shadow .14s, border-color .14s; }
a.mpm-kpi:hover { transform:translateY(-3px); border-color:color-mix(in srgb, var(--v-500) 45%, transparent); box-shadow:0 22px 44px -22px color-mix(in srgb, var(--v-700) 70%, transparent); }
.mpm-kpi--hot { background:color-mix(in srgb, var(--v-500) 6%, var(--theme-elevation-0)); border-color:color-mix(in srgb, var(--v-500) 26%, transparent); }
.mpm-kpi__label { font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; color:var(--theme-elevation-600); font-weight:600; }
.mpm-kpi__value { font-size:2.15rem; font-weight:800; line-height:1; letter-spacing:-.02em; color:var(--theme-elevation-1000); }
.mpm-kpi__hint { font-size:.74rem; color:var(--theme-elevation-500); }

.mpm-ico { display:grid; place-items:center; width:44px; height:44px; border-radius:50%; margin-bottom:.55rem; background:var(--ico-bg); color:var(--ico-fg); flex:none; }
.mpm-ico svg { width:20px; height:20px; }

/* Hero KPI — the one bold, violet-gradient card (echoes the reference's purple order card). */
.mpm-kpi--hero { color:#fff; border:none; background:linear-gradient(140deg,#8B7CF0 0%,#6D5AE6 52%,#5A46D6 100%); box-shadow:0 22px 46px -20px color-mix(in srgb, var(--v-600) 85%, transparent); }
.mpm-kpi--hero .mpm-kpi__label { color:rgba(255,255,255,.82); }
.mpm-kpi--hero .mpm-kpi__value { color:#fff; font-size:2.5rem; }
.mpm-kpi--hero .mpm-kpi__hint { color:rgba(255,255,255,.78); }
a.mpm-kpi--hero:hover { border:none; box-shadow:0 26px 52px -20px color-mix(in srgb, var(--v-600) 95%, transparent); }
.mpm-ico--ghost { background:rgba(255,255,255,.20); color:#fff; }
.mpm-kpi__glow { position:absolute; right:-40px; top:-56px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle, rgba(255,255,255,.28), transparent 62%); pointer-events:none; }

.mpm-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
@media (max-width:1000px){ .mpm-grid{ grid-template-columns:1fr; } }

.mpm-card { background:var(--theme-elevation-0); border:1px solid color-mix(in srgb, var(--v-500) 9%, var(--theme-elevation-100)); border-radius:var(--card-radius); padding:1.35rem 1.45rem 1.45rem; box-shadow:var(--card-shadow); }
.mpm-card__head { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:1.05rem; }
.mpm-card__head h3 { display:flex; align-items:center; gap:.55rem; margin:0; font-size:1.02rem; font-weight:700; letter-spacing:-.01em; color:var(--theme-elevation-1000); }
.mpm-card__ico { display:grid; place-items:center; width:30px; height:30px; border-radius:9px; background:color-mix(in srgb, var(--v-500) 13%, transparent); color:var(--v-500); flex:none; }
.mpm-card__ico svg { width:17px; height:17px; }
[data-theme="dark"] .mpm-card__ico { color:var(--v-300); background:color-mix(in srgb, var(--v-400) 22%, transparent); }
.mpm-muted { color:var(--theme-elevation-500); font-size:.78rem; }
.mpm-link { text-decoration:none; } .mpm-link:hover { color:var(--v-500); }
.mpm-empty { color:var(--theme-elevation-500); font-size:.85rem; margin:.4rem 0 0; }
.mpm-note { color:var(--theme-elevation-500); font-size:.78rem; margin:1rem 0 0; line-height:1.55; }
.mpm-note strong { color:var(--theme-elevation-800); }

.mpm-mini { display:grid; grid-template-columns:repeat(3,1fr); gap:.65rem; margin-bottom:1.1rem; }
.mpm-mini__stat { display:flex; flex-direction:column; align-items:center; gap:.2rem; padding:.85rem .4rem; background:color-mix(in srgb, var(--v-500) 5%, var(--theme-elevation-0)); border:1px solid color-mix(in srgb, var(--v-500) 10%, var(--theme-elevation-100)); border-radius:14px; text-decoration:none; transition:border-color .12s, transform .12s; }
a.mpm-mini__stat:hover { border-color:color-mix(in srgb, var(--v-500) 42%, transparent); transform:translateY(-1px); }
.mpm-mini__value { font-size:1.55rem; font-weight:800; line-height:1; letter-spacing:-.01em; color:var(--theme-elevation-1000); }
.mpm-mini__label { font-size:.7rem; color:var(--theme-elevation-600); }

.mpm-bars { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.75rem; }
.mpm-bars--tight { gap:.55rem; }
.mpm-bar { display:grid; grid-template-columns:104px 1fr 40px; align-items:center; gap:.65rem; }
.mpm-bar__label { display:flex; align-items:center; gap:.5rem; font-size:.82rem; color:var(--theme-elevation-800); }
.mpm-bar__label i { width:9px; height:9px; border-radius:50%; flex:none; }
.mpm-bar__track { height:9px; border-radius:99px; background:color-mix(in srgb, var(--v-500) 12%, var(--theme-elevation-100)); overflow:hidden; }
.mpm-bar__fill { display:block; height:100%; border-radius:99px; min-width:3px; }
.mpm-bar__count { text-align:right; font-weight:700; font-size:.88rem; color:var(--theme-elevation-1000); }

.mpm-rows { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
.mpm-rows--sep { margin-top:1.1rem; padding-top:.5rem; border-top:1px dashed var(--theme-elevation-150); }
.mpm-row { display:grid; grid-template-columns:auto 1fr auto auto; align-items:center; gap:.7rem; padding:.55rem 0; border-top:1px solid var(--theme-elevation-100); }
.mpm-row:first-child { border-top:0; }
.mpm-avatar { display:grid; place-items:center; width:34px; height:34px; border-radius:50%; flex:none; font-size:.82rem; font-weight:700; color:#fff; background:linear-gradient(140deg,var(--v-400),var(--v-600)); }
.mpm-row__main { display:flex; flex-direction:column; gap:.1rem; text-decoration:none; min-width:0; }
.mpm-row__name { font-weight:600; font-size:.88rem; color:var(--theme-elevation-1000); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-row__main:hover .mpm-row__name { color:var(--v-500); }
.mpm-row__meta { font-size:.74rem; color:var(--theme-elevation-500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-row__time { font-size:.72rem; color:var(--theme-elevation-450); white-space:nowrap; }
.mpm-badge { font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--c); background:color-mix(in srgb, var(--c) 14%, transparent); border:1px solid color-mix(in srgb, var(--c) 35%, transparent); padding:.15rem .5rem; border-radius:99px; white-space:nowrap; }

.mpm-chips { display:grid; grid-template-columns:repeat(auto-fit,minmax(104px,1fr)); gap:.75rem; }
.mpm-chip { display:flex; flex-direction:column; align-items:center; gap:.25rem; padding:1rem .5rem; background:color-mix(in srgb, var(--v-500) 5%, var(--theme-elevation-0)); border:1px solid color-mix(in srgb, var(--v-500) 10%, var(--theme-elevation-100)); border-radius:14px; }
.mpm-chip__value { font-size:1.5rem; font-weight:800; letter-spacing:-.01em; color:var(--theme-elevation-1000); line-height:1; }
.mpm-chip__label { font-size:.72rem; color:var(--theme-elevation-600); }
`;
