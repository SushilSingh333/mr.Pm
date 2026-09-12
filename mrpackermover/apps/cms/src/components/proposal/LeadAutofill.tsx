'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, useField } from '@payloadcms/ui';
import { DEFAULT_PROPOSAL_SERVICE, proposalServiceFor } from '../../lib/proposal-service.js';

/**
 * `ui` field on Proposals, next to the Lead selector.
 *
 * Two jobs:
 *   1. "Create proposal" on a lead opens this form as /…/create?lead=<id>. That id is
 *      adopted into the Lead field, which then triggers job 2.
 *   2. When the lead changes, the customer and move fields are filled from what the
 *      customer actually submitted.
 *
 * Every write goes through `useField().setValue`, which is what Payload's own
 * Relationship field uses. An earlier version dispatched `{type:'UPDATE'}` straight at
 * the form reducer; the fields never populated, because that path skips the bookkeeping
 * setValue does (marking the form modified and rebuilding the server state a
 * relationship needs before it can show its label).
 *
 * `formInitializing` is the gate. On a create form the state is built asynchronously, and
 * anything written before that finishes is discarded when the built state lands.
 *
 * It only fills fields the lead actually has, so it never blanks your edits, and it does
 * not run on a saved proposal you have simply opened — use the button for that.
 */

// Map a lead's size ("14 ft", "14", "14ft") to one of the truck options.
const TRUCK = ['10 ft', '12 ft', '14 ft', '15 ft', '16 ft', '17 ft', '19 ft'];
function normTruck(s: unknown): string | null {
  if (!s) return null;
  const m = String(s).match(/(\d{2})/);
  return m ? TRUCK.find((t) => t === `${m[1]} ft`) || null : null;
}

function leadIdOf(v: unknown): string | number | null {
  if (v == null) return null;
  if (typeof v === 'object') {
    const o = v as { value?: string | number | null; id?: string | number | null };
    return o.value ?? o.id ?? null;
  }
  return v as string | number;
}

/** A caught value is `unknown`; render it the way `e?.message || e` used to. */
function errText(e: unknown): string {
  const message = e instanceof Error ? e.message : '';
  return message || String(e);
}

type Lead = Record<string, unknown>;

export function LeadAutofill(): React.JSX.Element | null {
  // One hook per field we write. Fixed list, fixed order, so the rules of hooks hold.
  const lead = useField<string | number>({ path: 'lead' });
  const custName = useField<string>({ path: 'customer.name' });
  const custPhone = useField<string>({ path: 'customer.phone' });
  const custEmail = useField<string>({ path: 'customer.email' });
  const mvFrom = useField<string>({ path: 'move.from' });
  const mvTo = useField<string>({ path: 'move.to' });
  const mvDate = useField<string>({ path: 'move.date' });
  const mvHouse = useField<string>({ path: 'move.house' });
  const mvSvc = useField<string>({ path: 'move.svc' });
  const mvDist = useField<string>({ path: 'move.dist' });

  const leadId = leadIdOf(lead.value);
  const initializing = lead.formInitializing;

  const firstRun = useRef(true);
  const lastLoaded = useRef<string | number | null>(null);
  const adopted = useRef(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fill = useCallback(
    async (id: string | number) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/leads/${id}?depth=0`, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const doc = (await res.json()) as Lead;
        /** Never blank an edit: only write when the lead actually has the value. */
        const set = (f: { setValue: (v: unknown) => void }, v: unknown): void => {
          if (v != null && v !== '') f.setValue(v);
        };
        set(custName, doc.name);
        set(custPhone, doc.phone);
        set(custEmail, doc.email);
        set(mvFrom, doc.pickup);
        set(mvTo, doc.dropLocation);
        set(mvDate, doc.moveDate);
        set(mvHouse, normTruck(doc.moveSize));
        // Same rule as the server hook: `svc` carries a default, so replace it only
        // while it is untouched.
        const mappedSvc = proposalServiceFor(doc.service);
        if (mappedSvc && (!mvSvc.value || mvSvc.value === DEFAULT_PROPOSAL_SERVICE)) {
          mvSvc.setValue(mappedSvc);
        }
        // The driving distance the quote form measured, so nobody re-types it and the
        // proposal cannot disagree with what the customer was told about the route.
        if (typeof doc.distanceKm === 'number' && doc.distanceKm > 0) {
          mvDist.setValue(`${doc.distanceKm.toLocaleString('en-IN')} km`);
        }
        /*
          `quotedLow`/`quotedHigh` are deliberately NOT copied.
          That figure is a rate-card estimate the website showed before anyone looked at
          the goods; a proposal is a fixed price we are bound to. Pre-filling charges from
          it would turn a guess into a commitment, and anchor whoever writes the quote to a
          number they never chose. It stays on the lead as context for the call.
        */
        lastLoaded.current = id;
        setNote(`Filled from lead: ${String(doc.name ?? id)}`);
      } catch (e) {
        setNote('Could not load lead: ' + errText(e));
      } finally {
        setBusy(false);
      }
    },
    [custName, custPhone, custEmail, mvFrom, mvTo, mvDate, mvHouse, mvSvc, mvDist],
  );

  // Adopt ?lead= from the URL, once, and only into an empty field: a saved proposal must
  // never be repointed at another customer because someone kept a stale URL in a tab.
  useEffect(() => {
    if (initializing || adopted.current || typeof window === 'undefined') return;
    const fromUrl = new URLSearchParams(window.location.search).get('lead');
    if (!fromUrl) return;
    adopted.current = true;
    if (leadId) return;
    lead.setValue(fromUrl);
    // Fill immediately rather than waiting for the change effect below, which would
    // otherwise need another render to notice.
    void fill(fromUrl);
  }, [initializing, leadId, lead, fill]);

  // Otherwise fill only when the user CHANGES the lead, not when opening a saved proposal.
  useEffect(() => {
    if (initializing) return;
    if (firstRun.current) {
      firstRun.current = false;
      lastLoaded.current = leadId;
      return;
    }
    if (leadId && leadId !== lastLoaded.current) void fill(leadId);
  }, [initializing, leadId, fill]);

  return (
    <div style={{ margin: '-0.4rem 0 0.6rem', fontSize: '.82rem' }}>
      {leadId ? (
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={() => void fill(leadId)}
          disabled={busy}
        >
          {busy ? 'Filling…' : 'Fill from lead'}
        </Button>
      ) : null}
      {note ? <div style={{ marginTop: '.35rem', opacity: 0.75 }}>{note}</div> : null}
    </div>
  );
}
