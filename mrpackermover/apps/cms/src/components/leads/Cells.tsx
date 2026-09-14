'use client';
import { useEffect, useRef } from 'react';
import { useListRelationships } from '@payloadcms/ui';
import { exactTime } from '../dashboard/lead-status.js';

/**
 * Three list columns that Payload's defaults render in developer language.
 *
 * All three exist because the Leads list is a call sheet, not a database view. The facts
 * on a lead card decide whether YOU should ring it and how urgent it is, and Payload
 * answers two of those questions with the field name in angle brackets.
 */

/**
 * The owner.
 *
 * Payload renders an empty relationship as the literal string "<No Assigned To>" - the
 * field name in angle brackets, which is how the schema describes it rather than how a
 * coordinator would. An unclaimed lead is the single most actionable thing on the screen,
 * so it says "Unassigned" and carries the ember accent that means "needs a person".
 *
 * Resolving the name is the fiddly part. A list cell is handed the raw foreign key, not
 * the populated document - the REST API returns the whole user object at depth 1, but the
 * table does not use it - so a first version reported every assigned lead as a bare
 * "Assigned" and quietly lost the name Payload used to show. `useListRelationships` is
 * the provider Payload's own relationship cell uses: it batches one lookup for every
 * relationship in the table, so asking here costs no extra request.
 *
 * Three outcomes, and the difference between them matters. A resolved document gives the
 * name. `false` means the record could not be read - salespeople cannot read the staff
 * directory - and `null` means the batch is still in flight. Both of those render as
 * "Assigned": less information than the name, but true, where "Unassigned" would be a lie
 * that sends someone chasing a lead a colleague is already working.
 */
export function OwnerCell({ cellData }: { cellData?: unknown }): React.JSX.Element {
  const { documents, getRelationships } = useListRelationships();

  // Depending on where the cell is rendered this arrives either populated or as an id.
  const populated =
    cellData && typeof cellData === 'object'
      ? (cellData as { id?: number | string; name?: string; email?: string })
      : null;
  const id: number | string | null = populated
    ? (populated.id ?? null)
    : typeof cellData === 'number' || typeof cellData === 'string'
      ? cellData
      : null;

  // Asked at most once per id. `getRelationships` comes from context and is not
  // guaranteed to keep its identity between renders, so leaning on the dependency array
  // alone would re-request on every one.
  const asked = useRef<number | string | null>(null);
  useEffect(() => {
    if (id === null || id === '' || asked.current === id) return;
    asked.current = id;
    getRelationships([{ relationTo: 'users', value: id }]);
  }, [id, getRelationships]);

  if (id === null || id === '') {
    return <span className="mpm-owner mpm-owner--none">Unassigned</span>;
  }

  const name = populated?.name ?? populated?.email;
  if (name) return <span className="mpm-owner">{name}</span>;

  const doc = documents?.users?.[id];
  if (doc && typeof doc === 'object') {
    const user = doc as { name?: string; email?: string };
    const resolved = user.name ?? user.email;
    if (resolved) return <span className="mpm-owner">{resolved}</span>;
  }
  return <span className="mpm-owner">Assigned</span>;
}

/**
 * How long the lead has been waiting.
 *
 * "September 12th 2026, 2:24 PM" is twenty-eight characters answering a question nobody
 * asks while triaging. "3d ago" answers the one they do, and the exact stamp stays in the
 * tooltip for when a customer asks when they filled the form in.
 *
 * Deliberately coarse: minutes below an hour, hours below a day, then days, then the date
 * once a lead is old enough that its precise age has stopped mattering.
 */
function age(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 8) return days + 'd ago';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function AgeCell({ cellData }: { cellData?: unknown }): React.JSX.Element | null {
  if (typeof cellData !== 'string' || !cellData) return null;
  const text = age(cellData);
  if (!text) return null;
  return (
    <span className="mpm-age" title={exactTime(cellData)}>
      {text}
    </span>
  );
}

/**
 * The service, used as the card's subtitle.
 *
 * Empty is normal and not worth reporting: a price-check lead never names a service, and
 * a Facebook form only carries one if whoever built it asked. Payload fills the gap with
 * "<No Service>", which on a card reads as something having gone wrong. Rendering nothing
 * lets the row collapse and the card close up around it.
 */
export function ServiceCell({ cellData }: { cellData?: unknown }): React.JSX.Element | null {
  const text = typeof cellData === 'string' ? cellData.trim() : '';
  if (!text) return null;
  return <span>{text}</span>;
}
