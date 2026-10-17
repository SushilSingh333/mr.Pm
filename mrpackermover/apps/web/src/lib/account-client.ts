/**
 * Browser helpers for the account pages (/account, /account/login, /account/signup).
 * They talk to /api/account/* on the same origin; the session is an HttpOnly cookie the
 * page never sees. `mpm_name` (the first name) is the one readable cookie, so a page can
 * tell "signed in" without a request.
 */

export interface ApiResult<T = Record<string, unknown>> {
  status: number;
  data: T & { error?: string; fields?: Record<string, string> };
}

export async function api<T = Record<string, unknown>>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/account/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {} as ApiResult<T>['data'];
    try {
      data = await res.json();
    } catch {
      /* an empty or non-JSON body: the status still says what happened */
    }
    return { status: res.status, data };
  } catch {
    return {
      status: 0,
      data: { error: 'No connection. Check your internet and try again.' } as ApiResult<T>['data'],
    };
  }
}

/** The signed-in customer's first name, or '' when signed out. */
export function signedInName(): string {
  const m = document.cookie.match(/(?:^|;\s*)mpm_name=([^;]*)/);
  return m?.[1] ? decodeURIComponent(m[1]) : '';
}

/** Where to go after signing in: a path on this site only, never another site. */
export function nextPath(fallback = '/account'): string {
  const n = new URLSearchParams(location.search).get('next') ?? '';
  // A path only: "//evil.com" and "/\evil.com" (a browser reads "\" as "/") are other
  // sites, so the value must also resolve to this origin.
  if (!/^\/(?![/\\])/.test(n)) return fallback;
  try {
    const u = new URL(n, location.origin);
    return u.origin === location.origin ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}

export const esc = (s: unknown): string =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** 9876543210 → +91 98765 43210 */
export const phoneDisplay = (p: string): string =>
  p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p;

export const money = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const dateDisplay = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ERR_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';

/**
 * Google-style field errors: a red outline, and the message with an alert icon under
 * the field (`[data-field="name"]` wrappers, an `.gx-err` slot inside each). The form's
 * alert carries a summary; the first field that needs fixing gets the focus.
 */
export function showErrors(form: HTMLElement, error?: string, fields: Record<string, string> = {}) {
  for (const f of form.querySelectorAll<HTMLElement>('[data-field]')) {
    const msg = fields[f.dataset.field ?? ''];
    f.classList.toggle('is-bad', Boolean(msg));
    const err = f.querySelector<HTMLElement>('.gx-err');
    if (err) {
      err.innerHTML = msg ? `${ERR_ICON}<span>${esc(msg)}</span>` : '';
      err.hidden = !msg;
    }
    const hint = f.querySelector<HTMLElement>('.gx-hint');
    if (hint) hint.hidden = Boolean(msg);
    f.querySelector('input, select')?.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  const alert = form.querySelector<HTMLElement>('.gx-alert');
  if (alert) {
    alert.textContent = error ?? '';
    alert.hidden = !error;
  }
  const first = Object.keys(fields)[0];
  if (first)
    form
      .querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] select`)
      ?.focus();
}

/** A submit button's busy state, and the loading line on the card while it lasts. */
export function busy(btn: HTMLButtonElement | null, on: boolean, label = 'Please wait…') {
  const bar = document.querySelector<HTMLElement>('.gx-progress');
  if (bar) bar.toggleAttribute('data-on', on);
  if (!btn) return;
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.textContent = label;
    btn.disabled = true;
  } else {
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    btn.disabled = false;
  }
}

/**
 * Floating labels on drop-downs: a select always "has" a value, so CSS cannot tell an
 * empty one from a chosen one. Mark the box filled once a real option is picked.
 */
export function wireSelects(root: ParentNode = document) {
  for (const sel of root.querySelectorAll<HTMLSelectElement>('.gx-box select')) {
    const mark = () => sel.closest('.gx-box')?.classList.toggle('is-filled', sel.value !== '');
    mark();
    sel.addEventListener('change', mark);
  }
}

/** Google's "Show password" checkbox: shows every password field in the same form. */
export function wireShowPassword(root: ParentNode = document) {
  for (const box of root.querySelectorAll<HTMLInputElement>('input[data-show-password]')) {
    box.addEventListener('change', () => {
      const form = box.closest('form') ?? document;
      for (const i of form.querySelectorAll<HTMLInputElement>('input[data-password]'))
        i.type = box.checked ? 'text' : 'password';
    });
  }
}

/** The browser twin of components/account/GxField.astro, for forms built on the page. */
export function fieldHtml(o: {
  name: string;
  label: string;
  id: string;
  type?: string;
  value?: string;
  autocomplete?: string;
  inputmode?: string;
  maxlength?: number;
  prefix?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}): string {
  const described = `${o.hint ? `${o.id}-hint ` : ''}${o.id}-err`;
  const control = o.options
    ? `<select id="${esc(o.id)}" name="${esc(o.name)}" aria-describedby="${described}">${o.options
        .map(
          (x) =>
            `<option value="${esc(x.value)}"${x.value === (o.value ?? '') ? ' selected' : ''}>${esc(x.label)}</option>`,
        )
        .join('')}</select>`
    : `<input id="${esc(o.id)}" name="${esc(o.name)}" type="${esc(o.type ?? 'text')}" placeholder=" " value="${esc(o.value ?? '')}"${o.autocomplete ? ` autocomplete="${esc(o.autocomplete)}"` : ''}${o.inputmode ? ` inputmode="${esc(o.inputmode)}"` : ''}${o.maxlength ? ` maxlength="${o.maxlength}"` : ''}${o.type === 'password' ? ' data-password' : ''} aria-describedby="${described}" />`;
  return `<div class="gx-field" data-field="${esc(o.name)}">
    <div class="gx-box${o.options ? ' gx-box--select' : ''}">${o.prefix ? `<span class="gx-prefix" aria-hidden="true">${esc(o.prefix)}</span>` : ''}${control}<label class="gx-label" for="${esc(o.id)}">${esc(o.label)}</label></div>
    ${o.hint ? `<p class="gx-hint" id="${esc(o.id)}-hint">${esc(o.hint)}</p>` : ''}
    <p class="gx-err" id="${esc(o.id)}-err" role="alert" hidden></p>
  </div>`;
}
