'use client';
import { useField } from '@payloadcms/ui';
import { contactLinks } from '../../lib/contact-links.js';

/**
 * Call and WhatsApp buttons for a lead's phone number - the "dial strip".
 *
 * Two exports, one behaviour:
 *   `PhoneCell`  - the Phone column in the Leads list, so a salesperson can ring
 *                  straight from the list instead of opening each lead to copy a number.
 *   `PhoneField` - the same pair on the lead itself, where the call actually happens.
 *
 * Both are real links rather than buttons: `tel:` and `https://wa.me/` are what the
 * phone's own dialler and WhatsApp expect, so this works on a coordinator's desk phone,
 * an Android in the field, and WhatsApp Web on a laptop without three code paths.
 *
 * `stopPropagation` on the cell links matters - the whole row navigates to the lead, so
 * without it tapping Call would open the record instead of dialling.
 *
 * Presentation is class-based rather than inline. It used to be inline because there was
 * no stylesheet to reach; AdminTheme now provides one app-wide, and inline styles cannot
 * respond to the theme or to the phone breakpoint - on a narrow screen this strip becomes
 * a full-width bar, which an inline `display:inline-flex` would have had to be beaten
 * with !important to undo.
 */

const Phone = (): React.JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.8 2Z" />
  </svg>
);

const Whatsapp = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.18-1.36a9.9 9.9 0 0 0 4.86 1.24h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm0 18.17h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.22 8.22 0 1 1 6.98 3.86Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12s-.63.8-.77.96c-.14.17-.28.19-.53.06a6.74 6.74 0 0 1-3.37-2.95c-.25-.43.25-.4.72-1.33.08-.17.04-.31-.02-.44-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3c-.22.25-.85.83-.85 2.02s.87 2.35 1 2.51c.12.17 1.71 2.61 4.15 3.66 1.54.67 2.15.72 2.92.61.47-.07 1.46-.6 1.66-1.18s.2-1.07.14-1.18c-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);

/**
 * Icon-only.
 *
 * The labels read "Call" and "WhatsApp" next to every row, which is nine repetitions of
 * two words the icons already say. The accessible name moves to aria-label, so a screen
 * reader still hears "Call Ravi Kumar" - the text was never what made it usable.
 */
function Actions({
  value,
  showNumber,
  variant,
}: {
  value: unknown;
  showNumber: boolean;
  variant: 'cell' | 'field';
}): React.JSX.Element | null {
  const { tel, whatsapp, e164 } = contactLinks(value);
  const text = typeof value === 'string' ? value : '';
  if (!text) return null;

  const stop = (e: React.MouseEvent): void => e.stopPropagation();

  return (
    <span className={'mpm-dial mpm-dial--' + variant}>
      {showNumber && <span className="mpm-dial__num">{text}</span>}
      <span className="mpm-dial__btns">
        {tel && (
          <a
            href={tel}
            onClick={stop}
            className="mpm-dial__btn mpm-dial__btn--call"
            title={'Call ' + text}
            aria-label={'Call ' + text}
          >
            <Phone />
          </a>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            onClick={stop}
            target="_blank"
            rel="noopener noreferrer"
            className="mpm-dial__btn mpm-dial__btn--wa"
            title={'WhatsApp +' + e164}
            aria-label={'WhatsApp ' + text}
          >
            <Whatsapp />
          </a>
        )}
      </span>
    </span>
  );
}

/**
 * Just the two buttons, for a row that already shows the number somewhere else.
 *
 * Used by the handler and sales dashboards, whose lead rows are a call sheet: the queue
 * exists so somebody rings the customer, and making them open the record first to find a
 * dialable link put two taps in front of the only action that matters.
 */
export function PhoneButtons({ phone }: { phone?: string | null }): React.JSX.Element | null {
  return <Actions value={phone} showNumber={false} variant="cell" />;
}

/** Phone column in the Leads list. Payload passes the column's value as `cellData`. */
export function PhoneCell({ cellData }: { cellData?: unknown }): React.JSX.Element | null {
  return <Actions value={cellData} showNumber variant="cell" />;
}

/** `ui` field on the lead itself, reading the phone straight from form state. */
export function PhoneField(): React.JSX.Element | null {
  const { value } = useField<string>({ path: 'phone' });
  if (!value) return null;
  return (
    <div className="mpm-dial-field">
      <Actions value={value} showNumber={false} variant="field" />
    </div>
  );
}
