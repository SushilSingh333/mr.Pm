import { MIcon } from '../icons/MIcon.js';
import type { Review, ReviewBucket } from './lead-status.js';

/**
 * The lead review, drawn two ways from one `Review` (see `buildReview` in lead-status).
 *
 *   ReviewDonut  one set of leads, drawn. The salesperson's own board uses it directly;
 *                ReviewExplorer wraps it with "whose" and "when" controls for the team
 *                review and a salesperson's page under Users.
 *
 * Plain components - no hooks, no server-only imports - because the dashboards render on
 * the server and the Users page renders in the browser, and both draw the same chart.
 *
 *
 * Colour never works alone here. Every slice and segment carries its name, an icon, a
 * count and a share in text beside it; the colour only says which is which at a glance.
 */

const fmt = (n: number): string => n.toLocaleString('en-IN');

/** An annular sector from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise). */
function sector(cx: number, cy: number, R: number, r: number, a0: number, a1: number): string {
  const pt = (rad: number, ang: number): string =>
    `${(cx + rad * Math.sin(ang)).toFixed(2)} ${(cy - rad * Math.cos(ang)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${pt(R, a0)}`,
    `A ${R} ${R} 0 ${large} 1 ${pt(R, a1)}`,
    `L ${pt(r, a1)}`,
    `A ${r} ${r} 0 ${large} 0 ${pt(r, a0)}`,
    'Z',
  ].join(' ');
}

interface DonutProps {
  review: Review;
  /** Card heading, e.g. "Your lead review". */
  title: string;
  /** The window the counts cover, e.g. "This month". */
  period: string;
  /** Where each slice leads - usually the board filtered to that slice's stages. */
  links?: Partial<Record<ReviewBucket['key'], string>>;
  /** Where "waiting for a first call" leads. */
  pendingHref?: string;
  /** The slice the board is currently filtered to, if any. */
  selected?: ReviewBucket['key'];
  /** Optional controls (a period switch) placed in the card head. */
  controls?: React.ReactNode;
  /** Render the card chrome. Off inside a Payload field, which has its own. */
  card?: boolean;
  /** Anything to show under the ring - the review explorer's trend chips. */
  below?: React.ReactNode;
}

const SIZE = 184;
const R = 88;
const r = 62;
/** A 2px gap between slices, measured on the outer edge. */
const GAP = 2 / R;

export function ReviewDonut({
  review,
  title,
  period,
  links = {},
  pendingHref,
  selected,
  controls,
  card = true,
  below,
}: DonutProps): React.JSX.Element {
  const c = SIZE / 2;
  const live = review.slices.filter((s) => s.count > 0);
  let angle = 0;
  const arcs = review.slices.map((s) => {
    const span = review.reviewed ? (s.count / review.reviewed) * Math.PI * 2 : 0;
    const a0 = angle;
    angle += span;
    return { s, a0, a1: angle };
  });
  const summary = review.reviewed
    ? `${review.score}% of ${review.reviewed} reviewed leads qualified. ` +
      review.slices.map((s) => `${s.bucket.label}: ${s.count} (${s.pct}%)`).join(', ') +
      '.'
    : 'No leads to review in this period.';

  const body = (
    <div className={`mpm-rv${selected ? ' has-selection' : ''}`}>
      <div className="mpm-rv__chartcol">
        <div className="mpm-rv__chart">
          <svg
            className="mpm-rv__ring"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label={summary}
          >
            {review.reviewed === 0 ? (
              <circle
                cx={c}
                cy={c}
                r={(R + r) / 2}
                fill="none"
                strokeWidth={R - r}
                className="mpm-rv__empty"
              />
            ) : (
              arcs
                .filter(({ s }) => s.count > 0)
                .map(({ s, a0, a1 }, i) => {
                  const href = links[s.bucket.key];
                  // One slice that is the whole ring is a circle: a sector from 0 to 2π
                  // has the same start and end point, which SVG draws as nothing.
                  const shape =
                    live.length === 1 ? (
                      <circle
                        cx={c}
                        cy={c}
                        r={(R + r) / 2}
                        fill="none"
                        stroke={s.bucket.color}
                        strokeWidth={R - r}
                      />
                    ) : (
                      <path
                        d={sector(c, c, R, r, a0 + GAP / 2, Math.max(a0 + GAP / 2, a1 - GAP / 2))}
                        fill={s.bucket.color}
                      />
                    );
                  const tip = `${s.bucket.label}: ${fmt(s.count)} (${s.pct}%)`;
                  return (
                    <g
                      key={s.bucket.key}
                      data-k={s.bucket.key}
                      // The slices grow in one after another: --i staggers them.
                      style={{ ['--i' as string]: i }}
                      className={`mpm-rv__slice${selected === s.bucket.key ? ' is-on' : ''}`}
                    >
                      {href ? (
                        <a href={href} aria-label={tip}>
                          <title>{tip}</title>
                          {shape}
                        </a>
                      ) : (
                        <>
                          <title>{tip}</title>
                          {shape}
                        </>
                      )}
                    </g>
                  );
                })
            )}
          </svg>
          <div className="mpm-rv__centre" aria-hidden="true">
            {review.score == null ? (
              <span className="mpm-rv__none">No leads yet</span>
            ) : (
              <>
                {/* The headline, and - shown instead of it while a slice or its legend row is
                  hovered - that slice's own share. Pure CSS (:has), so it works on the
                  server-rendered board as well as inside the explorer. */}
                <span className="mpm-rv__c mpm-rv__c--all">
                  <strong>{review.score}%</strong>
                  <span>qualified</span>
                  <small>of {fmt(review.reviewed)}</small>
                </span>
                {review.slices.map((s) => (
                  <span key={s.bucket.key} className={`mpm-rv__c mpm-rv__c--${s.bucket.key}`}>
                    <strong>{s.pct}%</strong>
                    <span>{s.bucket.label.toLowerCase()}</span>
                    <small>
                      {fmt(s.count)} of {fmt(review.reviewed)}
                    </small>
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
        {below}
      </div>

      <ul className="mpm-rv__legend">
        {review.slices.map((s) => {
          const href = links[s.bucket.key];
          const inner = (
            <>
              <span
                className="mpm-rv__ico"
                style={{ ['--c' as string]: s.bucket.color }}
                aria-hidden="true"
              >
                <MIcon name={s.bucket.icon} size={16} />
              </span>
              <span className="mpm-rv__name">{s.bucket.label}</span>
              <span className="mpm-rv__num">
                <b>{fmt(s.count)}</b>
                <i>{s.pct}%</i>
              </span>
              <span className="mpm-rv__parts">
                {s.stages.length === 0
                  ? 'none'
                  : s.stages.map((st) => (
                      <span key={st.value} className="mpm-rv__part">
                        <i style={{ background: st.color }} aria-hidden="true" />
                        {st.label} {fmt(st.count)}
                      </span>
                    ))}
              </span>
            </>
          );
          return (
            <li
              key={s.bucket.key}
              data-k={s.bucket.key}
              className={`mpm-rv__row${selected === s.bucket.key ? ' is-on' : ''}`}
              title={s.bucket.hint}
            >
              {href ? (
                <a href={href} aria-label={`${s.bucket.label}: ${fmt(s.count)} leads - open them`}>
                  {inner}
                  <span className="mpm-rv__go" aria-hidden="true">
                    <MIcon name="chevron_right" size={18} />
                  </span>
                </a>
              ) : (
                <div>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      {review.pending > 0 && (
        <p className="mpm-rv__pending">
          {pendingHref ? (
            <a href={pendingHref}>
              {fmt(review.pending)} {review.pending === 1 ? 'lead' : 'leads'} waiting for a first
              call
            </a>
          ) : (
            <>
              {fmt(review.pending)} {review.pending === 1 ? 'lead' : 'leads'} waiting for a first
              call
            </>
          )}{' '}
          <span>- not counted until someone has spoken to them</span>
        </p>
      )}
    </div>
  );

  if (!card) return body;
  return (
    <article className="mpm-card mpm-rv-card">
      <div className="mpm-card__head">
        <h3>
          <span className="mpm-card__ico" aria-hidden="true">
            <MIcon name="analytics" size={20} />
          </span>
          {title}
        </h3>
        {controls ?? <span className="mpm-muted">{period}</span>}
      </div>
      {body}
    </article>
  );
}

/** Below this share, with enough leads to mean something, a person is flagged. */
export const COACH_BELOW = 30;
export const COACH_MIN = 5;

/** Is this person below the line, with enough leads for that to mean something? */
export const needsCoaching = (review: Review): boolean =>
  review.score != null && review.reviewed >= COACH_MIN && review.score < COACH_BELOW;

/**
 * The review's own sheet, scoped under its own classes so it reads the same on a
 * dashboard and inside a Payload form. Sizes in px, not rem: Payload sets the root to
 * 13px, which would shrink anything relative to it (see the note atop EXTRA_CSS).
 */
/** Hover links, one block per slice: hovering a slice or its legend row lights both. */
const LINKED_HOVER = ['qualified', 'improve', 'lost']
  .map(
    (k) => `
.mpm-rv:has([data-k="${k}"]:hover) .mpm-rv__slice:not([data-k="${k}"]) :is(path,circle),
.mpm-rv:has([data-k="${k}"] :focus-visible) .mpm-rv__slice:not([data-k="${k}"]) :is(path,circle){ opacity:.28; }
.mpm-rv:has([data-k="${k}"]:hover) .mpm-rv__slice[data-k="${k}"] path,
.mpm-rv:has([data-k="${k}"] :focus-visible) .mpm-rv__slice[data-k="${k}"] path{ transform:scale(1.04); }
.mpm-rv:has([data-k="${k}"]:hover) .mpm-rv__row[data-k="${k}"] > :is(a,div),
.mpm-rv:has([data-k="${k}"] :focus-visible) .mpm-rv__row[data-k="${k}"] > :is(a,div){ background:var(--mpm-hover,rgba(31,31,31,.06)); }
.mpm-rv:has([data-k="${k}"]:hover) .mpm-rv__c--all,
.mpm-rv:has([data-k="${k}"] :focus-visible) .mpm-rv__c--all{ opacity:0; transform:scale(.96); }
.mpm-rv:has([data-k="${k}"]:hover) .mpm-rv__c--${k},
.mpm-rv:has([data-k="${k}"] :focus-visible) .mpm-rv__c--${k}{ opacity:1; transform:none; }`,
  )
  .join('\n');

/**
 * The review's own sheet, scoped under its own classes so it reads the same on a
 * dashboard and inside a Payload form. Sizes in px, not rem: Payload sets the root to
 * 13px, which would shrink anything relative to it (see the note atop EXTRA_CSS).
 *
 * Motion is Material's: short, decelerating, and off entirely for anyone who asked their
 * system for reduced motion.
 */
export const REVIEW_CSS = `
.mpm-rv,.mpm-rx{
  --rv-qualified:#188038; --rv-improve:#F2A600; --rv-lost:#D93025;
  --rv-ink:var(--mpm-ink,#1F1F1F); --rv-ink-2:var(--mpm-ink-2,#444746);
  --rv-ink-3:var(--mpm-ink-3,#747775); --rv-line:var(--mpm-line,#E1E3E1);
  --rv-paper:var(--mpm-paper,#fff); --rv-hover:var(--mpm-hover,rgba(31,31,31,.06));
  --rv-ease:cubic-bezier(.2,0,0,1);
}
[data-theme="dark"] .mpm-rv,[data-theme="dark"] .mpm-rx{
  --rv-qualified:#34A853; --rv-improve:#FDD663; --rv-lost:#F28B82;
}
.mpm-rv{ display:grid; grid-template-columns:auto 1fr; gap:20px 36px; align-items:center; }
.mpm-rv__chartcol{ display:grid; justify-items:center; gap:12px; }
.mpm-rv__chart{ position:relative; width:184px; height:184px; flex:none; }
.mpm-rv__ring{ display:block; overflow:visible; }
.mpm-rv__empty{ stroke:var(--rv-line); }
.mpm-rv__slice :is(path,circle){
  transition:opacity .2s var(--rv-ease), transform .2s var(--rv-ease); transform-origin:92px 92px;
  animation:mpm-rv-in .5s var(--rv-ease) backwards; animation-delay:calc(var(--i,0) * 90ms);
  /* backwards, not both: a held final frame would outrank the hover rules below. */
}
@keyframes mpm-rv-in{ from{ opacity:0; transform:scale(.86) rotate(-8deg); } to{ opacity:1; transform:none; } }
.mpm-rv__slice a{ cursor:pointer; outline:none; }
.mpm-rv.has-selection .mpm-rv__slice:not(.is-on) :is(path,circle){ opacity:.3; }
.mpm-rv__slice.is-on path{ transform:scale(1.04); }
${LINKED_HOVER}
.mpm-rv__centre{ position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; text-align:center; }
.mpm-rv__c{
  grid-area:1 / 1; display:flex; flex-direction:column; align-items:center; line-height:1.15;
  transition:opacity .18s var(--rv-ease), transform .18s var(--rv-ease);
}
.mpm-rv__c:not(.mpm-rv__c--all){ opacity:0; transform:scale(.96); }
.mpm-rv__c strong{ font:500 34px/1 var(--mpm-font-display,inherit); color:var(--rv-ink); letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.mpm-rv__c span{ font-size:13px; color:var(--rv-ink-2); margin-top:6px; }
.mpm-rv__c small{ font-size:12px; color:var(--rv-ink-3); margin-top:2px; }
.mpm-rv__none{ font-size:13px; color:var(--rv-ink-3); }

.mpm-rv__legend{ list-style:none; margin:0; padding:0; display:grid; gap:4px; min-width:0; max-width:540px; width:100%; }
.mpm-rv__row > a,.mpm-rv__row > div{
  position:relative; display:grid; grid-template-columns:32px 1fr auto 20px; grid-template-rows:auto auto;
  column-gap:12px; row-gap:2px; align-items:center;
  padding:10px 12px; border-radius:16px; text-decoration:none; color:inherit;
  transition:background .15s var(--rv-ease);
}
.mpm-rv__row > a:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:-2px; }
.mpm-rv__row.is-on > a{ background:var(--mpm-sel,#D3E3FD); }
.mpm-rv__ico{
  grid-row:1 / span 2; display:grid; place-items:center; width:32px; height:32px; border-radius:50%;
  background:color-mix(in srgb, var(--c) 15%, transparent); color:var(--c);
}
[data-theme="dark"] .mpm-rv__ico{ background:color-mix(in srgb, var(--c) 22%, transparent); }
.mpm-rv__ico--sm{ width:18px; height:18px; }
.mpm-rv__name{ font-size:14px; font-weight:500; color:var(--rv-ink); }
.mpm-rv__num{ display:flex; align-items:baseline; gap:10px; justify-self:end; }
.mpm-rv__num b{ font:500 18px/1 var(--mpm-font-display,inherit); color:var(--rv-ink); font-variant-numeric:tabular-nums; }
.mpm-rv__num i{ font-style:normal; font-size:13px; color:var(--rv-ink-3); min-width:38px; text-align:right; font-variant-numeric:tabular-nums; }
.mpm-rv__parts{ grid-column:2 / span 2; display:flex; flex-wrap:wrap; gap:2px 12px; font-size:12px; color:var(--rv-ink-3); }
.mpm-rv__part{ display:inline-flex; align-items:center; gap:5px; }
.mpm-rv__part i{ width:7px; height:7px; border-radius:50%; flex:none; }
/* The › that says "this row opens its leads", there when you reach for it. */
.mpm-rv__go{ grid-column:4; grid-row:1 / span 2; display:grid; place-items:center; color:var(--rv-ink-3);
  opacity:0; transform:translateX(-4px); transition:opacity .15s var(--rv-ease), transform .15s var(--rv-ease); }
.mpm-rv__row > a:hover .mpm-rv__go,.mpm-rv__row > a:focus-visible .mpm-rv__go{ opacity:1; transform:none; }
@media (hover:none){ .mpm-rv__go{ opacity:.6; transform:none; } }
.mpm-rv__pending{ grid-column:1 / -1; margin:0; font-size:13px; color:var(--rv-ink-2); }
.mpm-rv__pending a{ color:var(--mpm-v-500,#0B57D0); font-weight:500; text-decoration:none; }
.mpm-rv__pending a:hover{ text-decoration:underline; }
.mpm-rv__pending span{ color:var(--rv-ink-3); }

@media (max-width:720px){
  .mpm-rv{ grid-template-columns:1fr; justify-items:center; }
  .mpm-rv__legend{ width:100%; }
}
@media (prefers-reduced-motion:reduce){
  .mpm-rv *{ animation:none !important; transition:none !important; }
}
@media (forced-colors:active){
  .mpm-rv__slice path{ forced-color-adjust:none; }
}
`;
