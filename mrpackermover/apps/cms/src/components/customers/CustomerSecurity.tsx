'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';

/**
 * "Password and sign-in" on a customer: how they sign in, and the three things an admin
 * does for them while there is no OTP - reset a forgotten password, unlock an account
 * after too many wrong passwords, and sign them out on every device.
 *
 * Reset suggests an easy password (two words and four digits, nothing that reads two
 * ways on a call), saves it at once through /api/customers/:id/password - not with the
 * form's Save, so there is no half-done state - and then shows it ONCE with Copy,
 * WhatsApp and Call. Only a hash is stored, so it can never be shown again.
 */

type Status = {
  name: string;
  phone: string;
  hasPassword: boolean;
  passwordChangedAt: string | null;
  passwordChangedBy: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  failedLogins: number;
  lockedUntil: string | null;
  maxFailed: number;
  lockMinutes: number;
  minPassword: number;
  signInUrl: string;
};
type Mode = 'view' | 'reset' | 'done' | 'signout';

const WORDS = [
  'Mango',
  'Tiger',
  'River',
  'Lotus',
  'Cloud',
  'Pearl',
  'Maple',
  'Sunny',
  'Coral',
  'Eagle',
  'Ginger',
  'Honey',
  'Jasmine',
  'Kite',
  'Lemon',
  'Mint',
  'Olive',
  'Panda',
  'Rose',
  'Silver',
  'Tulip',
  'Amber',
  'Bamboo',
  'Cedar',
  'Daisy',
  'Forest',
  'Garden',
  'Harbor',
  'Island',
  'Jade',
  'Meadow',
  'Ocean',
  'Palm',
  'Rain',
  'Star',
  'Stone',
  'Wave',
  'Peacock',
  'Banyan',
  'Monsoon',
  'Saffron',
  'Cotton',
  'Copper',
  'Orange',
  'Rocket',
  'Planet',
  'Summer',
  'Winter',
];

/** Two words and four digits, e.g. "Mango-River-4827": easy to read out, hard to guess. */
function suggest(): string {
  const r = new Uint32Array(3);
  crypto.getRandomValues(r);
  const a = WORDS[r[0]! % WORDS.length]!;
  let b = WORDS[r[1]! % WORDS.length]!;
  if (b === a) b = WORDS[(r[1]! + 1) % WORDS.length]!;
  return `${a}-${b}-${String(1000 + (r[2]! % 9000))}`;
}

const when = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
const time = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const first = (name: string): string => name.trim().split(/\s+/)[0] || 'the customer';
const phoneShown = (p: string): string =>
  p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p;

export function CustomerSecurity(): React.JSX.Element {
  const { id } = useDocumentInfo();
  const [s, setS] = useState<Status | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(true);
  const [shown, setShown] = useState(''); // the password just set, shown once
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const card = useRef<HTMLElement>(null);

  const call = useCallback(
    async (path: string, body?: unknown): Promise<Status | null> => {
      setError('');
      try {
        const res = await fetch(`/api/customers/${encodeURIComponent(String(id))}/${path}`, {
          method: body === undefined ? 'GET' : 'POST',
          credentials: 'include',
          headers: body === undefined ? undefined : { 'content-type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as Status & { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'That did not work. Try again.');
          return null;
        }
        setS(data);
        return data;
      } catch {
        setError('No connection. Check the internet and try again.');
        return null;
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) void call('security');
  }, [id, call]);

  // Focus follows a change of view (never on page load, which would scroll the page).
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) {
      moved.current = true;
      return;
    }
    if (mode === 'reset') input.current?.select();
    if (mode === 'done' || mode === 'view')
      card.current?.querySelector<HTMLElement>('[data-focus]')?.focus();
  }, [mode]);

  if (!id) {
    return (
      <section className="mpm-sec" aria-labelledby="mpm-sec-t">
        <style>{CSS}</style>
        <Head />
        <p className="mpm-sec__p">
          Save this customer first. Then you can set their password here.
        </p>
      </section>
    );
  }
  if (!s) {
    return (
      <section className="mpm-sec" aria-labelledby="mpm-sec-t" aria-busy="true">
        <style>{CSS}</style>
        <Head />
        <p className="mpm-sec__p">{error || 'Loading…'}</p>
      </section>
    );
  }

  const who = first(s.name);
  const locked = s.lockedUntil;

  const startReset = () => {
    setPw(suggest());
    setShow(true);
    setNote('');
    setMode('reset');
  };
  // Not a <form>: the panel sits inside Payload's document form, so a nested form's submit
  // (or Enter in the box) would also save the whole customer. Enter is handled here.
  const submitReset = async () => {
    const next = pw.trim();
    if (next.length < s.minPassword) {
      setError(`Use at least ${s.minPassword} characters.`);
      input.current?.focus();
      return;
    }
    setBusy(true);
    const ok = await call('password', { password: next });
    setBusy(false);
    if (ok) {
      setShown(next);
      setCopied(false);
      setMode('done');
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const act = async (path: 'unlock' | 'signout', done: string) => {
    setBusy(true);
    const ok = await call(path, {});
    setBusy(false);
    if (ok) {
      setNote(done);
      setMode('view');
    }
  };

  const message =
    `Hi ${who}, your MrMoverPacker password has been reset.\n\n` +
    `Mobile number: ${phoneShown(s.phone)}\nNew password: ${shown}\n\n` +
    `Sign in at ${s.signInUrl} and you can change it any time under Security.`;

  return (
    <section className="mpm-sec" aria-labelledby="mpm-sec-t" ref={card}>
      <style>{CSS}</style>
      <Head />

      {mode === 'done' ? (
        <div className="mpm-sec__done">
          <p className="mpm-sec__ok" role="status">
            <MIcon name="check" size={20} />
            Password reset. {who} is signed out on every device.
          </p>
          <div className="mpm-sec__reveal">
            <span className="mpm-sec__k">New password</span>
            <code className="mpm-sec__pw">{shown}</code>
            <button
              type="button"
              className="mpm-sec__btn mpm-sec__btn--tonal"
              onClick={copy}
              data-focus
            >
              <MIcon name={copied ? 'check' : 'content_copy'} size={18} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mpm-sec__p">Send it to {who}:</p>
          <div className="mpm-sec__row">
            <a
              className="mpm-sec__btn"
              href={`https://wa.me/91${s.phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MIcon name="forum" size={18} />
              Send on WhatsApp
            </a>
            <a className="mpm-sec__btn mpm-sec__btn--line" href={`tel:+91${s.phone}`}>
              <MIcon name="call" size={18} />
              Call {phoneShown(s.phone)}
            </a>
          </div>
          <p className="mpm-sec__fine">
            This is the only time it is shown: only a scrambled copy is stored, so nobody, admins
            included, can read it later. If it is lost, reset it again.
          </p>
          <div className="mpm-sec__row mpm-sec__row--end">
            <button
              type="button"
              className="mpm-sec__btn mpm-sec__btn--text"
              onClick={() => {
                setShown('');
                setMode('view');
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : mode === 'reset' ? (
        <div className="mpm-sec__form" role="group" aria-labelledby="mpm-sec-k">
          <label className="mpm-sec__k" htmlFor="mpm-sec-pw" id="mpm-sec-k">
            New password for {who}
          </label>
          <div className={`mpm-sec__field${error ? ' is-bad' : ''}`}>
            <MIcon name="key" size={20} className="mpm-sec__lead" />
            <input
              ref={input}
              id="mpm-sec-pw"
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  void submitReset();
                }
              }}
              autoComplete="new-password"
              spellCheck={false}
              maxLength={128}
              aria-describedby="mpm-sec-hint"
              aria-invalid={Boolean(error)}
            />
            <button
              type="button"
              className="mpm-sec__icon"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              title={show ? 'Hide' : 'Show'}
            >
              <MIcon name={show ? 'visibility_off' : 'visibility'} size={20} />
            </button>
            <button
              type="button"
              className="mpm-sec__icon"
              onClick={() => {
                setPw(suggest());
                setError('');
                input.current?.focus();
              }}
              aria-label="Suggest another password"
              title="Suggest another"
            >
              <MIcon name="refresh" size={20} />
            </button>
          </div>
          <p
            className={error ? 'mpm-sec__err' : 'mpm-sec__hint'}
            id="mpm-sec-hint"
            role={error ? 'alert' : undefined}
          >
            {error ||
              `A suggestion that is easy to read out on a call. Type your own if you like: at least ${s.minPassword} characters.`}
          </p>
          <p className="mpm-sec__info">
            <MIcon name="devices" size={18} />
            Saving signs {who} out on every device
            {locked || s.failedLogins ? ' and unlocks the account' : ''}. You will see the password
            once, to send it to them.
          </p>
          <div className="mpm-sec__row mpm-sec__row--end">
            <button
              type="button"
              className="mpm-sec__btn mpm-sec__btn--text"
              onClick={() => {
                setError('');
                setMode('view');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mpm-sec__btn"
              disabled={busy}
              onClick={() => void submitReset()}
              data-submit
            >
              <MIcon name="lock_reset" size={18} />
              {busy ? 'Setting…' : 'Set password'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <dl className="mpm-sec__list">
            <div>
              <dt>Password</dt>
              <dd>
                {!s.hasPassword ? (
                  <span className="mpm-sec__chip mpm-sec__chip--warn">
                    Not set: they cannot sign in yet
                  </span>
                ) : s.passwordChangedAt ? (
                  <>
                    Changed {when(s.passwordChangedAt)}
                    <small>
                      {s.passwordChangedBy ? `by ${s.passwordChangedBy}` : 'by the customer'}
                    </small>
                  </>
                ) : (
                  <>
                    Set at sign-up
                    <small>{when(s.createdAt)}</small>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Last signed in</dt>
              <dd>{s.lastLoginAt ? when(s.lastLoginAt) : 'Never'}</dd>
            </div>
            <div>
              <dt>Sign-in</dt>
              <dd>
                {locked ? (
                  <>
                    <span className="mpm-sec__chip mpm-sec__chip--warn">
                      <MIcon name="lock" size={16} />
                      Locked until {time(locked)}
                    </span>
                    <small>
                      {s.maxFailed} wrong passwords in a row. It unlocks by itself after{' '}
                      {s.lockMinutes} minutes.
                    </small>
                  </>
                ) : s.failedLogins > 0 ? (
                  <>
                    <span className="mpm-sec__chip">Can sign in</span>
                    <small>
                      {s.failedLogins} wrong password{s.failedLogins === 1 ? '' : 's'} since the
                      last sign-in. Locks at {s.maxFailed}.
                    </small>
                  </>
                ) : (
                  <span className="mpm-sec__chip mpm-sec__chip--ok">Can sign in</span>
                )}
              </dd>
            </div>
          </dl>

          {note && (
            <p className="mpm-sec__ok" role="status">
              <MIcon name="check" size={20} />
              {note}
            </p>
          )}
          {error && (
            <p className="mpm-sec__err" role="alert">
              {error}
            </p>
          )}

          {mode === 'signout' ? (
            <div className="mpm-sec__confirm">
              <p>
                Sign {who} out on every phone and computer? Their password stays the same, so they
                can sign straight back in.
              </p>
              <div className="mpm-sec__row mpm-sec__row--end">
                <button
                  type="button"
                  className="mpm-sec__btn mpm-sec__btn--text"
                  onClick={() => setMode('view')}
                  data-focus
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mpm-sec__btn"
                  disabled={busy}
                  onClick={() => act('signout', `${who} is signed out on every device.`)}
                >
                  <MIcon name="logout" size={18} />
                  {busy ? 'Signing out…' : 'Sign out everywhere'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mpm-sec__row">
              <button type="button" className="mpm-sec__btn" onClick={startReset} data-focus>
                <MIcon name="lock_reset" size={18} />
                {s.hasPassword ? 'Reset password' : 'Set a password'}
              </button>
              {locked && (
                <button
                  type="button"
                  className="mpm-sec__btn mpm-sec__btn--tonal"
                  disabled={busy}
                  onClick={() => act('unlock', `${who} can sign in again.`)}
                >
                  <MIcon name="lock_open" size={18} />
                  Unlock now
                </button>
              )}
              {s.hasPassword && (
                <button
                  type="button"
                  className="mpm-sec__btn mpm-sec__btn--line"
                  onClick={() => {
                    setNote('');
                    setMode('signout');
                  }}
                >
                  <MIcon name="logout" size={18} />
                  Sign out everywhere
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Head(): React.JSX.Element {
  return (
    <div className="mpm-sec__head">
      <span className="mpm-sec__badge">
        <MIcon name="key" size={20} />
      </span>
      <div>
        <h3 className="mpm-sec__t" id="mpm-sec-t">
          Password and sign-in
        </h3>
        <p className="mpm-sec__sub">
          They sign in on the website with their mobile number and a password.
        </p>
      </div>
    </div>
  );
}

const CSS = `
.mpm-sec{ margin:8px 0 24px; padding:20px 24px; border:1px solid var(--mpm-line); border-radius:16px;
  background:var(--mpm-paper); color:var(--mpm-ink); font-family:var(--mpm-font); }
.mpm-sec__head{ display:flex; align-items:flex-start; gap:14px; margin-bottom:12px; }
.mpm-sec__badge{ display:grid; place-items:center; flex:none; width:40px; height:40px; border-radius:50%;
  background:var(--mpm-sel); color:var(--mpm-on-sel); }
.mpm-sec__t{ margin:0; font-family:var(--mpm-font-display); font-size:18px; font-weight:400; line-height:1.35; color:var(--mpm-ink); }
.mpm-sec__sub{ margin:2px 0 0; font-size:13px; color:var(--mpm-ink-2); }
.mpm-sec__p{ margin:0 0 8px; font-size:14px; color:var(--mpm-ink-2); }

.mpm-sec__list{ margin:0 -24px; padding:0; border-top:1px solid var(--mpm-line); }
.mpm-sec__list > div{ display:grid; grid-template-columns:150px minmax(0,1fr); gap:16px; align-items:baseline;
  padding:12px 24px; border-bottom:1px solid var(--mpm-line); }
.mpm-sec__list dt{ font-size:13px; font-weight:500; color:var(--mpm-ink-2); }
.mpm-sec__list dd{ margin:0; display:grid; gap:4px; justify-items:start; font-size:14px; color:var(--mpm-ink); }
.mpm-sec__list small{ font-size:12px; color:var(--mpm-ink-2); }

.mpm-sec__chip{ display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:8px;
  font-size:12px; font-weight:500; background:var(--mpm-hover); color:var(--mpm-ink); }
.mpm-sec__chip--ok{ background:color-mix(in srgb, var(--mpm-ok) 14%, transparent); color:var(--mpm-ok-ink); }
.mpm-sec__chip--warn{ background:color-mix(in srgb, var(--mpm-warn) 18%, transparent); color:var(--mpm-warn-ink); }

.mpm-sec__row{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:16px; }
.mpm-sec__row--end{ justify-content:flex-end; }
.mpm-sec__btn{ display:inline-flex; align-items:center; gap:8px; height:40px; padding:0 20px 0 16px; border:0;
  border-radius:999px; background:var(--mpm-grad); color:#fff; cursor:pointer; text-decoration:none;
  font-family:var(--mpm-font-display); font-size:14px; font-weight:500; }
.mpm-sec__btn:hover{ filter:brightness(1.06); box-shadow:0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); }
.mpm-sec__btn:disabled{ opacity:.6; cursor:progress; }
.mpm-sec__btn--tonal{ background:var(--mpm-sel); color:var(--mpm-on-sel); }
.mpm-sec__btn--tonal:hover{ background:var(--mpm-sel-2); box-shadow:none; filter:none; }
.mpm-sec__btn--line{ background:transparent; color:var(--mpm-v-500); box-shadow:inset 0 0 0 1px var(--mpm-line); }
.mpm-sec__btn--line:hover{ background:color-mix(in srgb, var(--mpm-v-500) 8%, transparent); box-shadow:inset 0 0 0 1px var(--mpm-line); filter:none; }
.mpm-sec__btn--text{ background:transparent; color:var(--mpm-v-500); padding:0 14px; }
.mpm-sec__btn--text:hover{ background:color-mix(in srgb, var(--mpm-v-500) 8%, transparent); box-shadow:none; filter:none; }
.mpm-sec__btn:focus-visible, .mpm-sec__icon:focus-visible{ outline:2px solid var(--mpm-v-400); outline-offset:2px; }

.mpm-sec__form{ display:grid; gap:8px; padding-top:4px; }
.mpm-sec__k{ font-size:13px; font-weight:500; color:var(--mpm-ink-2); }
.mpm-sec__field{ display:flex; align-items:center; gap:4px; height:56px; padding:0 6px 0 14px;
  border:1px solid var(--mpm-ink-3); border-radius:4px; background:var(--mpm-paper); }
.mpm-sec__field:hover{ border-color:var(--mpm-ink); }
.mpm-sec__field:focus-within{ border-color:var(--mpm-v-500); box-shadow:inset 0 0 0 1px var(--mpm-v-500); }
.mpm-sec__field.is-bad{ border-color:var(--mpm-danger); box-shadow:inset 0 0 0 1px var(--mpm-danger); }
.mpm-sec__lead{ flex:none; color:var(--mpm-ink-2); margin-right:6px; }
.mpm-sec__field input{ flex:1; min-width:0; height:100%; border:0; outline:0; background:transparent; padding:0;
  font-family:var(--mpm-font-display); font-size:18px; letter-spacing:.02em; color:var(--mpm-ink); }
.mpm-sec__icon{ display:grid; place-items:center; flex:none; width:40px; height:40px; border:0; border-radius:50%;
  background:transparent; color:var(--mpm-ink-2); cursor:pointer; }
.mpm-sec__icon:hover{ background:var(--mpm-hover); }
.mpm-sec__hint, .mpm-sec__err{ margin:0; font-size:12px; color:var(--mpm-ink-2); }
.mpm-sec__err{ color:var(--mpm-danger-ink); margin-top:8px; }
.mpm-sec__form .mpm-sec__err{ margin-top:0; }
.mpm-sec__info{ display:flex; align-items:flex-start; gap:10px; margin:8px 0 0; padding:12px 14px; border-radius:12px;
  background:var(--mpm-tint); font-size:13px; line-height:1.5; color:var(--mpm-ink); }
.mpm-sec__info .m-icon{ flex:none; margin-top:1px; color:var(--mpm-v-500); }

.mpm-sec__ok{ display:flex; align-items:center; gap:8px; margin:12px 0 0; font-size:14px; font-weight:500; color:var(--mpm-ok-ink); }
.mpm-sec__done .mpm-sec__ok{ margin-top:4px; }
.mpm-sec__reveal{ display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:4px 16px;
  margin:14px 0 16px; padding:14px 16px; border-radius:12px; background:var(--mpm-sel); }
.mpm-sec__reveal .mpm-sec__k{ grid-column:1 / -1; color:var(--mpm-on-sel); }
.mpm-sec__pw{ font-family:var(--mpm-font-display); font-size:24px; font-weight:500; letter-spacing:.03em;
  color:var(--mpm-on-sel); background:none; padding:0; overflow-wrap:anywhere; user-select:all; }
.mpm-sec__reveal .mpm-sec__btn--tonal{ background:var(--mpm-paper); }
.mpm-sec__reveal .mpm-sec__btn--tonal:hover{ background:var(--mpm-paper); box-shadow:0 1px 3px rgb(0 0 0 / .15); }
.mpm-sec__done .mpm-sec__row{ margin-top:0; }
.mpm-sec__fine{ margin:14px 0 0; font-size:12px; line-height:1.5; color:var(--mpm-ink-2); }

.mpm-sec__confirm{ margin-top:16px; padding:14px 16px; border-radius:12px; background:var(--mpm-tint); }
.mpm-sec__confirm p{ margin:0; font-size:14px; line-height:1.5; }
.mpm-sec__confirm .mpm-sec__row{ margin-top:12px; }

@media (max-width:640px){
  .mpm-sec{ padding:16px; }
  .mpm-sec__list{ margin:0 -16px; }
  .mpm-sec__list > div{ grid-template-columns:1fr; gap:4px; padding:12px 16px; }
  .mpm-sec__btn{ height:44px; }
  .mpm-sec__row > .mpm-sec__btn{ flex:1 1 auto; justify-content:center; }
  .mpm-sec__pw{ font-size:20px; }
}
`;
