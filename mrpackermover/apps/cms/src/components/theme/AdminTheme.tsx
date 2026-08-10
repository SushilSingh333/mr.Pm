import type { ReactNode } from 'react';

/**
 * App-wide admin theme (admin.components.providers) — a provider wraps EVERY admin page,
 * including the login and account views, so a single injected <style> here restyles the
 * whole CMS to the violet "Dropify" look: tinted background, rounded corners, soft
 * shadows, violet primary buttons / focus rings, a pill-style active nav item, and a
 * centred login card. It only sets presentation — Payload's own behaviour, theme toggle,
 * and light/dark tokens are untouched; every rule is scoped so light AND dark both work.
 *
 * Why a provider (not admin.css): Payload v3 has no global-CSS config key, but providers
 * render above the view router on all routes — the reliable place to reach login too.
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
/* ============ MrPackerMover admin · violet theme ============ */
:root{
  --mpm-v-400:#8B7CF0; --mpm-v-500:#6D5AE6; --mpm-v-600:#5A46D6; --mpm-v-700:#4A38B5;
  --mpm-grad:linear-gradient(140deg,#8B7CF0,#5A46D6);
}

/* Rounder corners across the whole admin */
html[data-theme="light"], html[data-theme="dark"]{
  --style-radius-s:8px; --style-radius-m:11px; --style-radius-l:16px;
}
/* Subtle violet-tinted app background (cards stay on elevation-0 above it) */
html[data-theme="light"]{ --theme-bg:#F3F1FB; }
html[data-theme="dark"]{ --theme-bg:#131120; }

/* ---- Primary buttons · "Create New" · Save → violet gradient pill ---- */
.btn.btn--style-primary{
  --color:#fff; --hover-color:#fff;
  background:var(--mpm-grad); border:none; border-radius:99px;
  font-weight:600; font-size:.9rem; letter-spacing:.01em; padding:.62rem 1.25rem;
  box-shadow:0 12px 26px -14px color-mix(in srgb, var(--mpm-v-600) 92%, transparent);
  transition:transform .12s, box-shadow .12s, filter .12s;
}
.btn.btn--style-primary:hover{
  filter:brightness(1.07); transform:translateY(-1px);
  box-shadow:0 16px 32px -14px color-mix(in srgb, var(--mpm-v-600) 100%, transparent);
}
.btn.btn--style-primary:active{ transform:translateY(0); }
.btn.btn--style-primary svg,.btn.btn--style-primary .btn__content{ color:#fff; }
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

/* ---- Sidebar nav: legible links + violet active pill (Dropify-style) ---- */
.nav{ padding-inline:.15rem; }
.nav .nav__link{
  display:flex; align-items:center; gap:.6rem;
  font-size:.95rem; font-weight:500; line-height:1.25;
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
.nav .nav-group__label{ font-size:.74rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--mpm-v-500); opacity:.92; }
.nav__controls .btn:hover{ color:var(--mpm-v-500); }

/* Brand pin must never be clipped in any admin slot (nav header, app header, login).
   Un-clip the wrappers directly around the logo (matched by its aria-label, so it is
   class-name-agnostic) up to 3 levels — without touching the nav scroll container. */
.nav__header,.nav__brand,.nav__logo,.nav__link--logo,.graphic-logo,.app-header__logo{ overflow:visible; }
:has(> svg[aria-label="MrPackerMover"]),
:has(> * > svg[aria-label="MrPackerMover"]),
:has(> * > * > svg[aria-label="MrPackerMover"]){ overflow:visible; }
:has(> svg[aria-label="MrPackerMover"]){ height:auto; min-height:0; }
svg[aria-label="MrPackerMover"]{ flex:none; overflow:visible; }

/* ---- Cards, tables, popups: rounder + softer ---- */
.card{ border-radius:var(--style-radius-l); border-color:color-mix(in srgb, var(--mpm-v-500) 10%, var(--theme-elevation-100)); transition:border-color .12s,transform .12s; }
.card:hover{ border-color:color-mix(in srgb, var(--mpm-v-500) 40%, transparent); }
.table{ border-radius:var(--style-radius-m); overflow:hidden; }
.table thead th{ background:color-mix(in srgb, var(--mpm-v-500) 7%, var(--theme-elevation-0)); color:var(--theme-elevation-800); }
.popup__content{ border-radius:var(--style-radius-m); }
.pill{ border-radius:99px; }

/* ---- Account / document views: keep app bg tint visible behind content ---- */
.account .doc-controls,.collection-edit .doc-controls{ border-radius:var(--style-radius-m); }

/* ================= Login / minimal (create-first-user, forgot) ================= */
.login.template-minimal,.template-minimal{
  background:
    radial-gradient(900px 460px at 50% -8%, color-mix(in srgb, var(--mpm-v-500) 26%, var(--theme-bg)) 0%, transparent 62%),
    var(--theme-bg);
}
.template-minimal__wrap{
  max-width:410px; width:100%;
  padding:2.5rem 2.3rem 2.6rem;
  background:var(--theme-elevation-0);
  border:1px solid color-mix(in srgb, var(--mpm-v-500) 13%, var(--theme-elevation-100));
  border-radius:22px;
  box-shadow:0 40px 90px -40px color-mix(in srgb, var(--mpm-v-700) 70%, transparent), 0 4px 12px -6px rgba(20,18,45,.12);
}
.login__brand{ display:flex; justify-content:center; margin-bottom:1.6rem; }
.login__form .field-type{ margin-bottom:1rem; }
.login__form .form-submit,.login__form .btn--style-primary{ width:100%; }
`;
