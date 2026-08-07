import type { ServerProps } from 'payload';
import Link from 'next/link';

/**
 * Analytics overview rendered above the default dashboard (admin.components.beforeDashboard).
 * A server component: it reads live counts through the Payload local API. Every query is
 * guarded so a single failure degrades one card, never the whole admin. Styling uses
 * Payload's theme variables (light/dark aware) with the brand maroon as the accent.
 */

const BRAND = '#990010';
const NAVY = '#092341';

const STATUS_META = [
  { value: 'new', label: 'New', color: BRAND },
  { value: 'contacted', label: 'Contacted', color: '#2f6df6' },
  { value: 'quoted', label: 'Quoted', color: '#c98a00' },
  { value: 'won', label: 'Won', color: '#1a9d5a' },
  { value: 'lost', label: 'Lost', color: '#8a8f98' },
];

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
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
interface JobDoc {
  count?: number;
  onTimePct?: number;
}

export async function AnalyticsDashboard(props: ServerProps): Promise<React.JSX.Element | null> {
  const payload = props?.payload;
  if (!payload) return null;

  const count = (collection: string, where?: unknown): Promise<{ totalDocs: number }> =>
    safe(
      () =>
        payload.count({
          collection: collection as never,
          where: where as never,
          overrideAccess: true,
        }),
      { totalDocs: 0 },
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

  const [leadCounts, recentDocs, cities, localities, services, reviews, guides, faqs, jobDocsRaw] =
    await Promise.all([
      Promise.all(STATUS_META.map((s) => count('leads', { status: { equals: s.value } }))),
      findDocs('leads', { limit: 6, sort: '-createdAt', depth: 0 }),
      count('locations', { type: { equals: 'city' } }),
      count('locations', { type: { equals: 'locality' } }),
      count('services'),
      count('reviews'),
      count('guides'),
      count('faqs'),
      findDocs('jobs-stats', { limit: 500, depth: 0 }),
    ]);

  const counts = STATUS_META.map((s, i) => ({ ...s, count: leadCounts[i]?.totalDocs ?? 0 }));
  const totalLeads = counts.reduce((a, c) => a + c.count, 0);
  const newCount = counts.find((c) => c.value === 'new')?.count ?? 0;
  const won = counts.find((c) => c.value === 'won')?.count ?? 0;
  const decided = won + (counts.find((c) => c.value === 'lost')?.count ?? 0);
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : null;
  const maxStatus = Math.max(1, ...counts.map((c) => c.count));

  const jobDocs = jobDocsRaw as JobDoc[];
  const totalMoves = jobDocs.reduce((a, d) => a + (Number(d.count) || 0), 0);
  const onTimeVals = jobDocs.map((d) => Number(d.onTimePct)).filter((n) => !Number.isNaN(n));
  const onTimeAvg = onTimeVals.length
    ? Math.round(onTimeVals.reduce((a, b) => a + b, 0) / onTimeVals.length)
    : null;

  const recentLeads = recentDocs as LeadDoc[];

  const kpis = [
    { label: 'Total leads', value: fmt(totalLeads), hint: 'all time', accent: BRAND },
    {
      label: 'New / unworked',
      value: fmt(newCount),
      hint: 'need a first call',
      accent: BRAND,
      lead: true,
    },
    {
      label: 'Won',
      value: fmt(won),
      hint: winRate != null ? `${winRate}% win rate` : 'no wins yet',
      accent: '#1a9d5a',
    },
    { label: 'Moves logged', value: fmt(totalMoves), hint: 'from jobs data', accent: NAVY },
    {
      label: 'On-time',
      value: onTimeAvg != null ? `${onTimeAvg}%` : '—',
      hint: 'avg across cities',
      accent: NAVY,
    },
  ];

  const content = [
    { label: 'Cities', value: cities.totalDocs },
    { label: 'Localities', value: localities.totalDocs },
    { label: 'Services', value: services.totalDocs },
    { label: 'Reviews', value: reviews.totalDocs },
    { label: 'Guides', value: guides.totalDocs },
    { label: 'FAQs', value: faqs.totalDocs },
  ];

  return (
    <div className="mpm-dash">
      <style>{CSS}</style>

      <div className="mpm-dash__head">
        <div>
          <h2 className="mpm-dash__title">Operations overview</h2>
          <p className="mpm-dash__sub">Live from your data — leads, pipeline, and coverage.</p>
        </div>
        <Link href="/admin/collections/leads" className="mpm-dash__cta">
          View all leads →
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mpm-kpis">
        {kpis.map((k) => (
          <div key={k.label} className={`mpm-kpi${k.lead ? ' mpm-kpi--lead' : ''}`}>
            <span className="mpm-kpi__bar" style={{ background: k.accent }} />
            <span className="mpm-kpi__label">{k.label}</span>
            <span className="mpm-kpi__value">{k.value}</span>
            <span className="mpm-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      <div className="mpm-grid">
        {/* Lead pipeline */}
        <section className="mpm-card mpm-pipe">
          <div className="mpm-card__head">
            <h3>Lead pipeline</h3>
            <span className="mpm-muted">{fmt(totalLeads)} total</span>
          </div>
          {totalLeads === 0 ? (
            <p className="mpm-empty">
              No leads yet. Submissions from the site’s quote form will appear here.
            </p>
          ) : (
            <ul className="mpm-pipe__list">
              {counts.map((c) => (
                <li key={c.value} className="mpm-pipe__row">
                  <span className="mpm-pipe__label">
                    <i style={{ background: c.color }} />
                    {c.label}
                  </span>
                  <span className="mpm-pipe__track">
                    <span
                      className="mpm-pipe__fill"
                      style={{ width: `${(c.count / maxStatus) * 100}%`, background: c.color }}
                    />
                  </span>
                  <span className="mpm-pipe__count">{fmt(c.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent leads */}
        <section className="mpm-card mpm-recent">
          <div className="mpm-card__head">
            <h3>Recent leads</h3>
            <Link href="/admin/collections/leads" className="mpm-muted mpm-link">
              open collection
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mpm-empty">Nothing yet.</p>
          ) : (
            <ul className="mpm-recent__list">
              {recentLeads.map((l) => {
                const meta = STATUS_META.find((s) => s.value === l.status) ?? STATUS_META[0]!;
                return (
                  <li key={String(l.id)} className="mpm-recent__row">
                    <Link href={`/admin/collections/leads/${l.id}`} className="mpm-recent__main">
                      <span className="mpm-recent__name">{l.name || 'Unnamed'}</span>
                      <span className="mpm-recent__meta">
                        {[l.service, l.pickup].filter(Boolean).join(' · ') || l.phone || '—'}
                      </span>
                    </Link>
                    <span className="mpm-badge" style={{ ['--c' as string]: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="mpm-recent__time">{timeAgo(l.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Content coverage */}
      <section className="mpm-card">
        <div className="mpm-card__head">
          <h3>Content coverage</h3>
          <span className="mpm-muted">what’s in the catalogue</span>
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
.mpm-dash { margin-bottom: 2.5rem; }
.mpm-dash__head { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.1rem; }
.mpm-dash__title { margin:0; font-size:1.4rem; line-height:1.1; color:var(--theme-elevation-1000); }
.mpm-dash__sub { margin:.3rem 0 0; color:var(--theme-elevation-600); font-size:.85rem; }
.mpm-dash__cta { font-size:.82rem; font-weight:600; color:#fff; background:${BRAND}; padding:.5rem .9rem; border-radius:6px; text-decoration:none; white-space:nowrap; }
.mpm-dash__cta:hover { background:#7e0311; }

.mpm-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.85rem; margin-bottom:1rem; }
.mpm-kpi { position:relative; overflow:hidden; display:flex; flex-direction:column; gap:.15rem; padding:1rem 1rem 1rem 1.1rem; background:var(--theme-elevation-50); border:1px solid var(--theme-elevation-100); border-radius:10px; }
.mpm-kpi--lead { background:color-mix(in srgb, ${BRAND} 8%, var(--theme-elevation-50)); border-color:color-mix(in srgb, ${BRAND} 30%, var(--theme-elevation-100)); }
.mpm-kpi__bar { position:absolute; left:0; top:0; bottom:0; width:4px; }
.mpm-kpi__label { font-size:.72rem; text-transform:uppercase; letter-spacing:.04em; color:var(--theme-elevation-600); font-weight:600; }
.mpm-kpi__value { font-size:1.8rem; font-weight:700; line-height:1; color:var(--theme-elevation-1000); }
.mpm-kpi__hint { font-size:.72rem; color:var(--theme-elevation-500); }

.mpm-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
@media (max-width:1024px){ .mpm-grid{ grid-template-columns:1fr; } }

.mpm-card { background:var(--theme-elevation-50); border:1px solid var(--theme-elevation-100); border-radius:12px; padding:1.1rem 1.25rem 1.25rem; }
.mpm-card__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:.9rem; }
.mpm-card__head h3 { margin:0; font-size:1rem; color:var(--theme-elevation-1000); }
.mpm-muted { color:var(--theme-elevation-500); font-size:.78rem; }
.mpm-link { text-decoration:none; } .mpm-link:hover { color:${BRAND}; }
.mpm-empty { color:var(--theme-elevation-500); font-size:.85rem; margin:.4rem 0 0; }

.mpm-pipe__list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.7rem; }
.mpm-pipe__row { display:grid; grid-template-columns:110px 1fr 44px; align-items:center; gap:.6rem; }
.mpm-pipe__label { display:flex; align-items:center; gap:.5rem; font-size:.85rem; color:var(--theme-elevation-800); }
.mpm-pipe__label i { width:9px; height:9px; border-radius:50%; flex:none; }
.mpm-pipe__track { height:8px; border-radius:99px; background:var(--theme-elevation-100); overflow:hidden; }
.mpm-pipe__fill { display:block; height:100%; border-radius:99px; min-width:3px; transition:width .3s; }
.mpm-pipe__count { text-align:right; font-weight:700; font-size:.9rem; color:var(--theme-elevation-1000); }

.mpm-recent__list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
.mpm-recent__row { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:.75rem; padding:.55rem 0; border-top:1px solid var(--theme-elevation-100); }
.mpm-recent__row:first-child { border-top:0; }
.mpm-recent__main { display:flex; flex-direction:column; gap:.1rem; text-decoration:none; min-width:0; }
.mpm-recent__name { font-weight:600; font-size:.9rem; color:var(--theme-elevation-1000); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-recent__main:hover .mpm-recent__name { color:${BRAND}; }
.mpm-recent__meta { font-size:.75rem; color:var(--theme-elevation-500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mpm-recent__time { font-size:.72rem; color:var(--theme-elevation-450); white-space:nowrap; }
.mpm-badge { font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--c); background:color-mix(in srgb, var(--c) 14%, transparent); border:1px solid color-mix(in srgb, var(--c) 35%, transparent); padding:.15rem .5rem; border-radius:99px; white-space:nowrap; }

.mpm-chips { display:grid; grid-template-columns:repeat(auto-fit,minmax(96px,1fr)); gap:.7rem; }
.mpm-chip { display:flex; flex-direction:column; align-items:center; gap:.2rem; padding:.8rem .5rem; background:var(--theme-elevation-0); border:1px solid var(--theme-elevation-100); border-radius:9px; }
.mpm-chip__value { font-size:1.4rem; font-weight:700; color:var(--theme-elevation-1000); line-height:1; }
.mpm-chip__label { font-size:.72rem; color:var(--theme-elevation-600); }
`;
