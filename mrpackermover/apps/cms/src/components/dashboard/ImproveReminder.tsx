'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';
import { REVIEW_BUCKETS } from './lead-status.js';

/**
 * The reminder that keeps coming back while improvement calls are waiting.
 *
 * Mounted app-wide (ReminderProvider, an admin provider) for handlers and salespeople, so
 * it is on every admin page, not only the dashboard. Not in the sidebar: a closed sidebar
 * is moved off screen, and a fixed-position snackbar inside it went with it. A few seconds after the admin opens, and then every half hour, it
 * asks the API how many "Needs improvement" leads this person can see; while there are
 * any, a snackbar says so, with one press to the list. If they turned on desktop alerts
 * (ReminderSwitch, on the dashboard card) and are in another tab, the browser shows a
 * notification instead, so the reminder reaches them while they are on WhatsApp Web.
 *
 * ONE CLOCK FOR ALL TABS. The next reminder time lives in localStorage, so five open
 * admin tabs remind once, not five times, and a page change does not restart the count.
 *
 * The count comes from /api/leads through the access layer, so a salesperson's number is
 * their own leads and a handler's is the team's - the same rule as the dashboard card.
 */

/** The review's "Needs improvement" stages - the same list the dashboard card counts. */
const STAGES = REVIEW_BUCKETS.find((b) => b.key === 'improve')?.statuses ?? [];
const EVERY_MS = 30 * 60 * 1000;
const FIRST_MS = 8 * 1000;
const NEXT_KEY = 'mpm-improve-next';
export const DESKTOP_KEY = 'mpm-improve-desktop';
const BOARD = '/admin?range=all&filter=r-improve#leads';

const read = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string): void => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: the reminder still works for this page */
  }
};

async function waiting(): Promise<number | null> {
  const where = STAGES.map((s, i) => `where[status][in][${i}]=${s}`).join('&');
  try {
    const res = await fetch(`/api/leads?${where}&limit=1&depth=0&select[id]=true`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return ((await res.json()) as { totalDocs?: number }).totalDocs ?? 0;
  } catch {
    return null;
  }
}

/** The dashboard card, when it is on screen: no point announcing what is in front of you. */
function cardInView(): boolean {
  const el = document.querySelector('[data-improve-count]');
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
}

export function ImproveReminder(): React.JSX.Element | null {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  const check = useCallback(async () => {
    const next = Number(read(NEXT_KEY) ?? 0);
    if (Date.now() < next) return;
    // Claim the slot before the request, so another tab checking in the same second
    // does not remind as well.
    write(NEXT_KEY, String(Date.now() + EVERY_MS));
    const n = await waiting();
    if (!n) return;
    const text = `${n} ${n === 1 ? 'lead needs' : 'leads need'} an improvement call`;
    if (
      document.hidden &&
      read(DESKTOP_KEY) === '1' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const note = new Notification('MrMoverPacker: call them back', {
        body: `${text}. Warm, but no price yet.`,
        tag: 'mpm-improve',
      });
      note.onclick = () => {
        window.focus();
        window.location.assign(BOARD);
      };
      return;
    }
    if (cardInView()) return;
    setCount(n);
  }, []);

  useEffect(() => {
    // First reminder of the day comes soon after opening; after that, every half hour.
    const stored = Number(read(NEXT_KEY) ?? 0);
    if (!stored || stored - Date.now() > EVERY_MS) write(NEXT_KEY, String(Date.now() + FIRST_MS));
    const first = window.setTimeout(() => void check(), FIRST_MS + 500);
    const tick = window.setInterval(() => void check(), 60 * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(tick);
    };
  }, [check]);

  // Leaving for the list answers the reminder.
  useEffect(() => {
    if (pathname !== '/admin') return;
    if (window.location.search.includes('filter=r-improve')) setCount(null);
  }, [pathname]);

  if (!count) return null;

  return (
    <div className="mpm-remind" role="status" aria-live="polite">
      <style>{CSS}</style>
      <MIcon name="campaign" size={22} className="mpm-remind__ico" />
      <p className="mpm-remind__text">
        <strong>
          {count} {count === 1 ? 'lead needs' : 'leads need'} an improvement call
        </strong>
        <span>Warm, but no price yet. Call them before they go cold.</span>
      </p>
      <div className="mpm-remind__btns">
        <a className="mpm-remind__go" href={BOARD} onClick={() => setCount(null)}>
          Show leads
        </a>
        <button
          type="button"
          className="mpm-remind__later"
          onClick={() => {
            write(NEXT_KEY, String(Date.now() + EVERY_MS));
            setCount(null);
          }}
          title="Remind me again in 30 minutes"
        >
          <MIcon name="snooze" size={18} />
          Later
        </button>
      </div>
    </div>
  );
}

/** The admin provider that mounts the reminder for the sales desk, beside every page. */
export function ReminderProvider({ children }: { children?: React.ReactNode }): React.JSX.Element {
  const { user } = useAuth();
  const role = (user as { role?: string } | null | undefined)?.role;
  return (
    <>
      {children}
      {(role === 'handler' || role === 'sales') && <ImproveReminder />}
    </>
  );
}

/**
 * "Desktop alerts", on the dashboard card: lets the reminder reach someone who is in
 * another tab. The browser asks for permission the first time.
 */
export function ReminderSwitch(): React.JSX.Element | null {
  const [state, setState] = useState<'unsupported' | 'off' | 'on' | 'blocked' | null>(null);

  useEffect(() => {
    if (!('Notification' in window)) return setState('unsupported');
    if (Notification.permission === 'denied') return setState('blocked');
    setState(Notification.permission === 'granted' && read(DESKTOP_KEY) === '1' ? 'on' : 'off');
  }, []);

  if (!state || state === 'unsupported') return null;
  if (state === 'blocked') {
    return (
      <span className="mpm-alerts mpm-alerts--blocked">
        Desktop alerts are blocked in this browser
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`mpm-alerts${state === 'on' ? ' is-on' : ''}`}
      aria-pressed={state === 'on'}
      onClick={async () => {
        if (state === 'on') {
          write(DESKTOP_KEY, '0');
          return setState('off');
        }
        const p =
          Notification.permission === 'granted'
            ? 'granted'
            : await Notification.requestPermission();
        if (p === 'granted') {
          write(DESKTOP_KEY, '1');
          setState('on');
        } else setState(p === 'denied' ? 'blocked' : 'off');
      }}
    >
      <style>{SWITCH_CSS}</style>
      <MIcon name={state === 'on' ? 'notifications_active' : 'notifications'} size={18} />
      {state === 'on' ? 'Desktop alerts on' : 'Turn on desktop alerts'}
    </button>
  );
}

/* Google's snackbar: dark, bottom-left, one action in light blue. */
const CSS = `
.mpm-remind{ position:fixed; left:24px; bottom:24px; z-index:1000; display:flex; align-items:center; gap:14px;
  max-width:min(560px, calc(100vw - 32px)); padding:12px 12px 12px 16px; border-radius:12px;
  background:#303030; color:#F2F2F2; font-family:var(--mpm-font);
  box-shadow:0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3);
  animation:mpm-remind-in .25s cubic-bezier(.2,.9,.3,1.1); }
html[data-theme="dark"] .mpm-remind{ background:#E3E3E3; color:#1F1F1F; }
@keyframes mpm-remind-in{ from{ opacity:0; transform:translateY(12px); } }
.mpm-remind__ico{ flex:none; color:#FDD663; }
html[data-theme="dark"] .mpm-remind__ico{ color:#B06000; }
.mpm-remind__text{ display:grid; gap:2px; margin:0; font-size:14px; line-height:1.4; }
.mpm-remind__text strong{ font-weight:500; }
.mpm-remind__text span{ font-size:13px; opacity:.8; }
.mpm-remind__btns{ display:flex; gap:4px; margin-left:auto; flex:none; }
.mpm-remind__go, .mpm-remind__later{ display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 12px;
  border:0; border-radius:999px; background:transparent; cursor:pointer; text-decoration:none;
  font-family:var(--mpm-font-display); font-size:14px; font-weight:500; }
.mpm-remind__go{ color:#A8C7FA; }
.mpm-remind__later{ color:inherit; opacity:.85; }
html[data-theme="dark"] .mpm-remind__go{ color:#0B57D0; }
.mpm-remind__go:hover, .mpm-remind__later:hover{ background:rgba(255,255,255,.08); }
html[data-theme="dark"] .mpm-remind__go:hover, html[data-theme="dark"] .mpm-remind__later:hover{ background:rgba(0,0,0,.06); }
.mpm-remind__go:focus-visible, .mpm-remind__later:focus-visible{ outline:2px solid #A8C7FA; outline-offset:1px; }
@media (max-width:640px){
  .mpm-remind{ left:16px; right:16px; bottom:16px; flex-wrap:wrap; }
  .mpm-remind__btns{ width:100%; justify-content:flex-end; }
}
@media (prefers-reduced-motion:reduce){ .mpm-remind{ animation:none; } }
`;

const SWITCH_CSS = `
.mpm-alerts{ display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:999px;
  border:1px solid var(--mpm-line); background:transparent; color:var(--mpm-v-500); cursor:pointer; white-space:nowrap;
  font-family:var(--mpm-font-display); font-size:13px; font-weight:500; }
.mpm-alerts:hover{ background:color-mix(in srgb, var(--mpm-v-500) 8%, transparent); }
.mpm-alerts.is-on{ background:var(--mpm-sel); color:var(--mpm-on-sel); border-color:transparent; }
.mpm-alerts:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px; }
.mpm-alerts--blocked{ font-size:12px; color:var(--mpm-ink-2); border:0; cursor:default; padding:0; }
`;
