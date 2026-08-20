'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useFormFields } from '@payloadcms/ui';

/**
 * `ui` field on Proposals, next to the Lead selector. When you pick (or change) the linked
 * lead, it fetches that lead and fills the proposal's customer + move fields from what the
 * customer submitted — name, phone, pickup→origin, drop→destination, date, and size. It only
 * fills fields the lead actually has (never blanks your edits), and it does NOT auto-run on a
 * proposal that already has a lead when you open it (so it won't clobber later manual edits) —
 * use the "Fill from lead" button for that.
 */

// Map a lead's size (the estimator sends "14 ft"; some leads carry "14"/"14ft") to a truck option.
const TRUCK = ['10 ft', '12 ft', '14 ft', '15 ft', '16 ft', '17 ft', '19 ft'];
function normTruck(s: unknown): string | null {
  if (!s) return null;
  const m = String(s).match(/(\d{2})/);
  return m ? TRUCK.find((t) => t === `${m[1]} ft`) || null : null;
}

function leadIdOf(v: unknown): string | number | null {
  if (v == null) return null;
  if (typeof v === 'object') return (v as any).value ?? (v as any).id ?? null;
  return v as string | number;
}

export function LeadAutofill(): React.JSX.Element | null {
  const leadValue = useFormFields(([fields]) => fields?.lead?.value);
  const { dispatchFields } = useForm();
  const leadId = leadIdOf(leadValue);

  const firstRun = useRef(true);
  const lastLoaded = useRef<string | number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fill = useCallback(
    async (id: string | number) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/leads/${id}?depth=0`, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const lead = await res.json();
        const set = (path: string, value: unknown): void => {
          if (value != null && value !== '') dispatchFields({ type: 'UPDATE', path, value });
        };
        set('customer.name', lead.name);
        set('customer.phone', lead.phone);
        set('move.from', lead.pickup);
        set('move.to', lead.dropLocation);
        set('move.date', lead.moveDate);
        set('move.house', normTruck(lead.moveSize));
        lastLoaded.current = id;
        setNote(`Filled from lead: ${lead.name || id}`);
      } catch (e: any) {
        setNote('Could not load lead: ' + (e?.message || e));
      } finally {
        setBusy(false);
      }
    },
    [dispatchFields],
  );

  // Auto-fill only when the user CHANGES the lead (not on initial load of a saved proposal).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      lastLoaded.current = leadId;
      return;
    }
    if (leadId && leadId !== lastLoaded.current) void fill(leadId);
  }, [leadId, fill]);

  return (
    <div style={{ margin: '-0.4rem 0 0.6rem', fontSize: '.82rem' }}>
      {leadId ? (
        <button
          type="button"
          onClick={() => void fill(leadId)}
          disabled={busy}
          style={{
            cursor: 'pointer',
            border: '1px solid color-mix(in srgb, #6D5AE6 30%, transparent)',
            background: 'color-mix(in srgb, #6D5AE6 8%, transparent)',
            color: 'var(--theme-text)',
            padding: '.35rem .7rem',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {busy ? 'Filling…' : '↧ Fill from lead'}
        </button>
      ) : (
        <span style={{ color: 'var(--theme-elevation-500)' }}>
          Pick a lead to auto-fill customer &amp; route.
        </span>
      )}
      {note && <div style={{ color: 'var(--theme-elevation-600)', marginTop: 5 }}>{note}</div>}
    </div>
  );
}
