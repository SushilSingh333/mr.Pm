'use client';

/**
 * Route a whole selection of leads to one person, from the list view.
 *
 * Handing leads over one at a time is fine for one lead and miserable for twenty, which
 * is exactly the moment it is needed: somebody goes on leave, or leaves, and their open
 * work has to move today. This is that operation - tick the rows, pick a name, done.
 *
 * It sets `assignedTo` and NOTHING else. Everything that ought to follow from a handover
 * already follows from it: the `beforeChange` hook on the collection moves the lead to
 * Assigned or Reassigned, stamps `assignedAt`, records who did it, and clears
 * `acknowledgedAt` so the new owner sees it as new to them. Re-implementing any of that
 * here would be a second copy of the rule, free to drift from the first - and the hook
 * also knows the things a bulk action should not have to: that a lead already past
 * Quoted keeps its stage rather than being knocked back to Assigned.
 *
 * The result line reports what the SERVER did, counted from the returned documents,
 * rather than what was predicted before sending. Those differ - a quoted lead changes
 * hands without changing stage - and the honest number is the one worth showing.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useSelection } from '@payloadcms/ui';

interface Person {
  id: number | string;
  name?: string;
  email?: string;
  role?: string;
}

interface UpdatedDoc {
  status?: string;
}

/**
 * Serial (integer) primary keys. Payload validates a relationship with
 * `isValidID(value, 'number')`, which rejects the string "190" outright - the same trap
 * the round-robin card hit, where the save came back 400 naming the value and its index.
 */
const coerceId = (raw: string): string | number => (/^\d+$/.test(raw) ? Number(raw) : raw);

const label = (p: Person): string => p.name ?? p.email ?? `#${String(p.id)}`;

export function BulkAssign(): React.JSX.Element | null {
  const { user } = useAuth();
  const { count, getQueryParams } = useSelection();
  const router = useRouter();

  const role = (user as { role?: string } | null)?.role;
  // The UI half of the rule. The real one is field access on `assignedTo`, checked on the
  // server, so hiding this cannot be mistaken for enforcing anything.
  const mayRoute = role === 'admin' || role === 'handler';

  const [people, setPeople] = useState<Person[]>([]);
  const [target, setTarget] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mayRoute) return;
    let alive = true;
    // The same pool the `assignedTo` field offers, so this can never route work to
    // somebody who could not have been given it by hand.
    void fetch(
      '/api/users?where[role][in][0]=handler&where[role][in][1]=sales&limit=200&depth=0&sort=name',
      { credentials: 'include' },
    )
      .then((r) => r.json() as Promise<{ docs?: Person[] }>)
      .then((d) => {
        if (alive) setPeople(d.docs ?? []);
      })
      .catch(() => {
        /* the picker simply stays empty; the bar explains itself below */
      });
    return () => {
      alive = false;
    };
  }, [mayRoute]);

  // Changing the selection invalidates a pending confirmation: "Assign 12" must never
  // still be on screen, armed, after the 12 became 3.
  useEffect(() => {
    setConfirming(false);
    setError(null);
  }, [count]);

  const commit = useCallback(async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads${getQueryParams()}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: coerceId(target) }),
      });
      const body = (await res.json()) as { docs?: UpdatedDoc[]; errors?: unknown[] };
      if (!res.ok) throw new Error(String(res.status));

      const docs = Array.isArray(body.docs) ? body.docs : [];
      const errs = Array.isArray(body.errors) ? body.errors : [];
      const handedOver = docs.filter((d) => d.status === 'reassigned').length;
      const who = people.find((p) => String(p.id) === target);

      const parts = [
        `${docs.length} ${docs.length === 1 ? 'lead' : 'leads'} now with ${who ? label(who) : 'the new owner'}.`,
      ];
      if (handedOver > 0) {
        parts.push(
          `${handedOver} ${handedOver === 1 ? 'was' : 'were'} already someone else's and now ${handedOver === 1 ? 'reads' : 'read'} Reassigned.`,
        );
      }
      if (errs.length > 0) parts.push(`${errs.length} could not be updated.`);
      setResult(parts.join(' '));
      setConfirming(false);
      setTarget('');

      // Payload's own bulk edit refreshes this way: a changed search param re-runs the
      // server component, which rebuilds the rows AND drops the tick boxes. A plain
      // router.refresh() leaves the old selection behind, pointing at stale rows.
      //
      // Read from the URL here rather than with useSearchParams(). That hook runs during
      // render and opts the subtree out of static rendering, and registering this
      // component with it in place put a hydration mismatch on the list view that was not
      // there before - reported, confusingly, against Payload's own column pill selector
      // rather than against this file. Nothing here needs the value until a click.
      const params = new URLSearchParams(window.location.search);
      params.set('_r', String(Date.now()));
      router.replace(`?${params.toString()}`);
    } catch {
      // The selection and the chosen name are left alone so the action can simply be
      // retried. Clearing them would mean re-ticking twenty rows to try again.
      setError('Could not move those leads. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }, [getQueryParams, people, router, target]);

  if (!mayRoute) return null;
  // Nothing selected and nothing to report: stay out of the way entirely.
  if (count === 0 && !result) return null;

  const noun = count === 1 ? 'lead' : 'leads';

  return (
    <div className="mpm-bulk" role="region" aria-label="Assign selected leads">
      {count > 0 && (
        <>
          <span className="mpm-bulk__count">
            <strong>{count}</strong> {noun} selected
          </span>

          {confirming ? (
            <span className="mpm-bulk__confirm">
              <span className="mpm-bulk__ask">
                Move {count} {noun} to{' '}
                <strong>
                  {label(people.find((p) => String(p.id) === target) ?? { id: target })}
                </strong>
                ?
              </span>
              <button
                type="button"
                className="mpm-bulk__go"
                disabled={busy}
                onClick={() => void commit()}
              >
                {busy ? 'Moving…' : 'Confirm'}
              </button>
              <button
                type="button"
                className="mpm-bulk__cancel"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </span>
          ) : (
            <>
              <select
                className="mpm-bulk__who"
                aria-label="Assign the selected leads to"
                value={target}
                disabled={busy || people.length === 0}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setResult(null);
                }}
              >
                <option value="">{people.length === 0 ? 'No one available' : 'Assign to…'}</option>
                {people.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {label(p)}
                    {p.role === 'handler' ? ' (handler)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="mpm-bulk__go"
                disabled={!target || busy}
                onClick={() => setConfirming(true)}
              >
                Assign {count} {noun}
              </button>
            </>
          )}
        </>
      )}

      {error && <span className="mpm-bulk__error">{error}</span>}
      {!error && result && <span className="mpm-bulk__ok">{result}</span>}
    </div>
  );
}
