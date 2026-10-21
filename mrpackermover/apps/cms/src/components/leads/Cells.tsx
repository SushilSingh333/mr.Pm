'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useAuth, useListRelationships } from '@payloadcms/ui';
import {
  REVIEW_BUCKETS,
  exactTime,
  isUnworkedSecondChance,
  personCase,
  statusMeta,
  type SecondChanceRow,
} from '../dashboard/lead-status.js';
import { useBrowserClock } from '../../lib/use-browser-clock.js';

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
function OwnerName({ cellData }: { cellData?: unknown }): React.JSX.Element {
  const { documents, getRelationships } = useListRelationships();
  const { user: me } = useAuth();

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

  // Cased like every other name on the board: "sushil" as typed at sign-up reads as a
  // typo in a column of "Preeti Sharma"s.
  const show = (n: string): React.JSX.Element => <span className="mpm-owner">{personCase(n)}</span>;

  const name = populated?.name ?? populated?.email;
  if (name) return show(name);

  // The commonest owner on a salesperson's list is the salesperson - it is the only
  // owner they can see. Their own name is already in the session, so it shows at once
  // instead of reading "Assigned" until a lookup for a record they are logged in as lands.
  const self = me as { id?: number | string; name?: string; email?: string } | null;
  if (self && String(self.id) === String(id) && (self.name || self.email)) {
    return show((self.name || self.email) as string);
  }

  const doc = documents?.users?.[id];
  if (doc && typeof doc === 'object') {
    const user = doc as { name?: string; email?: string };
    const resolved = user.name ?? user.email;
    if (resolved) return show(resolved);
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

/** What a list row knows about a second chance (see Leads: revivedFrom etc.). */
interface RevivedRow {
  status?: string | null;
  revivedAt?: string | null;
  revivedFrom?: string | null;
  secondChances?: SecondChanceRow[] | null;
}
const routes = (user: unknown): boolean => {
  const role = (user as { role?: string } | null | undefined)?.role;
  return role === 'admin' || role === 'handler';
};

/**
 * The owner, and for admins and handlers a "2nd chance" tag on a lead that was lost and
 * handed on as fresh - with what it was and who had it in the tooltip. A salesperson never
 * sees the tag (and cannot read the fields behind it).
 */
export function OwnerCell({
  cellData,
  rowData,
}: {
  cellData?: unknown;
  rowData?: RevivedRow;
}): React.JSX.Element {
  const { user } = useAuth();
  // Tagged when it was lost by someone and moved on: handed on fresh (revivedAt), or at a
  // stage the admin chose - the loss is on record either way (Leads: secondChances).
  const fresh = Boolean(rowData?.revivedAt);
  const last = rowData?.secondChances?.at(-1);
  if (!(fresh || last) || !routes(user)) return <OwnerName cellData={cellData} />;
  const was = statusMeta(rowData?.revivedFrom ?? last?.from ?? 'lost').label;
  const lostWith = last?.ownerName;
  // Once the new owner moves it into Qualified, the tag says so: that is the win.
  const wonBack =
    !isUnworkedSecondChance(rowData ?? {}) &&
    (REVIEW_BUCKETS[0]?.statuses ?? []).includes(String(rowData?.status ?? ''));
  // Every time it was lost, for the tooltip: a lead revived twice was lost by two people.
  const history = (rowData?.secondChances ?? [])
    .map(
      (r) =>
        `${statusMeta(r.from ?? 'lost').label}${r.ownerName ? ` with ${personCase(r.ownerName)}` : ''}`,
    )
    .join(', then ');
  const tip =
    `Second chance: was ${history || was}. ` +
    (fresh
      ? `Given as a fresh lead ${exactTime(rowData?.revivedAt ?? '')}; the new owner sees it as new.`
      : 'Handed on with its history; it counts as a loss for whoever lost it.') +
    (wonBack ? ` Won back: now ${statusMeta(rowData?.status ?? '').label}.` : '');
  // The first name of whoever lost it last, on the tag itself: filtering the list by a
  // salesperson brings in the leads they lost, and this says why each one is there.
  const who = lostWith ? personCase(lostWith).split(' ')[0] : '';
  return (
    <span className="mpm-owner-wrap">
      <OwnerName cellData={cellData} />
      <span className={`mpm-second${wonBack ? ' is-won' : ''}`} title={tip}>
        {wonBack ? 'Won back' : '2nd chance'} · was {was}
        {who ? ` with ${who}` : ''}
      </span>
    </span>
  );
}

export function AgeCell({
  cellData,
  rowData,
}: {
  cellData?: unknown;
  rowData?: RevivedRow;
}): React.JSX.Element | null {
  useBrowserClock();
  const { user } = useAuth();
  // A salesperson's second-chance lead is as old as their having it, not as the lead.
  const fresh = rowData?.revivedAt && !routes(user) ? rowData.revivedAt : null;
  const at = fresh ?? (typeof cellData === 'string' ? cellData : '');
  if (!at) return null;
  const text = age(at);
  if (!text) return null;
  return (
    <span className="mpm-age" title={exactTime(at)} suppressHydrationWarning>
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
/**
 * The customer's name, as a person would write it.
 *
 * Quote forms arrive in whatever case the customer typed, and on a phone that is very
 * often SHOUTED IN CAPITALS. On the mobile card that name is the heading, and in caps it
 * both wraps onto a second line and reads as an alarm - caps remove the word-shape the
 * eye uses to recognise a name at a glance.
 *
 * Only rewritten when it is ALREADY all caps, so a name somebody typed properly is left
 * exactly as they typed it and "McKenzie" is never re-cased.
 */
export function NameCell({
  cellData,
  rowData,
  collectionSlug,
  linkURL,
}: {
  cellData?: unknown;
  rowData?: { id?: number | string };
  collectionSlug?: string;
  linkURL?: string;
}): React.JSX.Element {
  const raw = typeof cellData === 'string' ? cellData.trim() : '';
  const label = personCase(raw) || 'Unnamed';
  /**
   * THE LINK IS THE POINT OF THIS COLUMN.
   *
   * Payload wraps the first column in a Link inside its own `DefaultCell`. Supplying
   * `admin.components.Cell` REPLACES that component, links and all - so this cell has to
   * render its own anchor or the entire list becomes dead text that cannot be opened.
   */
  const href =
    linkURL ??
    (rowData?.id != null && collectionSlug
      ? `/admin/collections/${collectionSlug}/${String(rowData.id)}`
      : undefined);
  const body = raw ? <span>{label}</span> : <span className="mpm-cell-empty">{label}</span>;
  if (!href) return body;
  return (
    <Link href={href} className="mpm-cell-link" prefetch={false}>
      {body}
    </Link>
  );
}

export function ServiceCell({ cellData }: { cellData?: unknown }): React.JSX.Element | null {
  const text = typeof cellData === 'string' ? cellData.trim() : '';
  if (!text) return null;
  return <span>{text}</span>;
}
