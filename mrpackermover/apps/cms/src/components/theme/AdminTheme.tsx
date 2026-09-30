import type { ReactNode } from 'react';
import logo from '../graphics/brand/logo.png';
import logoInverse from '../graphics/brand/logo-inverse.png';
import { materialUrl } from '../icons/material.js';
import { NAV_ICON_CSS } from '../nav/nav-icons.js';
import { ScrollEdge } from './ScrollEdge.js';

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
      {/* Google's own typefaces, from Google Fonts. display=swap: text shows at once in
          the fallback and switches when the font lands, so a slow network never leaves
          the admin blank. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500;700&display=swap"
      />
      <style>{ADMIN_CSS}</style>
      <style>{NAV_ICON_CSS}</style>
      <ScrollEdge />
      {children}
    </>
  );
}

const ADMIN_CSS = `
/* ============ MrMoverPacker admin — Slate & Cobalt ============
   The admin used to be violet #6D5AE6 on a lavender page (#E9E5F7). Two things were
   wrong with that and neither was the hue in isolation: a SATURATED PAGE, which makes
   every white card look like a sticker and dates the whole product, and an accent light
   enough that a primary button and a disabled one sat at similar weight.

   This palette is built the way dense tools are: a quiet neutral ground, white paper,
   near-black ink, and ONE confident accent that is dark enough to carry white text and
   saturated enough to be unmistakable. Ember stays exactly as it was - the one colour
   that means a person must act now - and reads far better against cobalt than it did
   against violet, because the two are no longer neighbours on the wheel.

   THE ACCENT RAMP KEEPS ITS OLD NAMES (--mpm-v-400..700). Roughly a hundred rules across
   the admin read those names; re-pointing them here re-skins every one of those rules at
   once, and leaves no half-restyled screen at any point. */
/* ============ Google look ============
   The admin follows Google's own apps - Calendar, Gmail, Drive: white surfaces on a
   near-white ground, ONE blue accent, light-blue selected states, grey everything else,
   and colour spent only where it carries meaning (green done, amber needs attention, red
   error). The palette is Google's Material 3 set as Workspace uses it.

   The accent keeps its old token names (--mpm-v-*) because roughly a hundred rules read
   them; re-pointing them here restyles all of those rules at once. --mpm-grad keeps its
   name too, but is a flat colour now: Google buttons are not gradients. */
:root{
  --mpm-v-400:#1A73E8; --mpm-v-500:#0B57D0; --mpm-v-600:#0842A0; --mpm-v-700:#062E6F;
  --mpm-grad:linear-gradient(#0B57D0,#0B57D0);
  /* Selected states: the pale blue a chosen nav row, chip or toggle sits on in Google's
     apps, and the dark blue text that goes on it. */
  --mpm-sel:#D3E3FD; --mpm-on-sel:#041E49;
  --mpm-sel-2:#C2E7FF; --mpm-on-sel-2:#001D35;
  /* Google's state layer: an 8% wash of the text colour on hover, 12% when pressed. */
  --mpm-hover:rgba(31,31,31,.08); --mpm-press:rgba(31,31,31,.12);
  /* Needs a person. Google's amber, kept for the few things that are waiting on someone. */
  --mpm-ember:#E37400;
  --mpm-ok:#188038; --mpm-warn:#E37400; --mpm-danger:#D93025;
  /* The phone drawer follows the page, as Google's does: light on light, dark on dark. */
  --mpm-drawer:#F8FAFD; --mpm-drawer-2:#F8FAFD;
  --mpm-drawer-ink:#1F1F1F; --mpm-drawer-ink-2:#444746;
  --mpm-drawer-line:#E1E3E1;
  --mpm-drawer-hover:rgba(31,31,31,.08);
  --mpm-scrim:rgba(0,0,0,.32);
  /* Google's typefaces: Google Sans for headings and numbers, Google Sans Text for
     reading sizes. Loaded in AdminTheme; Roboto and the system font behind them. */
  --mpm-font:"Google Sans Text","Google Sans",Roboto,"Segoe UI",Arial,sans-serif;
  --mpm-font-display:"Google Sans","Google Sans Text",Roboto,"Segoe UI",Arial,sans-serif;
  --font-body:var(--mpm-font);
}

/* Shapes, Google's: 8px on small controls, 12px on fields and menus, 16px on cards, a
   full pill on anything you press. */
html[data-theme="light"], html[data-theme="dark"]{
  --style-radius-s:8px; --style-radius-m:12px; --style-radius-l:16px;
  --mpm-pill:999px;
}

/* ---- Surfaces and ink ----
   Decided once here; every rule below reads these rather than choosing its own greys. */
html[data-theme="light"]{
  --theme-bg:#F8FAFD;
  --mpm-paper:#FFFFFF;
  --mpm-ink:#1F1F1F; --mpm-ink-2:#444746; --mpm-ink-3:#747775;
  --mpm-line:#E1E3E1; --mpm-tint:#F1F3F4;
  /* The edge an app bar grows once content scrolls under it: Google's hairline plus a
     faint drop, so it reads as a lifted bar and not a ruled line. A gradient strip, not
     a box-shadow - a shadow also bleeds sideways, and where the header's met the
     sidebar corner's the two overlapped into a visible seam. */
  --mpm-bar-edge:linear-gradient(#E1E3E1 0 1px, rgba(60,64,67,.13) 1px, rgba(60,64,67,0));
  --mpm-rule:#C4C7C5;
  --mpm-shadow:rgba(60,64,67,.15);
  --mpm-ember-ink:#B06000;
  --mpm-ok-ink:#137333; --mpm-warn-ink:#B06000; --mpm-danger-ink:#B3261E;

  /* Payload's own neutral ramp, re-pointed to Google's greys so every control Payload
     draws for itself - the Columns and Filters pills, the paginator, the tabs, the sort
     arrows - lands in the same palette as everything this theme draws. */
  --theme-elevation-0:#FFFFFF;
  --theme-elevation-50:#F8FAFD;
  --theme-elevation-100:#F1F3F4;
  --theme-elevation-150:#E8EAED;
  --theme-elevation-200:#DADCE0;
  --theme-elevation-250:#C4C7C5;
  --theme-elevation-300:#BDC1C6;
  --theme-elevation-400:#9AA0A6;
  --theme-elevation-500:#80868B;
  --theme-elevation-600:#747775;
  --theme-elevation-700:#5F6368;
  --theme-elevation-800:#3C4043;
  --theme-elevation-900:#202124;
  --theme-elevation-1000:#1F1F1F;
  --theme-text:#1F1F1F;
}
html[data-theme="dark"]{
  --theme-bg:#131314;
  --mpm-paper:#1E1F20;
  --mpm-ink:#E3E3E3; --mpm-ink-2:#C4C7C5; --mpm-ink-3:#8E918F;
  --mpm-line:#444746; --mpm-tint:#282A2C;
  --mpm-bar-edge:linear-gradient(#444746 0 1px, rgba(0,0,0,.45) 1px, rgba(0,0,0,0));
  --mpm-rule:#5F6368;
  --mpm-shadow:rgba(0,0,0,.5);
  --mpm-ember-ink:#FDD663;
  --mpm-ok-ink:#81C995; --mpm-warn-ink:#FDD663; --mpm-danger-ink:#F28B82;

  --theme-elevation-0:#131314;
  --theme-elevation-50:#1E1F20;
  --theme-elevation-100:#282A2C;
  --theme-elevation-150:#333537;
  --theme-elevation-200:#444746;
  --theme-elevation-250:#4F5256;
  --theme-elevation-300:#5F6368;
  --theme-elevation-400:#757775;
  --theme-elevation-500:#8E918F;
  --theme-elevation-600:#ABAFAC;
  --theme-elevation-700:#C4C7C5;
  --theme-elevation-800:#D8DAD9;
  --theme-elevation-900:#E3E3E3;
  --theme-elevation-1000:#FFFFFF;
  --theme-text:#E3E3E3;
}
/* Google's dark theme: the accent lifts to a light blue for text and links, selected
   states go deep blue with pale text, and filled buttons keep a blue that white reads on. */
html[data-theme="dark"]{
  --mpm-v-400:#A8C7FA; --mpm-v-500:#8AB4F8; --mpm-v-600:#7CACF8; --mpm-v-700:#4C8DF6;
  --mpm-grad:linear-gradient(#1A73E8,#1A73E8);
  --mpm-sel:#004A77; --mpm-on-sel:#C2E7FF;
  --mpm-sel-2:#004A77; --mpm-on-sel-2:#C2E7FF;
  --mpm-hover:rgba(227,227,227,.08); --mpm-press:rgba(227,227,227,.12);
  --mpm-drawer:#1E1F20; --mpm-drawer-2:#1E1F20;
  --mpm-drawer-ink:#E3E3E3; --mpm-drawer-ink-2:#C4C7C5;
  --mpm-drawer-line:#444746;
  --mpm-drawer-hover:rgba(227,227,227,.08);
  --mpm-ember:#FDD663; --mpm-ok:#81C995; --mpm-warn:#FDD663; --mpm-danger:#F28B82;
}
html, body, button, input, select, textarea{ font-family:var(--mpm-font); }
h1,h2,h3,h4,.list-header h1,.doc-header__title,.render-title{ font-family:var(--mpm-font-display); }

/* ---- Primary buttons - Save, and the list "Create New" ----
   Google's filled button: flat blue, a full pill, medium weight, 40px tall. No gradient,
   no glow - on hover it lifts by one step of Google's elevation and nothing else moves.
   ("Create New" is btn--style-pill, not btn--style-primary, so it is named here too.) */
.btn.btn--style-primary,
.btn.list-create-new-doc__create-new-button{
  --color:#fff; --hover-color:#fff;
  background:var(--mpm-grad); border:none; border-radius:var(--mpm-pill); color:#fff;
  font-family:var(--mpm-font-display); font-weight:500; font-size:14px; letter-spacing:.01em;
  padding:10px 24px; min-height:40px; box-shadow:none;
  transition:box-shadow .15s, filter .15s;
}
.btn.btn--style-primary:hover,
.btn.list-create-new-doc__create-new-button:hover{
  filter:brightness(1.06);
  box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
}
.btn.btn--style-primary:active,
.btn.list-create-new-doc__create-new-button:active{ filter:brightness(.96); box-shadow:none; }
.btn.btn--style-primary svg,.btn.btn--style-primary .btn__content,
.btn.list-create-new-doc__create-new-button svg,
.btn.list-create-new-doc__create-new-button .btn__content,
.btn.list-create-new-doc__create-new-button .btn__label{ color:#fff; }
/* Google's outlined button, for the secondary actions Payload draws. */
.btn.btn--style-secondary{
  background:transparent; border:1px solid var(--mpm-rule); border-radius:var(--mpm-pill);
  color:var(--mpm-v-500); font-family:var(--mpm-font-display); font-weight:500; box-shadow:none;
}
.btn.btn--style-secondary:hover{ background:color-mix(in srgb, var(--mpm-v-500) 8%, transparent); }
.btn--icon{ color:var(--mpm-v-500); }

/* ---- Inputs: Google's focus - the outline turns blue and thickens to 2px ---- */
.field-type input:focus,
.field-type textarea:focus,
.field-type .rs__control--is-focused,
.search-filter input:focus{
  border-color:var(--mpm-v-500)!important;
  box-shadow:inset 0 0 0 1px var(--mpm-v-500)!important;
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
  padding-inline:2px;
  /* The page's ground by default; on a laptop the sidebar is a panel of its own - see
     "On a laptop the sidebar is its own panel" below. */
  background:var(--theme-bg);
  border-right:0;
  /* DO NOT give this a height of 100% or stretch it to its grid row.
     Payload already ships .nav with position:sticky, top:0 and height:100vh, correctly:
     the panel is exactly one viewport tall and stays put while the page scrolls under it.
     Stretching it to the full document height made it as tall as the scroll container,
     which leaves sticky with nothing to stick inside - so the whole sidebar scrolled
     away with the page. The "cut off half way down" that prompted it was only ever an
     artefact of full-page screenshots, where a sticky element is drawn at its resting
     position; in a real browser there is nothing below it to see.
     Its rows scroll inside Payload's .nav__scroll (on a laptop that starts below the
     header row - see further down); the auto overflow here serves the phone drawer. */
  height:100vh;
  overflow-y:auto;
  overscroll-behavior:contain;
  /* A thin scrollbar, so a nav that does overflow does not gain a heavy grey gutter. */
  scrollbar-width:thin;
}
/* On a laptop the sidebar is its own panel, not a strip of the page: its own surface (the
   paper - white in light, raised grey in dark), a hairline down its right side, and its
   own top - the menu button and the logo - so it never reads as one band with the
   page's header. (A single header spanning both, one edge running across them, was
   tried and rejected: it welded the two together.)
   Payload scrolls the rows in .nav__scroll, padded down by the header's height, so rows
   and scrollbar ran up into that top corner and slid behind the button. The scroll
   area now starts below the corner instead; the first row sits 8px under it, as Google
   Calendar's Create. Each surface grows its own edge only when IT scrolls: the page's
   header when the page does, the sidebar's top when the sidebar does. */
@media (min-width:1025px){
  .nav{ overflow:hidden; background:var(--mpm-paper); border-right:1px solid var(--mpm-line); }
  .nav__scroll{
    margin-top:var(--app-header-height, 60px);
    height:calc(100% - var(--app-header-height, 60px));
    padding-top:0;
  }
  .nav::before{
    content:""; position:absolute; top:0; left:0; right:0; z-index:1; pointer-events:none;
    height:var(--app-header-height, 60px);
    background:var(--mpm-paper);
  }
  /* The sidebar's own edge under its top, the same strip the header hangs (see
     ".app-header::after"), shown while the rows are scrolled. */
  .nav::after{
    content:""; position:absolute; left:0; right:0; top:var(--app-header-height, 60px); z-index:1;
    height:8px; pointer-events:none;
    background:var(--mpm-bar-edge); opacity:0; transition:opacity .2s ease;
  }
  html[data-mpm-nav-scrolled] .nav::after{ opacity:1; }
  /* The logo lives in that corner while the sidebar is open, right of the menu button,
     as Google's apps keep it. Positioned against .nav rather than inside the scroll
     area, so it never scrolls away with the rows. The header's own copy - and the "/"
     after it - step aside meanwhile, so the page name there lines up with the content. */
  .mpm-nav__brand{
    /* Centred in the bar by position: the mark is 42px tall (.mpm-brand--mark). */
    position:absolute; top:calc((var(--app-header-height, 60px) - 42px) / 2); left:60px; z-index:2;
    display:flex; align-items:center;
    border-radius:8px; text-decoration:none;
  }
  .mpm-nav__brand:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px; }
  .template-default--nav-open .app-header .step-nav__home,
  .template-default--nav-open .app-header .step-nav__home + span{ display:none; }
}
/* The phone drawer draws its logo in its own header (below). */
@media (max-width:1024px){ .mpm-nav__brand{ display:none; } }
/* Payload's own nav links carry no icon, so a collection list reads as a wall of words.
   Each one gets its own icon now (components/nav/nav-icons.ts), drawn as a mask filled
   with the text colour - grey in a row, violet on hover, white on the selected row, and
   right in the dark drawer too, from one drawing. */
.nav .nav__link{ position:relative; }
.nav .nav-group__content .nav__link::before{
  content:""; flex:none; display:inline-block; width:17px; height:17px;
  background:currentColor;
  -webkit-mask:var(--ico) center / contain no-repeat; mask:var(--ico) center / contain no-repeat;
}
.nav .nav-group__content .nav__link::before{ width:20px; height:20px; color:var(--mpm-ink-2); }
.nav .nav-group__content .nav__link.active::before,
.nav .nav-group__content .nav__link[aria-current="page"]::before{ color:inherit; }
/* Google's navigation rows: a full pill, 36px tall, text in ink and a 20px icon in the
   secondary ink; the page you are on sits on pale blue in bold, the way Gmail marks the
   folder you are in. */
.nav .nav__link{
  display:flex; align-items:center; gap:16px;
  font-size:14px; font-weight:400; line-height:20px; letter-spacing:.01em;
  color:var(--mpm-ink);
  min-height:36px; padding:0 16px 0 14px; margin:1px 10px 1px 6px; border-radius:var(--mpm-pill);
  transition:background .12s;
}
.nav .nav__link:hover{ background:var(--mpm-hover); color:var(--mpm-ink); }
.nav .nav__link.active,.nav a.active,.nav .nav__link[aria-current="page"]{
  background:var(--mpm-sel); color:var(--mpm-on-sel); font-weight:700; box-shadow:none;
}
.nav .nav__link.active svg,.nav .nav__link[aria-current="page"] svg{ color:inherit; }
/* Google groups its navigation under plain headings - "My calendars", "Labels" - in the
   body ink at medium weight, not shouting capitals. */
.nav .nav-group__label{ font-size:14px; font-weight:500; letter-spacing:.01em; text-transform:none; color:var(--mpm-ink); opacity:1; }
.nav__controls .btn:hover{ color:var(--mpm-v-500); }

/* ---- Group headings ----
   These are buttons that collapse a section, and they did not look like buttons: a bare
   violet word with a chevron adrift on the far right, no hover, no target beyond the
   text itself. Given the shape of a row, so the whole line is the control and it is
   obvious there is something to press.

   The chevron's rotation is set inline by Payload as it opens and closes, so nothing
   here touches transform - only how visible it is. */
.nav .nav-group__toggle{
  display:flex; align-items:center; justify-content:space-between; gap:6px;
  /* Tight enough that nine collapsed sections read as one menu rather than nine
     headings adrift on their own. */
  width:calc(100% - 13px); margin:6px 6px 1px; padding:5px 8px;
  border:0; border-radius:9px; background:none; cursor:pointer; text-align:left;
  transition:background .12s ease;
}
.nav .nav-group__toggle:hover{ background:var(--mpm-hover); }
.nav .nav-group__indicator{
  display:grid; place-items:center; width:18px; height:18px; flex:none;
  color:var(--mpm-ink-2); transition:color .12s ease;
}

/* Explicit, and thicker. Payload paints this path in --theme-elevation-400 (#9A9A9A) at
   a 1px width; behind the opacity it previously carried, the arrow that tells you a
   section opens was about 1.9:1 against the page - the control was effectively
   undiscoverable. */
.nav .nav-group__indicator .stroke{ stroke:currentColor; stroke-width:1.8; }
/* A collapsed section is a closed drawer, not a disabled one - keep it legible. */
.nav .nav-group--collapsed .nav-group__label{ color:var(--mpm-ink); }

/* Our own quick-access heading is the same kind of thing, so it is set the same way -
   it used to be a size and colour of its own for no reason anyone could see. */
.mpm-nav__quick-title{
  font-size:14px !important; font-weight:500; letter-spacing:.01em; text-transform:none;
  color:var(--mpm-ink) !important;
}
.mpm-nav{ border-bottom-color:var(--mpm-line) !important; }

/* ---- The brand ----
   The real logo, in both colourways (components/graphics). One is shown per theme: the
   blue wordmark on light, the white one on dark, as the website does on its header and
   footer. Payload stamps the theme on <html>, so this is the only switch needed. */
.mpm-brand{ display:inline-flex; align-items:center; flex:none; line-height:0; }
.mpm-brand img{ display:block; width:auto; max-width:none; }
.mpm-brand__dark{ display:none !important; }
html[data-theme="dark"] .mpm-brand__light{ display:none !important; }
html[data-theme="dark"] .mpm-brand__dark{ display:block !important; }
/* The header mark. 34px tall is 103px wide - comfortably clear of the "/" after it, and
   big enough that the pin in the "o" still reads as a pin. */
.mpm-brand--mark img{ height:42px; }
@media (max-width:640px){ .mpm-brand--mark img{ height:38px; } }
/* The login lockup, never under the 240px the brand guideline sets for it: below that
   the tagline stops being readable. */
.mpm-brand--lockup img{ width:300px; height:auto; }

/* Nothing around the logo may clip it (nav header, app header, login). */
.nav__header,.nav__brand,.nav__logo,.nav__link--logo,.graphic-logo,.app-header__logo{ overflow:visible; }
:has(> .mpm-brand){ overflow:visible; height:auto; min-height:0; }
/* Payload's breadcrumb home slot is a 16px box built for a small house icon; left at
   that size the logo overflows it and the "/" after it prints across the artwork.
   Sized to what it holds, with room between the logo and the separator. */
.step-nav__home,
.step-nav__home > span{
  display:inline-flex; align-items:center;
  width:auto; min-width:0; height:auto; min-height:0;
}
.step-nav__home{ margin-right:4px; }

/* =============== The header ===============
   One header at every width. It used to be three different things: on a laptop no edge
   at all (it melted into the page title and scrolled away) with a 24px grey square for
   the menu, and on a phone a sticky bar with a glowing blue 44px tile that out-shouted
   the logo beside it. Now: a pinned bar with a hairline edge, the same quiet menu
   button, the logo, the breadcrumb, and who is signed in. */
html[data-theme="light"], html[data-theme="dark"]{ --app-header-height:60px; }
.app-header{
  position:sticky; top:0; z-index:60;
  /* Google's app bar: the page's own ground and no rule under it - the white cards
     below are what separate content from chrome. */
  background:var(--theme-bg);
  border-bottom:0;
}
/* ...until the page scrolls: then the bar grows a hairline and a soft shadow, so what
   slides beneath it visibly goes under an edge instead of vanishing into a flat band
   (ScrollEdge sets the attribute). Drawn as a strip hanging below the bar, so the bar's
   height never changes, and - unlike a box-shadow - it does not bleed sideways over the
   sidebar, which has its own edge for its own scrolling. */
.app-header::after{
  content:""; position:absolute; left:0; right:0; top:100%; height:8px; pointer-events:none;
  background:var(--mpm-bar-edge); opacity:0; transition:opacity .2s ease;
}
html[data-mpm-scrolled] .app-header::after{ opacity:1; }
/* Anything that pinned itself to the top of the page now pins under the header instead
   of sliding beneath it - the document bar with Save on a lead, above all. */
.doc-controls{ top:var(--app-header-height); }

/* The menu button: one look for the laptop toggle and the phone one. Each is styled
   only at the width where Payload shows it - styling both everywhere overrode Payload's
   own hiding, and put two menu buttons on every screen. */
@media (min-width:1025px){
  .template-default__nav-toggler-wrapper{ padding-left:4px; }
  .template-default__nav-toggler-wrapper .nav-toggler{ width:44px; height:44px; display:grid; place-items:center; }
  /* With the sidebar shut its toggle sits in the header's left gutter, right where the
     logo starts; the logo steps in just enough to clear the button's round hover. */
  .template-default:not(.template-default--nav-open) .app-header .step-nav{ margin-left:4px; }
  /* The page below the header gets air: a 60px bar with an edge left the title row's
     "Create New" button touching that edge. */
  .app-header{ margin-bottom:10px; }
}
@media (max-width:1024px){
  button.nav-toggler.app-header__mobile-nav-toggler{ width:44px; height:44px; justify-content:center; }
}
.template-default__nav-toggler-wrapper .nav-toggler,
button.nav-toggler.app-header__mobile-nav-toggler{
  /* Google's icon button: no frame at all, a round state layer on hover. */
  padding:0;
  border:0; border-radius:50%;
  background:transparent; color:var(--mpm-ink-2);
  box-shadow:none;
  transition:background .12s ease;
}
@media (max-width:1024px){
  /* Payload hides this one's icon below 1025px; the empty frame must go with it. */
  .template-default__nav-toggler-wrapper .nav-toggler{ display:none; }
}
.template-default__nav-toggler-wrapper .nav-toggler:hover,
button.nav-toggler.app-header__mobile-nav-toggler:hover{ background:var(--mpm-hover); }
.template-default__nav-toggler-wrapper .nav-toggler:active,
button.nav-toggler.app-header__mobile-nav-toggler:active{ background:var(--mpm-press); }
.template-default__nav-toggler-wrapper .nav-toggler:focus-visible,
button.nav-toggler.app-header__mobile-nav-toggler:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px; }
.template-default__nav-toggler-wrapper .nav-toggler .hamburger,
button.nav-toggler.app-header__mobile-nav-toggler .hamburger{
  width:auto; height:auto; background:none; box-shadow:none; border-radius:0;
}
.template-default__nav-toggler-wrapper .nav-toggler .stroke,
button.nav-toggler.app-header__mobile-nav-toggler .stroke{ stroke:currentColor; }
/* The menu glyph is Google's own Material "menu" at 24px. Payload's drew three 1px lines
   11px wide inside its 20px box - a faint scribble next to the 32px avatar. */
.template-default__nav-toggler-wrapper .nav-toggler .hamburger__open-icon,
button.nav-toggler.app-header__mobile-nav-toggler .hamburger__open-icon{
  width:24px; height:24px; background:currentColor;
  -webkit-mask:${materialUrl('menu')} center / contain no-repeat;
  mask:${materialUrl('menu')} center / contain no-repeat;
}
.template-default__nav-toggler-wrapper .nav-toggler .hamburger__open-icon svg,
button.nav-toggler.app-header__mobile-nav-toggler .hamburger__open-icon svg{ display:none; }
/* Payload dims the laptop toggle to half opacity while the menu is open, which made it
   look disabled; it stays at full strength. */
.nav-toggler--is-open{ opacity:1; }

/* The breadcrumb after the logo: a quiet separator, the page in ink, and a long record
   name shortened rather than wrapped.

   IT IS THE PART THAT GIVES WAY. On a lead the trail reads "Leads / Sushil Kumar Singh",
   and its wrapper would not shrink below that full width, so on a phone it shoved the
   account badge off the right edge - which widened the page to 434px, made the phone
   zoom out, and dropped the pinned Save bar partly below the screen. Every box between
   the header and the last crumb is now allowed to shrink, and only the last crumb (the
   record's name) actually does, ending in "...". The logo, the menu button and the
   badge keep their size. */
.app-header__controls-wrapper,.app-header__step-nav-wrapper{ min-width:0; overflow:hidden; }
.step-nav{ min-width:0; gap:8px; overflow:hidden;
  /* Set like the product name in Google's app bar: Google Sans, large, regular weight,
     secondary ink - "Calendar", "Drive". */
  font-family:var(--mpm-font-display); font-size:20px; font-weight:400; color:var(--mpm-ink-2); }
/* On a phone the header carries only the menu button and the account - Gmail's phone bar.
   The page names itself in its own title just below, and the logo lives in the menu
   drawer, so the logo and the trail here only repeated them in a cramped strip. The
   wrapper stays (empty) and keeps its flex space, so the account stays at the right. */
@media (max-width:640px){ .app-header .step-nav{ display:none; } }
.step-nav > *{ flex-shrink:0; }
.step-nav > .step-nav__last{ flex:0 1 auto; min-width:0; }
/* Payload caps every crumb at 160px, which cut a record's name short on a laptop with
   the whole header free. The space rule above does that job now, so the cap is lifted. */
.step-nav span.step-nav__last{ max-width:min(420px, 100%); }
.step-nav a,.step-nav span{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.step-nav a{ color:var(--mpm-ink-2); font-weight:400; text-decoration:none; }
.step-nav a:hover{ color:var(--mpm-ink); }
.step-nav__last{ color:var(--mpm-ink); font-weight:400; }

/* Who is signed in - see components/nav/AccountAvatar. Google's account button: the
   avatar alone, 32px, with a round state layer around it on hover. */
.app-header__account{ text-decoration:none; border-radius:50%; }
.app-header__account:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:3px; }
.mpm-me{ display:inline-grid; place-items:center; width:44px; height:44px; border-radius:50%;
  transition:background .12s ease; }
.app-header__account:hover .mpm-me,.mpm-me.is-on{ background:var(--mpm-hover); }
.mpm-me__disc{ display:grid; place-items:center; width:32px; height:32px; border-radius:50%; flex:none;
  background:var(--mpm-v-500); color:#fff; font-family:var(--mpm-font-display);
  font-size:14px; font-weight:500; letter-spacing:.02em; }
html[data-theme="dark"] .mpm-me__disc{ background:#1A73E8; }

/* ---- Cards, tables, popups: rounder + softer ---- */
/* ---- Cards ----------------------------------------------------------------
   One card treatment for the whole admin: white paper, a hairline that defines the edge,
   and a two-part shadow - 1px of contact plus a wide, soft lift. The old card had a
   tinted border and no shadow, so on a coloured page it read as an outline rather than
   an object. */
/* Google's outlined card: white, a 1px hairline, 16px corners, no shadow at rest. */
.card{
  background:var(--mpm-paper);
  border-radius:var(--style-radius-l);
  border:1px solid var(--mpm-line);
  box-shadow:none;
  transition:box-shadow .15s;
}
a.card:hover,.card--has-link:hover,.card:hover{
  box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
}
/* ---- The list view --------------------------------------------------------
   "Create New" is rendered inline with the <h1>, so on every collection screen the main
   action sat jammed against the heading with the description wrapping underneath it.
   The heading row becomes a proper flex row: title left, action hard right, description
   on its own line below both. */
/* Payload wraps the heading and the action together in .list-header__title-and-actions,
   so pushing THAT to the right sends the title with it. The pair is the flex row: title
   hard left, action hard right. */
.list-header__title-and-actions{
  display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%;
}
.list-header h1{ margin:0; font-family:var(--mpm-font-display); font-size:24px; font-weight:400; letter-spacing:0; color:var(--mpm-ink); }
.list-header__after-header-content,.collection-list__sub-header{ margin-top:6px; }

/* The list table itself: a card, not a bare grid on the page. */
.collection-list .table{
  background:var(--mpm-paper); border:1px solid var(--mpm-line);
  border-radius:var(--style-radius-l); overflow:hidden;
}
.collection-list .table td,.collection-list .table th{ padding:12px 16px; }
.collection-list .table tbody tr{ border-top:1px solid var(--mpm-line); }
.collection-list .table tbody tr:first-child{ border-top:0; }
@media (hover:hover){
  /* Google's list row hover: the page's pale blue-grey, no colour of its own. */
  .collection-list .table tbody tr:hover{ background:color-mix(in srgb, var(--mpm-sel) 35%, transparent); }
}

/* Cells shared by the list views. Kept here rather than in a per-component sheet because
   Payload renders each cell on its own, and one injected stylesheet per table row would
   be absurd.

   NOTE: never write the literal tag name s-t-y-l-e inside this string. React escapes it
   on the server (as a CSS escape) to stop a nested tag closing the real one, and does not
   on the client - so the two renders differ by a few characters and the whole admin tree
   fails hydration and is thrown away and rebuilt. One word in a comment did exactly that. */
/* The first column is the way into a document, so it has to look like one - and, having
   been rebuilt by hand, has to be given the hit area Payload's own wrapper provided. */
.mpm-cell-link{ display:block; color:inherit; text-decoration:none; }
.mpm-cell-link:hover{ color:var(--mpm-v-500); text-decoration:underline; }
.mpm-cell-link:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px;
  border-radius:4px; }
.mpm-cellq{ font-variant-numeric:tabular-nums; font-weight:600; }
.mpm-cell-empty{ color:var(--mpm-ink-3); }
.mpm-cell-money{ font-variant-numeric:tabular-nums; font-weight:600; }
.mpm-cell-when{ color:var(--mpm-ink-2); white-space:nowrap; }
.mpm-cell-pill{
  display:inline-block; padding:3px 10px; border-radius:8px;
  background:color-mix(in srgb, var(--c) 16%, transparent);
  color:var(--mpm-ink); font-size:12px; font-weight:600; white-space:nowrap;
}
[data-theme="dark"] .mpm-cell-pill{ background:color-mix(in srgb, var(--c) 28%, transparent); }

/* Scrolls sideways rather than swallowing a column.
   "overflow:hidden" was here for the rounded corners, and it also meant that once the
   columns stopped fitting the last of them was simply cut off with no way to reach it.
   Clipped vertically, scrollable horizontally: the corners stay round and nothing
   becomes unreachable. On a phone the rows are cards, so nothing overflows and no
   scrollbar appears. */
.table{ border-radius:var(--style-radius-m); overflow-x:auto; overflow-y:hidden; }
.table thead th{
  /* Google's table heading (Drive, Sheets): plain, medium weight, secondary ink - no
     band of colour and no capitals. */
  background:var(--mpm-paper); color:var(--mpm-ink-2);
  font-size:13px; font-weight:500; letter-spacing:.01em; text-transform:none;
  border-bottom:1px solid var(--mpm-line);
}
/* Gmail's search bar: a wide pill on a tinted fill, white with a lift when you use it. */
.search-filter__input,.collection-list .search-filter input{
  background:color-mix(in srgb, var(--mpm-sel) 45%, var(--mpm-tint)) !important;
  border:0 !important; border-radius:var(--mpm-pill) !important; min-height:46px;
  font-size:15px; box-shadow:none !important;
}
html[data-theme="dark"] .search-filter__input,html[data-theme="dark"] .collection-list .search-filter input{
  background:#282A2C !important;
}
.search-filter__input:focus,.collection-list .search-filter input:focus{
  background:var(--mpm-paper) !important;
  box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15) !important;
}
.popup__content{ border-radius:var(--style-radius-m); }
.pill{ border-radius:var(--mpm-pill); }
/* Every remaining control in Payload's own chrome takes the curve too, so nothing in the
   admin is square while our screens are round. */
.btn,.btn--style-secondary,.btn--style-pill,
.search-filter input,.field-type input,.field-type textarea,.field-type select,
.rs__control,.doc-controls__controls .btn{ border-radius:var(--style-radius-m); }
.btn--style-pill,.btn--style-secondary{ border-radius:var(--mpm-pill); }
/* Google's outlined text field: a flat 8px box with a hairline - no shadow - that turns
   blue on focus (see "Inputs" above). */
.field-type input,.field-type textarea,.field-type select,.rs__control,
.react-datepicker__input-container input{
  border-radius:8px; box-shadow:none !important; border-color:var(--mpm-rule);
}
/* Payload's Columns and Filters toggles, as Google filter chips - the same chips as the
   Status, Source, Owner and Date filters beside them. */
.list-controls .pill,.list-controls__buttons .pill{
  min-height:32px; padding:0 12px; border-radius:8px;
  border:1px solid var(--mpm-rule); background:transparent; color:var(--mpm-ink-2);
  font-size:14px; font-weight:500; box-shadow:none;
}
.list-controls .pill:hover{ background:var(--mpm-hover); color:var(--mpm-ink); }
.list-controls .pill--is-active,.list-controls .pill[aria-expanded="true"]{
  background:var(--mpm-sel-2); border-color:transparent; color:var(--mpm-on-sel-2);
}

/* ---- The last of Payload's black ----
   Three controls in the stock chrome set no colour at all, so they inherited the UA's
   #000: the sort chevrons on every column heading, the search box's own text, and the
   sidebar collapse toggle. Against slate ink at #0F1523 a true black reads as a smudge,
   and the chevrons in particular looked like a rendering fault rather than a control.
   They are the only three that the elevation ramp could not reach. */
/* ---- The tab strip's overflow fade, brought back down to earth ----
   Payload fades the right edge of the document tabs to hint that they scroll. Useful.
   It ships at z-index 1111, which is not: that is above every dialog and above this
   theme's nav drawer at 120, so on a phone the fade painted a pale square straight
   through the open drawer, next to the Schedule button, apparently from nowhere. It is
   pointer-events:none, so it sat above everything while staying invisible to every hit
   test - which is why it took a paint-order hunt rather than a click to find.

   z-index 1 is all it ever needed: enough to sit over the tabs it fades, nowhere near
   enough to escape them. */
.doc-tabs::after{ z-index:1; }

.sort-column__button{ color:var(--mpm-ink-3); }
.sort-column__button:hover{ color:var(--mpm-v-500); }
.sort-column__button--active,
.sort-column__asc--active,
.sort-column__desc--active{ color:var(--mpm-v-500); }
.search-filter__input,
.field-type input,.field-type textarea,
.relationship--single-value__text,
.relationship--single-value__label{ color:var(--theme-text); }
.nav-toggler{ color:var(--mpm-ink-2); }

/* A row's title in a stock list is underlined, while the same link on the Leads and
   Proposals boards is not - two lists, two answers to "is this a link". The underline
   moves to hover, which is where it is on every other link in this admin. */
.table td a:not(.btn):not(.mpm-cell-link){ text-decoration:none; }
.table td a:not(.btn):not(.mpm-cell-link):hover{ text-decoration:underline; }

/* ---- Pipeline chips ----
   Payload tags a select cell with its own value - a span classed selected--quoted - which
   is the hook for colouring the pipeline with no custom component at all. The colours are
   the ones in components/dashboard/lead-status.ts, so a stage looks the same in the list
   as it does on the dashboards, and that file stays the single definition.

   The text colour is mixed toward --mpm-ink rather than stated outright, so one rule
   reads correctly in both themes: toward near-black on paper, toward near-white on dark. */
.cell-status > span[class*="selected--"]{
  /* Google's label chip: an 8px-cornered tint of the stage colour, sentence case,
     medium weight - Gmail's labels, not a row of shouting capitals. */
  --chip:#80868B;
  display:inline-flex; align-items:center; gap:6px; white-space:nowrap;
  padding:3px 10px 3px 8px; border-radius:8px;
  font-size:12px; font-weight:500; letter-spacing:.01em; text-transform:none;
  background:color-mix(in srgb, var(--chip) 13%, transparent);
  border:0;
  color:color-mix(in srgb, var(--chip) 62%, var(--mpm-ink));
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
  display:flex; align-items:center; flex-wrap:wrap; gap:8px;
  margin:0 0 10px; padding:8px 10px;
  border:1px solid var(--mpm-line); border-radius:12px;
  background:var(--mpm-tint); color:var(--mpm-ink);
  font-size:12px;
}
.mpm-bulk__count{ color:var(--mpm-soft); }
.mpm-bulk__count strong{ color:var(--mpm-ink); font-size:13px; }
.mpm-bulk__who{
  min-width:156px; max-width:100%;
  padding:5px 7px; border-radius:8px;
  border:1px solid var(--mpm-line);
  background:var(--theme-input-bg,var(--theme-elevation-0));
  color:var(--mpm-ink); font-size:12px;
}
.mpm-bulk__go,.mpm-bulk__cancel{
  padding:5px 11px; border-radius:8px; font-size:11px; font-weight:600;
  border:1px solid transparent; cursor:pointer;
}
.mpm-bulk__go{ background:var(--mpm-grad); color:#fff; }
.mpm-bulk__go:disabled{ opacity:.5; cursor:not-allowed; }
.mpm-bulk__cancel{ background:transparent; border-color:var(--mpm-line); color:var(--mpm-soft); }
/* The confirm step keeps the bar's shape and swaps its contents, so the row does not
   jump as it changes - the button you are about to press stays where your eye is. */
.mpm-bulk__confirm{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
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

.cell-status > span.selected--new{ --chip:#0B57D0; }
.cell-status > span.selected--assigned{ --chip:#0B57D0; }
.cell-status > span.selected--reassigned{ --chip:#0B57D0; }
.cell-status > span.selected--contacted{ --chip:#5F6368; }
.cell-status > span.selected--call-not-picked{ --chip:#D93025; }
.cell-status > span.selected--call-later{ --chip:#007B83; }
.cell-status > span.selected--follow-up{ --chip:#007B83; }
.cell-status > span.selected--quoted{ --chip:#E37400; }
.cell-status > span.selected--scheduled{ --chip:#039BE5; }
.cell-status > span.selected--won{ --chip:#188038; }
.cell-status > span.selected--lost{ --chip:#80868B; }
.cell-status > span.selected--invalid{ --chip:#B3261E; }

/* ---- The dial strip ----
   A number, a Call button and a WhatsApp button. Ringing the customer is what this screen
   exists for, so it is the one thing in a row styled like a control rather than a field. */
/* One variable drives the button size everywhere, so the reserved width below can be
   derived from it rather than guessed at. */
.mpm-dial{ --dial:34px; display:inline-flex; align-items:center; gap:7px; }
.mpm-dial__num{ font-variant-numeric:tabular-nums; letter-spacing:.01em; color:var(--mpm-ink); }
/* Two fixed slots, always, even when only one button is there.
   Phone numbers are not all the same length - ten digits, a +91 prefix, the odd nine-digit
   landline - and the buttons used to start wherever the text happened to end, so they
   stepped left and right down the column. Worse, a number WhatsApp cannot take renders the
   call button alone, which moved it again.
   A first attempt reserved 61px, which looked right and was not: the admin's root font
   size is about 13px, not 16, so it resolved to 61px against a 73px pair and the
   single-button rows still sat 12px out. Two slots sized from --dial cannot be wrong by
   arithmetic - the second simply stays empty. */
.mpm-dial__btns{
  display:grid; grid-template-columns:repeat(2, var(--dial));
  align-items:center; justify-items:start;
  gap:5px; flex:none;
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
  /* Google's tonal icon buttons (Contacts, Phone): a pale fill with the icon in the deep
     shade of the same colour - clearly a control, without two saturated discs on every
     row. Call is the Google blue; WhatsApp keeps its own green, toned the same way. */
  color:var(--mpm-on-sel); border-color:transparent; background:var(--mpm-sel); box-shadow:none;
}
.mpm-dial__btn--wa{
  color:#0D5B2A; border-color:transparent; background:#C4EED0; box-shadow:none;
}
html[data-theme="dark"] .mpm-dial__btn--wa{ color:#C4EED0; background:#0F5223; }
.mpm-dial__btn--call:hover,.mpm-dial__btn--wa:hover{
  box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
}
.mpm-dial--field{ --dial:44px; }
.mpm-dial-field{ margin:-5px 0 14px; }

/* In a table, the cell is the same width on every row, so anchoring the buttons to its
   right edge is what actually puts them in a straight line. Tabular figures stop the
   numbers themselves jittering as digit widths change. */
.table td.cell-phone .mpm-dial{
  display:grid; grid-template-columns:minmax(0,1fr) auto;
  align-items:center; width:100%; gap:8px;
}
/*
 * The number keeps its own track and clips inside it.
 *
 * "minmax(0,1fr)" lets the track shrink below its content, which is what stops the
 * column forcing the table wide - but a grid item does not clip just because its track
 * is small, so the digits carried straight on underneath the buttons. Adding a column to
 * this list is all it took to expose that. Clipping is the backstop; the min-width below
 * is what keeps it from ever being needed.
 */
.table td.cell-phone .mpm-dial__num{
  font-variant-numeric:tabular-nums;
  min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
/* Room for a +91 number and both buttons, derived from the button size rather than
   guessed: a truncated phone number is no use to anybody, so the cell asks for the width
   it actually needs and the table scrolls if the window cannot give it.

   The 140 is measured, not estimated: a 13-digit +91 number renders at 95px in this
   face, the grid gap is 8, and the cell's own padding is 28. A first attempt at 108
   held the cell at exactly 176px and still clipped, because it had counted the buttons
   and forgotten everything around them. */
.table td.cell-phone{ min-width:calc(var(--dial, 34px) * 2 + 140px); }

/* Owner and age. An unclaimed lead is the one thing in the list that needs a decision
   from whoever is reading it, so it is the one thing wearing the ember. */
.mpm-owner{ color:var(--mpm-ink-2); font-weight:400; }
.mpm-owner--none{ color:var(--mpm-ember-ink); font-weight:500; }
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
  padding-right:clamp(13px, 2.5vw, 26px);
}
.document-fields--has-sidebar .document-fields__sidebar-wrap{
  padding-left:clamp(10px, 1.5vw, 16px);
}

/* ================= Login / minimal (create-first-user, forgot) ================= */
.login.template-minimal,.template-minimal{
  /* Google's sign-in page: a flat pale-blue ground and a white card with 28px corners,
     no glow and no drop shadow. */
  background:#F0F4F9;
}
html[data-theme="dark"] .login.template-minimal,html[data-theme="dark"] .template-minimal{ background:#131314; }
.template-minimal__wrap{
  max-width:448px; width:100%;
  padding:40px 36px 36px;
  background:var(--mpm-paper);
  border:0;
  border-radius:28px;
  box-shadow:none;
}
.login__brand{ display:flex; justify-content:center; margin-bottom:21px; }
.login__form .field-type{ margin-bottom:13px; }
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
    margin-bottom:9px;
    padding:12px 13px 13px;
    border:1px solid var(--mpm-line);
    border-radius:16px;
    background:var(--mpm-paper);
    /* Google's outlined card: the hairline is the edge; no shadow at rest. */
    box-shadow:none;
  }
  .table tbody tr:last-child{ margin-bottom:0; }
  /* min-width:0 is what makes the cards work at all. Payload's table sheet puts a
     150px min-width on cells - reasonable for a column that has to hold a heading,
     wrong for a grid item on a 360px screen, where a 60px status chip claimed 150px
     and overflowed left across the name beside it. Not in any readable stylesheet
     rule, so it is overridden rather than traced.

     Written with .collection-list in front so it outranks this sheet's own desktop rule,
     ".collection-list .table td { padding:12px 14px }". Without it the desktop padding
     won, and every cell in a card - an empty one included - stood 24px taller than its
     text: a blank band under the name for a lead with no service, another at the foot
     for one with no due date.

     max-width for the same reason as min-width: Payload caps table cells at 70vw, which
     on a card stopped the full-width dial strip at 273px of a 324px card and left its
     buttons short of the edge everything else lines up on. */
  .table tbody td,
  .collection-list .table tbody td{
    border:0 !important; padding:0;
    min-width:0 !important; width:auto !important; max-width:none;
  }

  /* The name is the heading of the card. */
  .table td.cell-name{ font-family:var(--mpm-font-display); font-size:15px; font-weight:500; line-height:1.28; letter-spacing:0; }
  .table td.cell-name a{ text-decoration:none; color:var(--mpm-ink); }
  /* Service sits under it as the subtitle. */
  .table td.cell-service{ font-size:10px; color:var(--mpm-ink-2); }

  /* ---- Leads: an explicit grid ----
     Every cell defaults to the full width, and the six known columns are given a row and
     a column outright. This replaces a reserved right-hand gutter, which existed only so
     an absolutely positioned status chip had somewhere to sit, and which left a third of
     every line below the first one blank. Placing by grid area also means DOM order stops
     mattering: the chip sits beside the name however Payload chooses to emit it. */
  .collection-list--leads .table tbody tr{
    display:grid;
    /* The containing block for the heading link that is stretched over the card. */
    position:relative;
    /* Three columns now: the tick box, the body, and the right-hand gutter the status
       chip and date sit in. */
    grid-template-columns:auto minmax(0,1fr) auto;
    column-gap:10px;
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
    min-width:34px; min-height:34px; margin-left:-3px;
  }
  .collection-list--leads .table td.cell-name{ grid-area:1 / 2 / 2 / 3; align-self:center; }
  .collection-list--leads .table td.cell-status{ grid-area:1 / 3 / 2 / 4; justify-self:end; }
  .collection-list--leads .table td.cell-service{ grid-area:2 / 2 / 3 / 4; margin-top:2px; }
  /* The move date sits under the service, where the eye already is, rather than falling
     to a row of its own at the foot of the card as a column with no named place does. */
  /* Flex, so "Due" and the date share a line: Payload wraps the date in a flow-root span,
     which is block-level and would otherwise drop it under its own label. */
  .collection-list--leads .table td.cell-dueAt{
    grid-area:3 / 2 / 4 / 4; margin-top:5px;
    display:flex; align-items:baseline; gap:4px;
    font-size:11px; font-weight:600; color:var(--mpm-ink);
  }
  .collection-list--leads .table td.cell-dueAt::before{
    content:"Due "; font-weight:500; color:var(--mpm-ink-3);
  }
  /* Most leads have no service yet or nothing promised, and a card should not keep a
     line for a fact it does not have. A missing service is an empty cell; a missing
     date is Payload's two empty spans. */
  .collection-list--leads .table td.cell-service:empty,
  .collection-list--leads .table td.cell-dueAt:has(> span > span:empty),
  .collection-list--leads .table td.cell-dueAt:empty{ display:none; }
  .collection-list--leads .table td.cell-phone{ grid-area:4 / 1 / 5 / 4; }
  .collection-list--leads .table td.cell-assignedTo{ grid-area:5 / 1 / 6 / 3; align-self:center; }
  .collection-list--leads .table td.cell-createdAt{ grid-area:5 / 3 / 6 / 4; justify-self:end; align-self:center; }

  /* The dial strip spans the card, so it reads as the button it is. */
  .collection-list--leads .table td.cell-phone{
    margin:9px 0;
    padding:5px 6px 5px 10px;
    border:1px solid var(--mpm-line);
    border-radius:12px;
    background:var(--mpm-tint);
  }
  .collection-list--leads .table td.cell-phone .mpm-dial{
    display:flex; width:100%; align-items:center; justify-content:space-between;
  }
  .collection-list--leads .table td.cell-phone .mpm-dial__num{ font-size:12px; font-weight:600; }

  /* Touch targets, phone-sized.
     These two sit side by side under a thumb. At 34px with a 5px gap - which is 5px,
     not 6.4px, because the admin's root font is 13px - the live areas are close enough
     that aiming for WhatsApp catches Call. Ringing a customer by accident is a worse
     mistake than a tap that does nothing, so the gap has to clear a fingertip rather
     than just look separated: 40px targets with 14px of dead space between them.
     The field variant keeps its own larger size. */
  .mpm-dial{ --dial:40px; }
  .mpm-dial--field{ --dial:44px; }
  .mpm-dial__btns{ gap:14px; }
  .collection-list--leads .table td.cell-assignedTo,
  .collection-list--leads .table td.cell-createdAt{ font-size:10px; }

  /* ---- A list of cards is not itself a card ----
     The table keeps a white ground, a border and a 20px radius from the desktop rule, and
     the row cards sit INSIDE it - so every screen showed a card within a card, their
     rounded corners crossing, and the rows landed flush against the outer right border
     while sitting 17px in from its left. Two frames for one list.
     On a phone the rows ARE the cards: the container goes back to being a plain list. */
  .collection-list .table{
    background:transparent; border:0; border-radius:0; overflow:visible; padding:0;
  }
  .collection-list .table tbody tr{
    margin:0 0 10px; width:auto;
    background:var(--mpm-paper);
    border:1px solid var(--mpm-line);
    border-radius:16px;
    box-shadow:none;
  }
  .collection-list .table tbody tr:last-child{ margin-bottom:0; }
  /* The desktop rule draws a divider between rows; separate cards do not need one. */
  .collection-list .table tbody tr{ border-top:1px solid var(--mpm-line); }

  /* ---- Proposals: the same explicit grid ----
     Without one, every cell fell to the full width on a row of its own and one proposal
     filled a whole phone screen - six facts in seven hundred pixels. Four lines instead:
     the quote number with its status beside it, the customer, the route, then the money
     against the date. */
  .collection-list--proposals .table tbody tr{
    display:grid;
    /* The containing block for the heading link that is stretched over the card. */
    position:relative;
    grid-template-columns:auto minmax(0,1fr) auto;
    column-gap:10px;
    row-gap:2px;
    align-items:start;
  }
  .collection-list--proposals .table tbody td{ grid-column:1 / -1; }
  .collection-list--proposals .table td.cell-_select{
    display:flex; align-items:center; justify-content:center;
    grid-area:1 / 1 / 2 / 2;
    min-width:34px; min-height:34px; margin-left:-3px;
  }
  .collection-list--proposals .table td.cell-title{ grid-area:1 / 2 / 2 / 3; align-self:center; }
  .collection-list--proposals .table td.cell-status{ grid-area:1 / 3 / 2 / 4; justify-self:end; align-self:center; }
  .collection-list--proposals .table td.cell-clientName{ grid-area:2 / 2 / 3 / 4; }
  .collection-list--proposals .table td.cell-route{ grid-area:3 / 2 / 4 / 4; }
  .collection-list--proposals .table td.cell-amount{ grid-area:4 / 2 / 5 / 3; align-self:center; }
  .collection-list--proposals .table td.cell-updatedAt{ grid-area:4 / 3 / 5 / 4; justify-self:end; align-self:center; }
  /* The quote number is the card's heading; the customer is its subtitle. */
  /* A quote number is one word. The browser treats its hyphens as break opportunities,
     so "MPM-20260912-68" split across two lines in a column that had room for it. */
  .collection-list--proposals .table td.cell-title{ font-family:var(--mpm-font-display); font-size:15px; font-weight:500; }
  /* The clipping happens on the number itself rather than on the cell, so that the link
     stretched over the whole card below is not cut back to the cell it lives in. */
  .collection-list--proposals .table td.cell-title .mpm-cellq{
    display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  /* Four short lines do not need fifty pixels each. */
  .collection-list--proposals .table tbody tr{ padding:11px 12px; }
  .collection-list--proposals .table tbody td{ line-height:1.35; min-height:0; }
  .collection-list--proposals .table td.cell-title a{ text-decoration:none; color:var(--mpm-ink); }
  .collection-list--proposals .table td.cell-clientName{ font-size:12px; color:var(--mpm-ink); }
  .collection-list--proposals .table td.cell-route{ font-size:11px; color:var(--mpm-ink-2); }
  .collection-list--proposals .table td.cell-amount{ font-size:13px; font-weight:500; }
  .collection-list--proposals .table td.cell-updatedAt{ font-size:10px; color:var(--mpm-ink-3); }
  /* These four already say what they are - a quote number, a name, a route, a rupee
     figure - so the generic "Amount"/"Updated" labels are noise on a card this small. */
  .collection-list--proposals .table td.cell-amount::before,
  .collection-list--proposals .table td.cell-updatedAt::before,
  .collection-list--proposals .table td.cell-route::before,
  .collection-list--proposals .table td.cell-clientName::before{ content:none !important; }

  /* ---- The whole card opens the record ----
     In the table this row came from, the way in is the first column, which here is a
     seventeen-pixel line of text - a target a thumb misses more often than it hits. The
     heading's own link is stretched over the entire card instead, so anywhere in the card
     opens it, while the two things that are NOT the link - the select box and the dial
     button - are lifted above the overlay so they still do their own job. */
  /* Payload gives the first cell position:relative and the link inside it
     overflow:hidden, either of which would cut the overlay back to the width of the
     heading. Both are stood down, for these two lists, on a phone only. */
  .collection-list--leads .table td.cell-name,
  .collection-list--proposals .table td.cell-title{ position:static; z-index:auto; overflow:visible; }
  .collection-list--leads .table td.cell-name .mpm-cell-link,
  .collection-list--proposals .table td.cell-title .mpm-cell-link{ position:static; overflow:visible; }
  .collection-list--leads .table td.cell-name .mpm-cell-link::after,
  .collection-list--proposals .table td.cell-title .mpm-cell-link::after{
    content:''; position:absolute; inset:0; z-index:5; border-radius:inherit;
    /* Payload puts every cell at z-index 1, so the overlay clears that tier and the two
       controls below clear the overlay. */
  }
  /* Raised on the CELL, not on the control inside it: Payload gives every cell
     position:relative and z-index:1, which makes each one a stacking context, so a
     z-index on a child is sealed inside it and never clears the overlay. */
  .collection-list--leads .table td.cell-_select,
  .collection-list--leads .table td.cell-phone,
  .collection-list--proposals .table td.cell-_select{ position:relative; z-index:6; }

  /* ---- The list header on a phone ----
     Payload wraps the heading and the action together and lets them wrap, so "Create New"
     dropped onto a line of its own, left-aligned, and ate a fifth of the first screen
     before a single record was visible. One row: heading left, action hard right, where
     a thumb already is. */
  /* Payload sets align-items:flex-start on this row from its own sheet, which loads after
     ours, so the action sat 34px below the heading it is level with. Overridden on that
     one property rather than by out-specifying the whole block. */
  /* Payload switches this row to flex-direction:column below its own breakpoint, which is
     what put "Create New" on a line of its own - not wrapping, and not alignment. Back to
     a row, and the action keeps the right-hand end where a thumb already rests. */
  .list-header__title-and-actions{
    flex-direction:row !important;
    flex-wrap:nowrap; gap:10px;
    align-items:center !important;
  }
  .list-header__title-actions{ margin-bottom:0 !important; }
  .list-header__title{
    flex:1 1 auto; min-width:0; font-size:19px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  .list-header__title-actions{ flex:none; margin-left:auto; }
  /* Payload renders this as a block, so its label sat against the top of a 36px pill
     rather than in the middle of it. A flex box centres on both axes at once. */
  .list-header__title-actions .btn,
  .list-header .btn.list-create-new-doc__create-new-button{
    display:inline-flex; align-items:center; justify-content:center;
    margin:0; min-height:36px; padding:0 18px; font-size:13px; white-space:nowrap;
    line-height:1;
  }
  /* The description is guidance, not a heading; it steps back so the records start
     higher up the screen. */
  .list-header__after-header-content,.collection-list__sub-header{
    font-size:11px; line-height:1.45; color:var(--mpm-ink-3);
  }

  /* The three controls above the table share one row instead of stacking into three. */
  .collection-list .search-filter{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .collection-list .search-filter__inputs,.search-filter input{ flex:1 1 100%; }
  .collection-list .search-filter .btn,.collection-list .pill{ min-height:34px; font-size:12px; }

  /* The bar that appears when rows are ticked. It lays itself out on one line and ran
     36px past the right edge of a 320px screen, so on a small phone the "delete" it
     offers sat partly off-screen. */
  .collection-list__list-selection{
    display:flex; flex-wrap:wrap; align-items:center; gap:6px;
    max-width:100%; font-size:12px;
  }
  .collection-list__list-selection-actions{ display:flex; flex-wrap:wrap; gap:8px; }
  /* The chevron on Columns and Filters is a 20px target in the middle of a 34px pill.
     The whole pill is the button; it just has to be allowed to be. */
  .collection-list .popup-button{ min-height:34px; display:inline-flex; align-items:center; }

  /* Every other collection keeps a labelled stack: their columns are not known here, so
     a bare value would sit on the card with nothing to say what it is. Leads need no
     labels - "Unassigned" and "3d ago" already say what they are. */
  .table td.cell-source,.table td.cell-quoteNo,.table td.cell-amount,
  .table td.cell-updatedAt,
  .collection-list:not(.collection-list--leads) .table td.cell-createdAt,
  .collection-list:not(.collection-list--leads) .table td.cell-assignedTo{
    font-size:10px; color:var(--mpm-ink-3); display:flex; gap:5px; margin-top:3px;
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

  /* ---- Save lives at the bottom on a phone ----
     Payload keeps Save in the document header, which sticks - but at z-index 5, under
     the app header this theme pins at 60, so on a long lead it slid up and hid behind
     the logo. Raising one above the other only swaps which of the two you lose.

     A phone has a better answer than either: the primary action belongs at the bottom,
     under the thumb, where every mobile OS puts it. Full width, 46px tall, always there
     - no scrolling up to save, and no arguing with the header about who owns the top of
     the screen.

     The document fields get padding underneath so the last one is never covered, and
     the header the Save button came from stops being sticky, because the thing worth
     following you down has left it. */
  .collection-edit .form-submit,
  .account .form-submit,
  .global-edit .form-submit{
    position:fixed; left:0; right:0; bottom:0; z-index:70;
    margin:0; display:flex; align-items:center; gap:8px;
    /* HEIGHT IS EXPLICIT, AND THAT IS THE WHOLE POINT.
       Left to its content the bar came out 66.8px tall - the hairline resolves to 0.8px
       here - which put its top edge on y=777.2. A fixed element gets its own compositor
       layer, and a layer sitting on a fractional pixel rasterises its text between two
       of them: the Save label came out soft while everything around it was crisp. An
       integer height lands the edge on a whole pixel and the blur goes with it.
       68 = 46 button + 11 above + 11 below, with border-box absorbing the hairline. */
    height:calc(68px + env(safe-area-inset-bottom, 0px));
    box-sizing:border-box;
    padding:0 12px env(safe-area-inset-bottom, 0px);
    background:var(--mpm-paper);
    border-top:1px solid var(--mpm-line);
    box-shadow:none;
  }
  /* Two buttons where a collection has drafts (Save draft, Publish); one where it does
     not. Sharing the row keeps either shape full-width without a special case. */
  .collection-edit .form-submit .btn,
  .account .form-submit .btn,
  .global-edit .form-submit .btn{
    flex:1; margin:0; min-height:46px; justify-content:center;
  }
  .collection-edit .document-fields,
  .account .document-fields,
  .global-edit .document-fields{ padding-bottom:92px; }
  /* RELATIVE, NEVER STATIC - the difference is a blurred page.
     Payload gives .doc-controls two absolutely-positioned pseudo-elements that paint its
     full-bleed background and rule. Sticky, it was their containing block and they were
     129px tall. Made STATIC to stop it sliding under the app header, it stopped being a
     containing block, so the pseudos resolved against the page instead and stretched to
     the full 4106px of the document. At three device pixels per CSS pixel that is a
     layer Chrome will not rasterise at full resolution, so it halved it and scaled back
     up - and the title, the tabs and the dial buttons came out soft while the form
     around them stayed sharp.
     Relative keeps it out of the sticky fight AND keeps the pseudos the size of the bar
     they belong to. */
  .collection-edit .doc-controls,
  .account .doc-controls,
  .global-edit .doc-controls{ position:relative; top:auto; }
  /* THE TRANSFORM HAS TO GO, or none of the above works.
     Payload leaves an identity transform on this wrapper - matrix(1,0,0,1,0,0), left
     over from the animation that slides the controls in. An identity transform changes
     nothing visually and everything positionally: any transform makes an element the
     containing block for fixed positioning inside it, so the Save bar anchored itself
     to the document header twelve hundred pixels up the page rather than to the
     viewport. Removing it is safe here precisely because the rule above has already
     stood this header down from sticky on a phone. */
  .collection-edit .doc-controls__controls-wrapper,
  .account .doc-controls__controls-wrapper,
  .global-edit .doc-controls__controls-wrapper{ transform:none; }

  /* Save and Publish wrap rather than squeezing to unreadable widths, and every control
     clears the 44px touch target both Apple and Google recommend. */
  .doc-controls__controls{ flex-wrap:wrap; gap:5px; }
  /* "Created / Last modified" is a row that does not wrap, so on a 390px screen it ran
     43px past the right edge and took the whole page's horizontal scroll with it - on
     EVERY document, not just the one it was found on. It wraps onto two lines now, and a
     long value breaks rather than pushing the row wider. */
  .doc-controls__meta{ flex-wrap:wrap; row-gap:4px; }
  /* The Account page's two hairlines are full-bleed pseudo-elements: absolute, offset
     left by the gutter, and sized 100% + two gutters wide. That arithmetic assumes a
     gutter Payload no longer has at this width, so each rule ran 92px wider than the
     column and gave the whole page a horizontal scroll - over a line 1px tall that
     nobody can see moving. They are pinned to the column instead. */
  .payload-settings::before,
  .payload-settings::after{ left:0; right:0; width:auto; }
  .doc-controls__list-item{ min-width:0; }
  .doc-controls__value{ overflow-wrap:anywhere; }
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
     The bar was exactly as tall as the button inside it - 44.3px of header around a 44px
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

  /* ---- The header follows you down ----
     On a phone the hamburger IS the navigation: there is no sidebar, so every move to
     another screen starts by reaching it. Sitting in the flow, it left the top of the
     page the moment you scrolled, and getting anywhere meant flicking a thousand pixels
     back up first. A list of forty leads made that the commonest gesture on the screen.

     Desktop is deliberately left alone - the sidebar there is already fixed and always
     in reach, so the header has nothing to come back for.

     BACKGROUND IS NOT DECORATION HERE. Payload's header is transparent, which is fine
     for something that scrolls away and unreadable for something that does not: rows
     would slide underneath and print straight through the logo. The ground colour and a
     hairline make it a bar rather than floating text.

     z-index 60 puts it over the page - the filter menus sit at 30, the card overlays at
     5 - and under the nav drawer at 120 and its scrim at 110, so opening the drawer
     still covers the header rather than leaving it stranded on top. */
  /* Pinned with an edge at every width now - see "The header". */
  /* Same button as on a laptop (see "The header"), a touch bigger for a thumb. */

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
    /* Google's modal navigation drawer: the page's own surface (light in light, dark in
       dark), rounded on the side that faces the page, lifted by a soft shadow. */
    background:var(--mpm-drawer);
    border-right:0; border-radius:0 16px 16px 0;
    /* Payload fades 0 to 1 over --nav-trans-time. We slide instead, so the panel has to
       stay opaque or it would fade in halfway through the movement. */
    opacity:1;
    transform:translateX(-100%);
    visibility:hidden;
    box-shadow:none;
    transition:
      transform .32s cubic-bezier(.32,.72,0,1),
      box-shadow .32s ease,
      visibility .32s;
    will-change:transform;
  }
  .nav--nav-open{
    transform:translateX(0);
    visibility:visible;
    box-shadow:0 8px 12px 6px rgba(0,0,0,.15), 0 4px 4px rgba(0,0,0,.3);
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
    padding:0 12px 26px; overscroll-behavior:contain;
  }

  /* The close button lives in .nav__header, which Payload renders AFTER .nav__wrap in
     the DOM. Ordered to the top and made sticky rather than moved with negative margins,
     which pushed a 523px-tall button off the top of the screen once the header turned out
     not to sit inside the scroll container. */
  .nav--nav-open .nav__wrap{
    order:2; padding-top:8px;
    animation:mpm-drawer-in .34s cubic-bezier(.32,.72,0,1) .06s both;
  }
  @keyframes mpm-drawer-in{
    from{ opacity:0; transform:translateX(-10px); }
    to{ opacity:1; transform:none; }
  }
  .nav--nav-open .nav__header{
    order:1; position:sticky; top:0; z-index:3;
    /* Something outside this file gives the header an explicit width - measured at
       390.4px, the full viewport, inside a 320px drawer - so it is overridden: left as it
       was, the header ran past the panel and took the close button with it. */
    width:auto !important;
    margin:0 -12px; padding:10px 12px 10px 20px;
    background:var(--mpm-drawer);
    border-bottom:0;
    border-radius:0 16px 0 0;
  }
  .nav--nav-open .nav__header-content{
    display:flex; align-items:center; justify-content:flex-end; width:100%; gap:6px;
  }
  /* The logo heads the drawer, in the colourway for the theme. */
  .nav--nav-open .nav__header-content::before{
    content:""; margin-right:auto;
    width:127px; height:42px;
    background:url("${logo.src}") left center / contain no-repeat;
  }
  html[data-theme="dark"] .nav--nav-open .nav__header-content::before{
    background-image:url("${logoInverse.src}");
  }
  /* Close: Google's icon button - no frame, a round state layer. */
  .nav__mobile-close{ width:auto; padding:0; border:0; background:none; }
  .nav--nav-open .nav__mobile-close .hamburger{
    width:44px; height:44px; display:grid; place-items:center;
    border-radius:50%; background:transparent; border:0;
    transition:background .12s ease;
  }
  .nav--nav-open .nav__mobile-close:hover .hamburger{ background:var(--mpm-hover); }
  .nav--nav-open .nav__mobile-close:active .hamburger{ background:var(--mpm-press); }
  .nav--nav-open .nav__mobile-close .icon .stroke{ stroke:var(--mpm-drawer-ink-2); stroke-width:1.8; }

  /* Rows in the drawer are the laptop's rows (see the sidebar block), a touch taller for
     a thumb. */
  .nav--nav-open .nav__link{ min-height:48px; margin:1px 0; padding:0 16px; }
  .nav--nav-open .nav-group__toggle{ align-items:center; margin:14px 0 2px; padding:6px 16px; }
  .nav--nav-open .nav-group__label{ margin:0; padding:0; }
  .nav--nav-open .nav__controls{
    border-top:1px solid var(--mpm-drawer-line); margin-top:13px; padding-top:8px;
  }
  .nav--nav-open .nav__controls .btn,.nav--nav-open .nav__controls a{ color:var(--mpm-drawer-ink-2); }
}
@media (max-width:640px){
  /* Reclaim the shell's gutters - on a narrow phone they cost a sixth of the screen. */
  .template-default__wrap,.collection-list,.collection-edit{ padding-inline:10px; }
  /* ...but the header is chrome, not content: it runs edge to edge, so its bottom line
     meets both sides of the screen instead of stopping 10px short of each. */
  .template-default__wrap > .app-header{ margin-inline:-10px; width:calc(100% + 20px); }
  .template-default__wrap > .app-header .app-header__content{ padding-inline:16px; }
  /* The collection header puts the title and "Create New" on one line; on a phone the
     pill lands on top of the heading. Stack them and let the title have the row. */
  .list-header__title-and-actions{
    display:flex; flex-direction:column; align-items:flex-start; gap:10px;
  }
  .list-header__title-and-actions h1{
    margin:0; font-size:20px; line-height:1.2; letter-spacing:-.015em; color:var(--mpm-ink);
  }
  /* The collection blurb is guidance, not content: it should not outweigh the records. */
  .custom-view-description{ font-size:11px; line-height:1.5; color:var(--mpm-ink-2); }

  /* List controls stack instead of competing for one line. */
  .list-controls__wrap,.list-controls{ flex-wrap:wrap; gap:6px; }
  .search-filter,.search-filter__inputWrap{ width:100%; }
  /* Our own dashboard cards go single-column; their grid assumes desktop width. */
  .mpm-cards,.mpm-grid{ grid-template-columns:1fr !important; }
  /* The login card should not be a 410px box inside a 390px screen. */
  .template-minimal__wrap{ padding:23px 16px 26px; border-radius:16px; }
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
