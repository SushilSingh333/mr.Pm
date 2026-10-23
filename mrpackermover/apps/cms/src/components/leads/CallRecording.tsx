'use client';
import { useField } from '@payloadcms/ui';
import { MIcon } from '../icons/MIcon.js';

/**
 * "Call recording" on a lead - a player and a link, for leads that arrived from a phone
 * system (an IVR such as CallerDesk) with a recording URL in what it sent.
 *
 * The value is the virtual `callRecording` field (collections/Leads.ts), read out of the
 * lead's raw payload, so the person working the lead can hear the call without opening
 * the admin-only payload. Draws nothing when there is no recording.
 */
export function CallRecording({ path }: { path?: string }): React.JSX.Element | null {
  const { value } = useField<string>({ path: path ?? 'callRecording' });
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return null;
  return (
    <section className="mpm-rec" aria-label="Call recording">
      <style>{CSS}</style>
      <p className="mpm-rec__t">
        <MIcon name="phone_callback" size={18} />
        Call recording
      </p>
      {/* preload="none": nothing is fetched until someone presses play. */}
      <audio className="mpm-rec__audio" controls preload="none" src={value}>
        <track kind="captions" />
      </audio>
      <a className="mpm-rec__link" href={value} target="_blank" rel="noopener noreferrer">
        Open recording
      </a>
    </section>
  );
}

const CSS = `
.mpm-rec{ margin:0 0 20px; padding:12px 14px; border:1px solid var(--mpm-line,#E3E3E3); border-radius:12px;
  background:var(--mpm-paper,#fff); font-family:var(--mpm-font); }
.mpm-rec__t{ display:flex; align-items:center; gap:8px; margin:0 0 8px; font-size:14px; font-weight:500; color:var(--mpm-ink); }
.mpm-rec__t .m-icon{ color:var(--mpm-v-500,#0B57D0); }
.mpm-rec__audio{ display:block; width:100%; max-width:520px; height:40px; }
.mpm-rec__link{ display:inline-block; margin-top:8px; font-size:13px; font-weight:500; color:var(--mpm-v-500,#0B57D0); text-decoration:none; }
.mpm-rec__link:hover{ text-decoration:underline; }
.mpm-rec__link:focus-visible{ outline:2px solid var(--mpm-v-500,#0B57D0); outline-offset:2px; border-radius:4px; }
`;
