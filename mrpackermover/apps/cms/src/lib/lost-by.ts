import type { Payload, Where } from 'payload';
import { personCase } from '../components/dashboard/lead-status.js';

/**
 * The leads one person LOST that were later handed to someone on a second chance
 * (Leads: `secondChances`). They stay that person's losses for good, so they count in
 * their review - and they can see the list - even though the lead itself is no longer
 * theirs to open.
 *
 * Read with access off, and only ever handed out as this thin row: the customer's name,
 * the stage they lost it at, and when it moved on. Never the phone, the new owner, the
 * lead's progress since, or its id. The person already had the name; anything more would
 * be a way into a colleague's lead, and a second call to the customer.
 */
export interface LostRow {
  name: string;
  /** The stage they lost it at (lost, call-not-picked, call-not-connected). */
  from: string;
  /** When it was handed on. */
  at: string | null;
  /** When the customer first wrote - what every review's date window is measured by. */
  createdAt: string | null;
  /** Handed back to this same person later: it is in their own list again. */
  backWithYou: boolean;
}

const idOf = (v: unknown): string =>
  v && typeof v === 'object'
    ? String((v as { id?: unknown }).id ?? '')
    : v == null
      ? ''
      : String(v);

export async function lostBy(
  payload: Payload,
  userId: string | number,
  /** More conditions on the lead - a date window, a search. */
  extra: Where[] = [],
): Promise<LostRow[]> {
  const me = String(userId);
  const res = await payload.find({
    collection: 'leads',
    where: { and: [{ 'secondChances.owner': { equals: userId } }, ...extra] },
    select: { name: true, assignedTo: true, createdAt: true, secondChances: true } as never,
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
  });
  // Row by row: the stage THIS person lost it at, once per time they lost it. Two
  // `where`s on the array could match the owner on one row and the stage on another.
  const rows = (
    res.docs as unknown as {
      name?: string;
      assignedTo?: unknown;
      createdAt?: string;
      secondChances?: { owner?: unknown; from?: string | null; at?: string | null }[];
    }[]
  ).flatMap((d) =>
    (d.secondChances ?? [])
      .filter((r) => idOf(r.owner) === me && r.from)
      .map((r) => ({
        name: personCase(d.name ?? '') || 'Unnamed customer',
        from: String(r.from),
        at: r.at ?? null,
        createdAt: d.createdAt ?? null,
        backWithYou: idOf(d.assignedTo) === me,
      })),
  );
  return rows.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
}
