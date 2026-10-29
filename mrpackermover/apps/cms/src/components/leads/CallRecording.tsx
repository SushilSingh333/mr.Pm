'use client';
import { useField } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';

interface Recording {
  url: string;
  at: string | null;
  by: string | null;
}

/**
 * "Call recordings" on a lead - a player and a link per call, for leads a phone system
 * (an IVR such as CallerDesk) sent with a recording URL.
 *
 * The value is the virtual `callRecording` field (collections/Leads.ts), read out of the
 * lead's raw payload, so the person working the lead can hear the calls without opening
 * the admin-only payload. A customer who rings again joins the same lead
 * (lib/repeat-contact.ts), so there can be several - listed oldest first, each with when
 * it came in and who took it. Draws nothing when there is none.
 */
export function CallRecording({ path }: { path?: string }): React.JSX.Element | null {
  const { value } = useField<unknown>({ path: path ?? 'callRecording' });
  const list = (Array.isArray(value) ? (value as Recording[]) : []).filter(
    (r) => r && typeof r.url === 'string' && /^https?:\/\//i.test(r.url),
  );
  if (!list.length) return null;
  const many = list.length > 1;
  return (
    <section className="mpm-rec" aria-label="Call recordings">
      <style>{CSS}</style>
      <p className="mpm-rec__t">
        <MIcon name="phone_callback" size={18} />
        {many ? `Call recordings (${list.length})` : 'Call recording'}
      </p>
      <ul className="mpm-rec__list">
        {list.map((r, i) => (
          <li key={`${r.url}-${i}`} className="mpm-rec__item">
            {many || r.at || r.by ? (
              <p className="mpm-rec__meta" suppressHydrationWarning>
                {[many ? `Call ${i + 1}` : null, when(r.at), r.by ? `taken by ${r.by}` : null]
                  .filter(Boolean)
                  .join(' - ')}
              </p>
            ) : null}
            {/* preload="none": nothing is fetched until someone presses play. */}
            <audio className="mpm-rec__audio" controls preload="none" src={r.url}>
              <track kind="captions" />
            </audio>
            <a className="mpm-rec__link" href={r.url} target="_blank" rel="noopener noreferrer">
              Open recording
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function when(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const CSS = `
.mpm-rec{ margin:0 0 20px; padding:12px 14px; border:1px solid var(--mpm-line,#E3E3E3); border-radius:12px;
  background:var(--mpm-paper,#fff); font-family:var(--mpm-font); }
.mpm-rec__t{ display:flex; align-items:center; gap:8px; margin:0 0 8px; font-size:14px; font-weight:500; color:var(--mpm-ink); }
.mpm-rec__t .m-icon{ color:var(--mpm-v-500,#0B57D0); }
.mpm-rec__list{ list-style:none; margin:0; padding:0; }
.mpm-rec__item + .mpm-rec__item{ margin-top:12px; padding-top:12px; border-top:1px solid var(--mpm-line,#E3E3E3); }
.mpm-rec__meta{ margin:0 0 6px; font-size:13px; color:var(--mpm-ink-2,#444746); }
.mpm-rec__audio{ display:block; width:100%; max-width:520px; height:40px; }
.mpm-rec__link{ display:inline-block; margin-top:8px; font-size:13px; font-weight:500; color:var(--mpm-v-500,#0B57D0); text-decoration:none; }
.mpm-rec__link:hover{ text-decoration:underline; }
.mpm-rec__link:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:2px; border-radius:4px; }
`;
