import type { ReactNode } from 'react';

/**
 * App-wide admin theme (admin.components.providers) - a provider wraps EVERY admin page,
 * including the login and account views, so a single injected <style> here restyles the
 * whole CMS to the violet "Dropify" look: tinted background, rounded corners, soft
 * shadows, violet primary buttons / focus rings, a pill-style active nav item, and a
 * centred login card. It only sets presentation - Payload's own behaviour, theme toggle,
 * and light/dark tokens are untouched; every rule is scoped so light AND dark both work.
 *
 * Why a provider (not admin.css): Payload v3 has no global-CSS config key, but providers
 * render above the view router on all routes - the reliable place to reach login too.
 *
 * The block at the end adapts the admin for phones and tablets. Desktop is untouched.
 *
 * Careful with this file: the CSS below is a template literal, so a stray backtick, or a
 * dollar sign followed by a brace, ends the string early and takes the whole admin down
 * with a runtime error. Both have happened. Check for them after every edit.
 */
export function AdminTheme({ children }: { children?: ReactNode }): React.JSX.Element {
  return (
    <>
      <style>{ADMIN_CSS}</style>
      {children}
    </>
  );
}

const ADMIN_CSS = `
/* ============ MrMoverPacker admin - violet theme ============ */
:root{
  --mpm-v-400:#8B7CF0; --mpm-v-500:#6D5AE6; --mpm-v-600:#5A46D6; --mpm-v-700:#4A38B5;
  --mpm-grad:linear-gradient(140deg,#8B7CF0,#5A46D6);
  /* The logo orange. Reserved for things that need a person to do something - an
     unclaimed lead, a failing integration - so that when it appears it means one thing. */
  --mpm-ember:#FF5500;
  /* The drawer keeps one identity in both themes; see the nav block near the end. */
  --mpm-drawer:#1F1A3D; --mpm-drawer-2:#141127;
  --mpm-drawer-ink:#F2EFFD; --mpm-drawer-ink-2:#A79FD6;
  --mpm-drawer-line:rgba(255,255,255,.11);
  --mpm-drawer-hover:rgba(255,255,255,.08);
  --mpm-scrim:rgba(11,8,28,.64);
}

/* Rounder corners across the whole admin */
html[data-theme="light"], html[data-theme="dark"]{
  --style-radius-s:8px; --style-radius-m:11px; --style-radius-l:16px;
}

/* ---- Surfaces and ink ----
   Payload's elevation tokens sit within a few percent of white in light mode. That is
   right for a dense desktop table drawn on a white page, and it falls apart on a card:
   a white card on a near-white background with pale-grey labels has nothing separating
   any layer from the next, which is what made the phone view look washed out. Contrast
   is decided once here and every rule below reads from it, rather than each rule picking
   an elevation number and hoping. */
html[data-theme="light"]{
  --theme-bg:#E9E5F7;
  --mpm-paper:#FFFFFF;
  --mpm-ink:#15122B; --mpm-ink-2:#524C74; --mpm-ink-3:#787296;
  --mpm-line:#E2DCF3; --mpm-tint:#F5F2FD;
  /* A divider that has to be seen across a whole screen, rather than the hairline
     that closes a card. Payload draws these in --theme-elevation-100, which is
     #EBEBEB - the same luminance as this theme's page, so they vanished. */
  --mpm-rule:#D3CBEC;
  --mpm-shadow:rgba(38,28,92,.14);
  /* #FF5500 is only 3.2:1 on white - fine for a dot, too weak for a word. */
  --mpm-ember-ink:#C63F00;
}
html[data-theme="dark"]{
  --theme-bg:#131120;
  --mpm-paper:#1C1930;
  --mpm-ink:#F2F0FA; --mpm-ink-2:#ADA7C9; --mpm-ink-3:#8D87AB;
  --mpm-line:#2E2A49; --mpm-tint:#252140;
  --mpm-rule:#3A3560;
  --mpm-shadow:rgba(0,0,0,.5);
  --mpm-ember-ink:#FF8A55;
}

/* ---- Primary buttons - Save, and the list "Create New" ----
   "Create New" is btn--style-pill rather than btn--style-primary, so it was never caught
   by the rule below it and the main action on every list screen rendered as a flat grey
   box that read as disabled. */
.btn.btn--style-primary,
.btn.list-create-new-doc__create-new-button{
  --color:#fff; --hover-color:#fff;
  background:var(--mpm-grad); border:none; border-radius:99px; color:#fff;
  font-weight:600; font-size:.9rem; letter-spacing:.01em; padding:.62rem 1.25rem;
  box-shadow:0 12px 26px -14px color-mix(in srgb, var(--mpm-v-600) 92%, transparent);
  transition:transform .12s, box-shadow .12s, filter .12s;
}
.btn.btn--style-primary:hover,
.btn.list-create-new-doc__create-new-button:hover{
  filter:brightness(1.07); transform:translateY(-1px);
  box-shadow:0 16px 32px -14px color-mix(in srgb, var(--mpm-v-600) 100%, transparent);
}
.btn.btn--style-primary:active,
.btn.list-create-new-doc__create-new-button:active{ transform:translateY(0); }
.btn.btn--style-primary svg,.btn.btn--style-primary .btn__content,
.btn.list-create-new-doc__create-new-button svg,
.btn.list-create-new-doc__create-new-button .btn__content,
.btn.list-create-new-doc__create-new-button .btn__label{ color:#fff; }
.btn--icon{ color:var(--mpm-v-500); }

/* ---- Inputs: violet focus ring everywhere ---- */
.field-type input:focus,
.field-type textarea:focus,
.field-type .rs__control--is-focused,
.search-filter input:focus{
  border-color:var(--mpm-v-500)!important;
  box-shadow:0 0 0 2px color-mix(in srgb, var(--mpm-v-500) 22%, transparent)!important;
  outline:none!important;
}
/* Keyboard focus stays visible wherever the ring above does not reach. */
.nav__link:focus-visible,.mpm-dial__btn:focus-visible,.btn:focus-visible{
  outline:2px solid var(--mpm-v-400); outline-offset:2px;
}

/* ---- Sidebar nav (desktop): legible links + violet active pill ----
   Payload draws the divide between nav and content as a single hairline in
   --theme-elevation-100. In dark that is #2F2F2F against a near-black page and reads
   clearly; in light it is #EBEBEB against this theme's #E9E5F7 page - the same luminance,
   so the edge disappeared and the sidebar ran into the dashboard.

   Giving the nav its own surface fixes it at the root rather than hunting for a grey dark
   enough to see: the sidebar becomes a panel on the tinted page, the way the cards on it
   already are, and the border is then an edge rather than the only thing doing the work. */
.nav{
  padding-inline:.15rem;
  background:var(--mpm-paper);
  border-right:1px solid var(--mpm-line);
}
.nav .nav__link{
  display:flex; align-items:center; gap:.6rem;
  /* The admin's root font is 13px, not 16, so rem values here are smaller than they
     look: .95rem was 12.35px. 1.1rem lands at ~14px, which is the readable step. */
  font-size:1.1rem; font-weight:500; line-height:1.35;
  color:var(--theme-elevation-700);
  padding:.62rem .75rem; margin:2px .5rem; border-radius:12px;
  transition:background .13s, color .13s;
}
.nav .nav__link:hover{ background:color-mix(in srgb, var(--mpm-v-500) 12%, transparent); color:var(--theme-elevation-1000); }
.nav .nav__link.active,.nav a.active,.nav .nav__link[aria-current="page"]{
  background:var(--mpm-grad); color:#fff; font-weight:600;
  box-shadow:0 12px 24px -14px color-mix(in srgb, var(--mpm-v-600) 90%, transparent);
}
.nav .nav__link.active svg,.nav .nav__link[aria-current="page"] svg{ color:#fff; }
.nav .nav__link.active::after,.nav .nav__link[aria-current="page"]::after{ content:"\\203A"; margin-left:auto; font-size:1.3em; line-height:1; opacity:.9; }
.nav .nav-group__label{ font-size:.82rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--mpm-ink-3); opacity:1; }
.nav__controls .btn:hover{ color:var(--mpm-v-500); }

/* ---- Group headings ----
   These are buttons that collapse a section, and they did not look like buttons: a bare
   violet word with a chevron adrift on the far right, no hover, no target beyond the
   text itself. Given the shape of a row, so the whole line is the control and it is
   obvious there is something to press.

   The chevron's rotation is set inline by Payload as it opens and closes, so nothing
   here touches transform - only how visible it is. */
.nav .nav-group__toggle{
  display:flex; align-items:center; justify-content:space-between; gap:.5rem;
  /* Tight enough that nine collapsed sections read as one menu rather than nine
     headings adrift on their own. */
  width:calc(100% - 1rem); margin:.5rem .5rem .1rem; padding:.36rem .6rem;
  border:0; border-radius:9px; background:none; cursor:pointer; text-align:left;
  transition:background .12s ease;
}
.nav .nav-group__toggle:hover{ background:color-mix(in srgb, var(--mpm-v-500) 9%, transparent); }
.nav .nav-group__toggle:hover .nav-group__label{ color:var(--mpm-v-600); }
.nav .nav-group__indicator{
  display:grid; place-items:center; width:18px; height:18px; flex:none;
  color:var(--mpm-ink-2); transition:color .12s ease;
}
.nav .nav-group__toggle:hover .nav-group__indicator{ color:var(--mpm-v-600); }
/* Explicit, and thicker. Payload paints this path in --theme-elevation-400 (#9A9A9A) at
   a 1px width; behind the opacity it previously carried, the arrow that tells you a
   section opens was about 1.9:1 against the page - the control was effectively
   undiscoverable. */
.nav .nav-group__indicator .stroke{ stroke:currentColor; stroke-width:1.8; }
/* A collapsed section is a closed drawer, not a disabled one - keep it legible. */
.nav .nav-group--collapsed .nav-group__label{ color:var(--mpm-ink-3); }

/* Our own quick-access heading is the same kind of thing, so it is set the same way -
   it used to be a size and colour of its own for no reason anyone could see. */
.mpm-nav__quick-title{
  font-size:.82rem !important; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  color:var(--mpm-ink-3) !important;
}
.mpm-nav{ border-bottom-color:var(--mpm-line) !important; }

/* Brand pin must never be clipped in any admin slot (nav header, app header, login).
   Un-clip the wrappers directly around the logo (matched by its aria-label, so it is
   class-name-agnostic) up to 3 levels - without touching the nav scroll container. */
.nav__header,.nav__brand,.nav__logo,.nav__link--logo,.graphic-logo,.app-header__logo{ overflow:visible; }
:has(> svg[aria-label="MrMoverPacker"]),
:has(> * > svg[aria-label="MrMoverPacker"]),
:has(> * > * > svg[aria-label="MrMoverPacker"]){ overflow:visible; }
:has(> svg[aria-label="MrMoverPacker"]){ height:auto; min-height:0; }
/* The brand pin is 26px. Payload's breadcrumb home slot is a 16px box built for a small
   house icon, so the pin overflowed it on every side - and because the "/" after it is
   laid out against the 16px box, the separator printed straight across the logo. Sizing
   the slot to what it actually holds fixes the overlap; un-clipping it, which is all the
   rules above did, only made the overflow visible. */
.step-nav__home,
.step-nav__home > span{
  display:inline-flex; align-items:center;
  width:auto; min-width:0; height:auto; min-height:0;
}
svg[aria-label="MrMoverPacker"]{ flex:none; overflow:visible; }

/* ---- Cards, tables, popups: rounder + softer ---- */
.card{ border-radius:var(--style-radius-l); border-color:color-mix(in srgb, var(--mpm-v-500) 10%, var(--theme-elevation-100)); transition:border-color .12s,transform .12s; }
.card:hover{ border-color:color-mix(in srgb, var(--mpm-v-500) 40%, transparent); }
.table{ border-radius:var(--style-radius-m); overflow:hidden; }
.table thead th{ background:color-mix(in srgb, var(--mpm-v-500) 7%, var(--theme-elevation-0)); color:var(--theme-elevation-800); }
.popup__content{ border-radius:var(--style-radius-m); }
.pill{ border-radius:99px; }

/* ---- Pipeline chips ----
   Payload tags a select cell with its own value - a span classed selected--quoted - which
   is the hook for colouring the pipeline with no custom component at all. The colours are
   the ones in components/dashboard/lead-status.ts, so a stage looks the same in the list
   as it does on the dashboards, and that file stays the single definition.

   The text colour is mixed toward --mpm-ink rather than stated outright, so one rule
   reads correctly in both themes: toward near-black on paper, toward near-white on dark. */
.cell-status > span[class*="selected--"]{
  --chip:#8a8f98;
  display:inline-flex; align-items:center; gap:.36rem; white-space:nowrap;
  padding:.24rem .58rem .24rem .48rem; border-radius:999px;
  font-size:.68rem; font-weight:700; letter-spacing:.045em; text-transform:uppercase;
  background:color-mix(in srgb, var(--chip) 15%, transparent);
  border:1px solid color-mix(in srgb, var(--chip) 34%, transparent);
  color:color-mix(in srgb, var(--chip) 70%, var(--mpm-ink));
}
.cell-status > span[class*="selected--"]::before{
  content:""; width:6px; height:6px; border-radius:50%; background:var(--chip); flex:none;
}
/* The "span" is load-bearing. Without it these are one class less specific than the
   attribute selector above, so the fallback grey won every cascade and the whole pipeline
   rendered in one colour - a Quoted lead looked exactly like a New one. */
/* ── bulk assign bar ──────────────────────────────────────────────────────── */
/* Appears only with rows ticked, so it must read as a consequence of the selection
   rather than another permanent toolbar: tinted, one line, sitting right on top of
   the table it acts on. */
.mpm-bulk{
  display:flex; align-items:center; flex-wrap:wrap; gap:.6rem;
  margin:0 0 .75rem; padding:.6rem .8rem;
  border:1px solid var(--mpm-line); border-radius:12px;
  background:var(--mpm-tint); color:var(--mpm-ink);
  font-size:.9rem;
}
.mpm-bulk__count{ color:var(--mpm-soft); }
.mpm-bulk__count strong{ color:var(--mpm-ink); font-size:1rem; }
.mpm-bulk__who{
  min-width:12rem; max-width:100%;
  padding:.4rem .55rem; border-radius:8px;
  border:1px solid var(--mpm-line);
  background:var(--theme-input-bg,var(--theme-elevation-0));
  color:var(--mpm-ink); font-size:.9rem;
}
.mpm-bulk__go,.mpm-bulk__cancel{
  padding:.42rem .85rem; border-radius:8px; font-size:.88rem; font-weight:600;
  border:1px solid transparent; cursor:pointer;
}
.mpm-bulk__go{ background:var(--mpm-grad); color:#fff; }
.mpm-bulk__go:disabled{ opacity:.5; cursor:not-allowed; }
.mpm-bulk__cancel{ background:transparent; border-color:var(--mpm-line); color:var(--mpm-soft); }
/* The confirm step keeps the bar's shape and swaps its contents, so the row does not
   jump as it changes - the button you are about to press stays where your eye is. */
.mpm-bulk__confirm{ display:flex; align-items:center; flex-wrap:wrap; gap:.6rem; }
.mpm-bulk__ask{ color:var(--mpm-ink); }
.mpm-bulk__ok{ color:#1a9d5a; font-weight:600; }
.mpm-bulk__error{ color:#b23c17; font-weight:600; }
@media (max-width:640px){
  /* Thumbs, not pointers: the control and its button each take the full width rather
     than crowding onto one line where the wrong one gets hit. */
  .mpm-bulk{ flex-direction:column; align-items:stretch; }
  .mpm-bulk__confirm{ flex-direction:column; align-items:stretch; }
  .mpm-bulk__who,.mpm-bulk__go,.mpm-bulk__cancel{ width:100%; }
  .mpm-bulk__go,.mpm-bulk__cancel{ min-height:40px; }
}

.cell-status > span.selected--new{ --chip:#8a8f98; }
.cell-status > span.selected--assigned{ --chip:#6D5AE6; }
.cell-status > span.selected--reassigned{ --chip:#8b6df0; }
.cell-status > span.selected--contacted{ --chip:#2f6df6; }
.cell-status > span.selected--call-not-picked{ --chip:#d16a5a; }
.cell-status > span.selected--call-later{ --chip:#0f8b9e; }
.cell-status > span.selected--follow-up{ --chip:#c2478f; }
.cell-status > span.selected--quoted{ --chip:#c98a00; }
.cell-status > span.selected--won{ --chip:#1a9d5a; }
.cell-status > span.selected--lost{ --chip:#8a8f98; }
.cell-status > span.selected--invalid{ --chip:#b23c17; }

/* ---- The dial strip ----
   A number, a Call button and a WhatsApp button. Ringing the customer is what this screen
   exists for, so it is the one thing in a row styled like a control rather than a field. */
/* One variable drives the button size everywhere, so the reserved width below can be
   derived from it rather than guessed at. */
.mpm-dial{ --dial:34px; display:inline-flex; align-items:center; gap:.55rem; }
.mpm-dial__num{ font-variant-numeric:tabular-nums; letter-spacing:.01em; color:var(--mpm-ink); }
/* Two fixed slots, always, even when only one button is there.
   Phone numbers are not all the same length - ten digits, a +91 prefix, the odd nine-digit
   landline - and the buttons used to start wherever the text happened to end, so they
   stepped left and right down the column. Worse, a number WhatsApp cannot take renders the
   call button alone, which moved it again.
   A first attempt reserved 4.7rem, which looked right and was not: the admin's root font
   size is about 13px, not 16, so it resolved to 61px against a 73px pair and the
   single-button rows still sat 12px out. Two slots sized from --dial cannot be wrong by
   arithmetic - the second simply stays empty. */
.mpm-dial__btns{
  display:grid; grid-template-columns:repeat(2, var(--dial));
  align-items:center; justify-items:start;
  gap:.4rem; flex:none;
}
.mpm-dial__btn{
  display:inline-grid; place-items:center;
  width:var(--dial); height:var(--dial); border-radius:50%;
  border:1px solid transparent; text-decoration:none; flex:none;
  transition:transform .12s ease, background .12s ease, border-color .12s ease;
}
.mpm-dial__btn:active{ transform:scale(.9); }
/* Filled, with a white glyph. These were tinted outlines, which read as secondary next
   to everything else on a lead card - and a call button is the one thing on that card
   anybody is trying to press. Both are filled rather than only the call button: one solid
   and one outlined would look like one of them had been missed. */
.mpm-dial__btn--call{
  color:#fff; border-color:transparent; background:var(--mpm-grad);
  box-shadow:0 6px 14px -8px color-mix(in srgb, var(--mpm-v-700) 85%, transparent);
}
.mpm-dial__btn--wa{
  color:#fff; border-color:transparent; background:linear-gradient(140deg,#3DDC84,#1EA65C);
  box-shadow:0 6px 14px -8px rgba(13,110,66,.8);
}
.mpm-dial__btn--call:hover,.mpm-dial__btn--wa:hover{ filter:brightness(1.06); }
.mpm-dial--field{ --dial:44px; }
.mpm-dial-field{ margin:-.35rem 0 1.1rem; }

/* In a table, the cell is the same width on every row, so anchoring the buttons to its
   right edge is what actually puts them in a straight line. Tabular figures stop the
   numbers themselves jittering as digit widths change. */
.table td.cell-phone .mpm-dial{
  display:grid; grid-template-columns:minmax(0,1fr) auto;
  align-items:center; width:100%; gap:.6rem;
}
.table td.cell-phone .mpm-dial__num{ font-variant-numeric:tabular-nums; }

/* Owner and age. An unclaimed lead is the one thing in the list that needs a decision
   from whoever is reading it, so it is the one thing wearing the ember. */
.mpm-owner{ color:var(--mpm-ink-2); font-weight:600; }
.mpm-owner--none{ color:var(--mpm-ember-ink); font-weight:700; }
.mpm-age{ font-variant-numeric:tabular-nums; color:var(--mpm-ink-3); }

/* ---- Account / document views: keep app bg tint visible behind content ---- */
.account .doc-controls,.collection-edit .doc-controls{ border-radius:var(--style-radius-m); }

/* The split between a document's fields and its sidebar. Payload draws it as the edit
   pane's right border in --theme-elevation-100; on this theme's tinted page that is the
   same luminance as the background, so the two halves ran together with no edge at all.
   Given a little breathing room either side as well - a rule with content pressed
   against it reads as a mistake even once you can see it. */
.document-fields--has-sidebar .document-fields__edit{
  border-right:1px solid var(--mpm-rule);
  padding-right:clamp(1rem, 2.5vw, 2rem);
}
.document-fields--has-sidebar .document-fields__sidebar-wrap{
  padding-left:clamp(.75rem, 1.5vw, 1.25rem);
}

/* ================= Login / minimal (create-first-user, forgot) ================= */
.login.template-minimal,.template-minimal{
  background:
    radial-gradient(900px 460px at 50% -8%, color-mix(in srgb, var(--mpm-v-500) 26%, var(--theme-bg)) 0%, transparent 62%),
    var(--theme-bg);
}
.template-minimal__wrap{
  max-width:410px; width:100%;
  padding:2.5rem 2.3rem 2.6rem;
  background:var(--mpm-paper);
  border:1px solid color-mix(in srgb, var(--mpm-v-500) 13%, var(--mpm-line));
  border-radius:22px;
  box-shadow:0 40px 90px -40px color-mix(in srgb, var(--mpm-v-700) 70%, transparent), 0 4px 12px -6px rgba(20,18,45,.12);
}
.login__brand{ display:flex; justify-content:center; margin-bottom:1.6rem; }
.login__form .field-type{ margin-bottom:1rem; }
.login__form .form-submit,.login__form .btn--style-primary{ width:100%; }

/* =============== Phone and tablet ===============
   The CMS is used in the field - a coordinator checking a lead between jobs, a
   salesperson ringing someone back from the car - and Payload's own layout assumes a
   desktop. Everything below is inside a max-width query, so the desktop view is
   untouched. Written against Payload's own class names: stable across 3.x minors, but
   not a public API, so this block is the first place to look if an upgrade ever makes
   the admin look odd on a phone. */
@media (max-width:1024px){
  /* ---- The list becomes cards ----
     A six-column table on a 390px screen means sideways scrolling to read a status, and
     the columns that matter most - who, and what stage - are the ones off-screen. The
     same rows are re-laid as one card per record: nothing is hidden, nothing needs a
     horizontal swipe.

     Pure CSS on Payload's own per-field classes, so there is no second React list to
     keep in step with the first. */
  .table{ overflow:visible; border-radius:0; background:none; }
  .table table,.table tbody,.table tr,.table td{ display:block; width:auto; }
  /* The header row has nowhere to go once cells stack, and sorting is reachable from
     the controls above. */
  .table thead{ display:none; }
  /* Hidden by default: on a card it would be a full-width block of its own, and most
     collections have nothing worth selecting in bulk. Leads bring it back below, where
     the grid gives it a real place - routing a batch of leads to cover someone's leave
     is not a desktop-only need, and it is the phone that tends to be to hand. */
  .table td.cell-_select{ display:none; }

  .table tbody tr{
    margin-bottom:.7rem;
    padding:.95rem 1rem 1rem;
    border:1px solid var(--mpm-line);
    border-radius:16px;
    background:var(--mpm-paper);
    box-shadow:0 1px 2px var(--mpm-shadow), 0 12px 26px -22px var(--mpm-shadow);
  }
  .table tbody tr:last-child{ margin-bottom:0; }
  /* min-width:0 is what makes the cards work at all. Payload's table sheet puts a
     150px min-width on cells - reasonable for a column that has to hold a heading,
     wrong for a grid item on a 360px screen, where a 60px status chip claimed 150px
     and overflowed left across the name beside it. Not in any readable stylesheet
     rule, so it is overridden rather than traced. */
  .table tbody td{
    border:0 !important; padding:0;
    min-width:0 !important; width:auto !important;
  }

  /* The name is the heading of the card. */
  .table td.cell-name{ font-size:1.02rem; font-weight:700; line-height:1.28; letter-spacing:-.005em; }
  .table td.cell-name a{ text-decoration:none; color:var(--mpm-ink); }
  /* Service sits under it as the subtitle. */
  .table td.cell-service{ font-size:.8rem; color:var(--mpm-ink-2); }

  /* ---- Leads: an explicit grid ----
     Every cell defaults to the full width, and the six known columns are given a row and
     a column outright. This replaces a reserved right-hand gutter, which existed only so
     an absolutely positioned status chip had somewhere to sit, and which left a third of
     every line below the first one blank. Placing by grid area also means DOM order stops
     mattering: the chip sits beside the name however Payload chooses to emit it. */
  .collection-list--leads .table tbody tr{
    display:grid;
    /* Three columns now: the tick box, the body, and the right-hand gutter the status
       chip and date sit in. */
    grid-template-columns:auto minmax(0,1fr) auto;
    column-gap:.75rem;
    align-items:start;
  }
  /* A column someone adds from the Columns menu has no named place, so it falls to the
     full width on a row of its own rather than landing somewhere arbitrary. */
  .collection-list--leads .table tbody td{ grid-column:1 / -1; }
  /* The tick box leads the card, level with the name it belongs to. Given a 40px live
     area so it is a target rather than a speck - the box Payload draws is much smaller
     than the area worth tapping. */
  .collection-list--leads .table td.cell-_select{
    display:flex; align-items:center; justify-content:center;
    grid-area:1 / 1 / 2 / 2;
    min-width:34px; min-height:34px; margin-left:-.25rem;
  }
  .collection-list--leads .table td.cell-name{ grid-area:1 / 2 / 2 / 3; align-self:center; }
  .collection-list--leads .table td.cell-status{ grid-area:1 / 3 / 2 / 4; justify-self:end; }
  .collection-list--leads .table td.cell-service{ grid-area:2 / 2 / 3 / 4; }
  .collection-list--leads .table td.cell-phone{ grid-area:3 / 1 / 4 / 4; }
  .collection-list--leads .table td.cell-assignedTo{ grid-area:4 / 1 / 5 / 3; align-self:center; }
  .collection-list--leads .table td.cell-createdAt{ grid-area:4 / 3 / 5 / 4; justify-self:end; align-self:center; }

  /* The dial strip spans the card, so it reads as the button it is. */
  .collection-list--leads .table td.cell-phone{
    margin:.7rem 0;
    padding:.4rem .45rem .4rem .8rem;
    border:1px solid var(--mpm-line);
    border-radius:12px;
    background:var(--mpm-tint);
  }
  .collection-list--leads .table td.cell-phone .mpm-dial{
    display:flex; width:100%; align-items:center; justify-content:space-between;
  }
  .collection-list--leads .table td.cell-phone .mpm-dial__num{ font-size:.9rem; font-weight:600; }

  /* Touch targets, phone-sized.
     These two sit side by side under a thumb. At 34px with a .4rem gap - which is 5px,
     not 6.4px, because the admin's root font is 13px - the live areas are close enough
     that aiming for WhatsApp catches Call. Ringing a customer by accident is a worse
     mistake than a tap that does nothing, so the gap has to clear a fingertip rather
     than just look separated: 40px targets with 14px of dead space between them.
     The field variant keeps its own larger size. */
  .mpm-dial{ --dial:40px; }
  .mpm-dial--field{ --dial:44px; }
  .mpm-dial__btns{ gap:14px; }
  .collection-list--leads .table td.cell-assignedTo,
  .collection-list--leads .table td.cell-createdAt{ font-size:.76rem; }

  /* Every other collection keeps a labelled stack: their columns are not known here, so
     a bare value would sit on the card with nothing to say what it is. Leads need no
     labels - "Unassigned" and "3d ago" already say what they are. */
  .table td.cell-source,.table td.cell-quoteNo,.table td.cell-amount,
  .table td.cell-updatedAt,
  .collection-list:not(.collection-list--leads) .table td.cell-createdAt,
  .collection-list:not(.collection-list--leads) .table td.cell-assignedTo{
    font-size:.76rem; color:var(--mpm-ink-3); display:flex; gap:.35rem; margin-top:.2rem;
  }
  .table td.cell-source::before{ content:"Source"; }
  .table td.cell-quoteNo::before{ content:"Quote"; }
  .table td.cell-amount::before{ content:"Amount"; }
  .table td.cell-updatedAt::before{ content:"Updated"; }
  .collection-list:not(.collection-list--leads) .table td.cell-createdAt::before{ content:"Created"; }
  .collection-list:not(.collection-list--leads) .table td.cell-assignedTo::before{ content:"Owner"; }
  .table td.cell-source::before,.table td.cell-quoteNo::before,
  .table td.cell-amount::before,.table td.cell-updatedAt::before,
  .collection-list:not(.collection-list--leads) .table td.cell-createdAt::before,
  .collection-list:not(.collection-list--leads) .table td.cell-assignedTo::before{
    font-weight:600; color:var(--mpm-ink-2); flex:none;
  }

  /* Save and Publish wrap rather than squeezing to unreadable widths, and every control
     clears the 44px touch target both Apple and Google recommend. */
  .doc-controls__controls{ flex-wrap:wrap; gap:.4rem; }
  .btn{ min-height:44px; }
  /* Two-up field rows collapse: a 50%-width field on a 390px screen leaves about 24
     characters, which will not hold an address or an email. */
  .field-type.row{ flex-direction:column; }
  .field-type.row > .field-type{ width:100% !important; }
  /* 16px on inputs, because iOS Safari zooms the page whenever a focused field is
     smaller than that - and the zoom does not undo itself on blur. */
  .field-type input,.field-type textarea,.field-type select,.react-select__input input{
    font-size:16px !important;
  }
  /* The sidebar sits under the fields rather than beside them, so status and assignment
     are reachable without scrolling sideways. */
  .document-fields--has-sidebar .document-fields__sidebar-wrap{
    position:static; width:100%; max-width:none;
    border-left:0; border-top:1px solid var(--mpm-rule);
  }
  .collection-edit__main,.document-fields__edit{ min-width:0; }

  /* ---- The nav trigger ----
     On a phone the whole navigation lives behind this one button, so it gets the brand
     gradient, a real 44px target and a shadow.

     The three bars are an SVG path classed "stroke". An earlier attempt painted
     .hamburger__open-icon white instead - that is an 18px box behind the glyph, so the
     result was a white square inside the violet tile with the default dark-grey bars
     still sitting on it, rather than white bars on violet. */
  /* The bar was exactly as tall as the button inside it - 44.3px of header around a 44px
     hamburger - so the tile sat at top:0, touching the edge of the screen, and on a
     notched phone partly under the status bar.
     Padding alone did nothing: the header has an explicit height and border-box sizing,
     so the padding was absorbed and the tile still overflowed to the top. The height is
     what has to change, and it comes from a variable Payload derives everything else
     from, so raising it moves the logo and the avatar with it instead of leaving the
     button floating on its own.
     env() adds the notch inset where there is one and resolves to 0 everywhere else. */
  html[data-theme="light"], html[data-theme="dark"]{
    --app-header-height:calc(var(--base) * 3.4 + env(safe-area-inset-top, 0px));
  }
  .app-header__content{
    box-sizing:border-box;
    padding-top:env(safe-area-inset-top, 0px);
  }
  button.nav-toggler.app-header__mobile-nav-toggler{ width:44px; height:44px; border:0; padding:0; }
  button.nav-toggler.app-header__mobile-nav-toggler .hamburger{
    width:44px; height:44px; display:grid; place-items:center;
    border-radius:13px; background:var(--mpm-grad);
    box-shadow:0 10px 20px -12px color-mix(in srgb, var(--mpm-v-700) 90%, transparent);
    transition:transform .12s ease;
  }
  button.nav-toggler.app-header__mobile-nav-toggler:active .hamburger{ transform:scale(.94); }
  button.nav-toggler.app-header__mobile-nav-toggler .hamburger__open-icon{ background:none; }
  button.nav-toggler.app-header__mobile-nav-toggler .icon .stroke{ stroke:#fff; stroke-width:1.9; }

  /* ---- The drawer ----
     Payload's mobile nav is a sticky panel in flow: opening it pushes the page sideways
     instead of covering it. The old scrim was one enormous box-shadow painted over
     whatever had been pushed, which is why the right-hand third arrived as a flat grey
     slab with no page visible through it. It is a real overlay now - fixed, above the
     page, with the page dimmed behind it.

     Dark in BOTH themes, deliberately. The nav is chrome, not content, and a white
     drawer sliding over white cards has nothing to say where one ends and the other
     begins - in light mode it washed out completely. Dark also finishes the gesture the
     gradient hamburger starts: the control and the panel it opens read as one object. */
  /* One column, in every nav state.
     Payload lays this out as a two-column grid - the nav, then the page - and opens the
     drawer by animating the first column from 0 to --nav-width, which is 100vw here. That
     is a push drawer that shoves the page off the right of the screen.
     Making the nav position:fixed for the slide took it out of flow, so it stopped being
     a grid item: the page div became the FIRST in-flow child and landed in the 0px column,
     collapsing to its min-content width. Measured at 18px on a 390px screen - the whole
     dashboard squeezed into a sliver down the left.
     With the drawer overlaying rather than pushing, the grid only ever has one thing to
     lay out, so it gets one column and the page fills it. Every nav-state selector Payload
     sets is covered, including its two-class one, or the more specific rule would win. */
  .template-default,
  .template-default--nav-hydrated,
  .template-default--nav-open,
  .template-default--nav-hydrated.template-default--nav-open{ grid-template-columns:1fr; }

  /* One element in two states, which is what makes it animatable at all.
     It used to be sticky when closed and fixed when open: two different layouts with
     nothing to tween between, so it jumped into place while Payload's 150ms opacity fade
     ran underneath. Now it is always fixed and always the same size, and only the
     transform changes - the one property a browser can animate on the compositor without
     touching layout, which is what keeps it smooth on a mid-range phone.

     The curve is a decelerating ease-out: quick to leave the edge, slow to settle. A
     linear slide reads as mechanical, and the default ease is too soft at this distance. */
  .nav{
    position:fixed; top:0; left:0; bottom:0; height:100dvh; z-index:120;
    width:min(86vw,320px);
    background:linear-gradient(168deg,var(--mpm-drawer),var(--mpm-drawer-2));
    border-right:0;
    /* Payload fades 0 to 1 over --nav-trans-time. We slide instead, so the panel has to
       stay opaque or it would fade in halfway through the movement. */
    opacity:1;
    transform:translateX(-100%);
    visibility:hidden;
    box-shadow:22px 0 60px -30px rgba(9,7,24,0);
    transition:
      transform .32s cubic-bezier(.32,.72,0,1),
      box-shadow .32s ease,
      visibility .32s;
    will-change:transform;
  }
  .nav--nav-open{
    transform:translateX(0);
    visibility:visible;
    box-shadow:22px 0 60px -30px rgba(9,7,24,.95);
  }

  /* The scrim.
     Payload already renders one - .template-default__wrap::before, absolutely positioned
     over the content and permanently invisible, because the rule that would show it
     targets a .template-default__nav-overlay element the template never renders. Reusing
     it puts the dimming on the page rather than painting it from the drawer, so it can
     fade on its own timing while the panel slides, and it cannot end up covering the
     screen when the panel is off it. */
  .template-default__wrap::before{
    background-color:var(--mpm-scrim);
    z-index:110;
    transition:opacity .32s ease, visibility .32s;
  }
  .template-default--nav-open .template-default__wrap::before{
    opacity:1; visibility:visible;
  }
  .nav--nav-open .nav__scroll{
    display:flex; flex-direction:column; height:100%;
    padding:0 .85rem 2rem; overscroll-behavior:contain;
  }

  /* The close button lives in .nav__header, which Payload renders AFTER .nav__wrap in
     the DOM. Ordered to the top and made sticky rather than moved with negative margins,
     which pushed a 523px-tall button off the top of the screen once the header turned out
     not to sit inside the scroll container.

     The flex goes on .nav__header-content, not on .nav__header: the content div is
     display:block at full width, so justifying its parent moved nothing at all and the
     button stayed jammed against the left edge, on top of the New proposal card. */
  /* The contents ease in just behind the panel. Without it the whole drawer arrives as
     one flat slab; a few frames of delay makes it read as a surface with things ON it. */
  .nav--nav-open .nav__wrap{
    order:2; padding-top:.9rem;
    animation:mpm-drawer-in .34s cubic-bezier(.32,.72,0,1) .06s both;
  }
  @keyframes mpm-drawer-in{
    from{ opacity:0; transform:translateX(-10px); }
    to{ opacity:1; transform:none; }
  }
  .nav--nav-open .nav__header{
    order:1; position:sticky; top:0; z-index:3;
    /* Something outside this file gives the header an explicit width - measured at
       390.4px, the full viewport, inside a 320px drawer. It is not in any readable
       stylesheet rule, so it is overridden rather than tracked down: left as it was, the
       header ran 70px past the panel and took the close button off the edge of it with
       nothing to show where the button had gone. */
    width:auto !important;
    margin:0 -.85rem; padding:.6rem .85rem;
    background:var(--mpm-drawer);
    border-bottom:1px solid var(--mpm-drawer-line);
  }
  .nav--nav-open .nav__header-content{
    display:flex; align-items:center; justify-content:flex-end; width:100%; gap:.5rem;
  }
  /* The drawer had no head at all - it opened straight onto a card, with a stray button
     floating over it. Naming the place you are in is what makes it a menu. */
  .nav--nav-open .nav__header-content::before{
    content:"MrMoverPacker"; margin-right:auto;
    font-size:.88rem; font-weight:700; letter-spacing:.005em;
    color:var(--mpm-drawer-ink);
  }
  .nav__mobile-close{ width:auto; padding:0; border:0; background:none; }
  .nav--nav-open .nav__mobile-close .hamburger{
    width:38px; height:38px; display:grid; place-items:center;
    border-radius:11px;
    background:rgba(255,255,255,.10);
    border:1px solid var(--mpm-drawer-line);
    transition:transform .12s ease, background .12s ease;
  }
  .nav--nav-open .nav__mobile-close:active .hamburger{
    transform:scale(.94); background:rgba(255,255,255,.18);
  }
  .nav--nav-open .nav__mobile-close .icon .stroke{ stroke:var(--mpm-drawer-ink); stroke-width:1.8; }

  /* Links on the dark panel. Sized for a thumb, not a cursor. */
  .nav--nav-open .nav__link,.nav--nav-open .mpm-nav__quick-link{
    display:flex; align-items:center; min-height:44px;
    margin:1px 0; padding:.55rem .7rem; border-radius:10px;
    font-size:1.08rem; font-weight:500; color:var(--mpm-drawer-ink);
  }
  .nav--nav-open .nav__link:hover,.nav--nav-open .mpm-nav__quick-link:hover{
    background:var(--mpm-drawer-hover); color:#fff;
  }
  .nav--nav-open .nav__link:active,.nav--nav-open .mpm-nav__quick-link:active{
    background:rgba(255,255,255,.14);
  }
  .nav--nav-open .nav__link.active,.nav--nav-open .nav__link[aria-current="page"]{
    background:var(--mpm-grad); color:#fff; font-weight:600;
    box-shadow:0 10px 22px -14px rgba(0,0,0,.95);
  }
  .nav--nav-open .nav__link .icon .stroke{ stroke:currentColor; }
  .nav--nav-open .nav__link .icon .fill{ fill:currentColor; }
  .nav--nav-open .nav-group__label,.nav--nav-open .nav__label,
  .nav--nav-open .mpm-nav__quick-title{
    color:var(--mpm-drawer-ink-2); opacity:1;
    font-size:.8rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
  }
  /* A group heading and its collapse chevron share one flex row, aligned to its top.
     Spacing the label on its own pushed the words down and left the chevron behind at the
     old baseline, a third of a line above the word it belongs to. The space belongs to the
     row, and the row should centre what it holds. */
  .nav--nav-open .nav-group__toggle{
    align-items:center; margin:1.15rem 0 .3rem; padding:0 .7rem;
  }
  .nav--nav-open .nav-group__label{ margin:0; padding:0; }
  .nav--nav-open .nav__label,.nav--nav-open .mpm-nav__quick-title{
    margin:1.15rem 0 .3rem; padding:0 .7rem;
  }
  .nav--nav-open .nav-group__toggle .icon .stroke{ stroke:var(--mpm-drawer-ink-2); }
  .nav--nav-open .nav__controls{
    border-top:1px solid var(--mpm-drawer-line); margin-top:1rem; padding-top:.6rem;
  }
  .nav--nav-open .nav__controls .btn,.nav--nav-open .nav__controls a{ color:var(--mpm-drawer-ink-2); }

  /* Our own quick-access block reads Payload's elevation tokens, which resolve against
     the page theme and would drop a white card into the dark panel. */
  /* padding-inline:0 so the quick links sit on the same left edge as the collection
     links below them; the block's own .25rem gutter put them 4px out of step. */
  .nav--nav-open .mpm-nav{
    border-bottom-color:var(--mpm-drawer-line); padding:0 0 .9rem;
  }
  .nav--nav-open .mpm-nav__panel{
    background:rgba(255,255,255,.05); border-color:var(--mpm-drawer-line);
  }
  .nav--nav-open .mpm-nav__panel-title{ color:var(--mpm-drawer-ink-2); }
  .nav--nav-open .mpm-nav__alert-label{ color:var(--mpm-drawer-ink); }
  .nav--nav-open .mpm-nav__alert-count{ color:var(--mpm-drawer-ink); background:rgba(255,255,255,.12); }
  .nav--nav-open .mpm-nav__alert:hover{ background:rgba(255,255,255,.08); }
  .nav--nav-open .mpm-nav__alert.is-hot{
    background:rgba(255,255,255,.07);
    border-color:color-mix(in srgb, var(--mpm-v-400) 45%, transparent);
  }
  .nav--nav-open .mpm-nav__alert.is-hot .mpm-nav__alert-label{ color:#fff; }
}
@media (max-width:640px){
  /* Reclaim the shell's gutters - on a narrow phone they cost a sixth of the screen. */
  .template-default__wrap,.collection-list,.collection-edit{ padding-inline:.75rem; }
  /* The collection header puts the title and "Create New" on one line; on a phone the
     pill lands on top of the heading. Stack them and let the title have the row. */
  .list-header__title-and-actions{
    display:flex; flex-direction:column; align-items:flex-start; gap:.75rem;
  }
  .list-header__title-and-actions h1{
    margin:0; font-size:1.5rem; line-height:1.2; letter-spacing:-.015em; color:var(--mpm-ink);
  }
  /* The collection blurb is guidance, not content: it should not outweigh the records. */
  .custom-view-description{ font-size:.83rem; line-height:1.5; color:var(--mpm-ink-2); }

  /* List controls stack instead of competing for one line. */
  .list-controls__wrap,.list-controls{ flex-wrap:wrap; gap:.5rem; }
  .search-filter,.search-filter__inputWrap{ width:100%; }
  /* Our own dashboard cards go single-column; their grid assumes desktop width. */
  .mpm-cards,.mpm-grid{ grid-template-columns:1fr !important; }
  /* The login card should not be a 410px box inside a 390px screen. */
  .template-minimal__wrap{ padding:1.75rem 1.25rem 2rem; border-radius:16px; }
}

@media (prefers-reduced-motion:reduce){
  .btn,.card,.mpm-dial__btn,.nav__link,.hamburger{ transition:none !important; }
  /* The drawer still has to appear and disappear - it just does it at once. Visibility
     keeps its transition so the panel is not torn off the screen mid-close. */
  .nav{ transition:visibility .01s !important; }
  .nav--nav-open .nav__wrap{ animation:none !important; }
  .template-default__wrap::before{ transition:none !important; }
}
`;
