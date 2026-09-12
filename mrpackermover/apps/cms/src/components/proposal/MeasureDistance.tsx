'use client';
import { useCallback, useState } from 'react';
import { Button, useField } from '@payloadcms/ui';

/**
 * `ui` field under the route row on Proposals: measures the driving distance between
 * the pickup and drop already typed into the form, and writes it into Distance.
 *
 * A proposal built from a lead inherits the distance the quote form measured. A
 * proposal for someone who phoned in has no lead, and that DISTANCE line is the one
 * figure on the PDF a customer will check against their own map app — so it should not
 * be a guess, and it should not be a reason to go and open Google Maps in another tab.
 *
 * The lookup runs on the server (GET /api/route-distance) because the unrestricted
 * maps key lives there. Nothing here knows the key.
 */

/** A caught value is `unknown`; render it the way `e?.message || e` would. */
function errText(e: unknown): string {
  const message = e instanceof Error ? e.message : '';
  return message || String(e);
}

const asText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function MeasureDistance(): React.JSX.Element {
  // useField rather than the form reducer, for the same reason as LeadAutofill: it is
  // the path Payload's own fields use, and it does the bookkeeping a raw dispatch skips.
  const from = useField<string>({ path: 'move.from' });
  const to = useField<string>({ path: 'move.to' });
  const dist = useField<string>({ path: 'move.dist' });
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const measure = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(
        `/api/route-distance?from=${encodeURIComponent(asText(from.value))}` +
          `&to=${encodeURIComponent(asText(to.value))}`,
        { credentials: 'same-origin' },
      );
      const data = (await res.json()) as { km?: number; error?: string };
      if (!res.ok || typeof data.km !== 'number') {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      dist.setValue(`${data.km.toLocaleString('en-IN')} km`);
      setNote(`Measured ${data.km.toLocaleString('en-IN')} km by road.`);
    } catch (e) {
      setNote(errText(e));
    } finally {
      setBusy(false);
    }
  }, [from.value, to.value, dist]);

  const ready = Boolean(asText(from.value) && asText(to.value));

  return (
    <div style={{ margin: '-0.4rem 0 0.9rem', fontSize: '.82rem' }}>
      <Button
        buttonStyle="secondary"
        size="small"
        onClick={() => void measure()}
        disabled={busy || !ready}
      >
        {busy ? 'Measuring…' : 'Measure road distance'}
      </Button>
      <span style={{ marginLeft: '.6rem', opacity: 0.75 }}>
        {note ?? (ready ? 'Uses the pickup and drop above.' : 'Fill in From and To first.')}
      </span>
    </div>
  );
}
