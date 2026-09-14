import type { Payload } from 'payload';

/**
 * Reads the round-robin settings for the dashboard card.
 *
 * A leaf module on purpose, like lead-status.ts: Dashboard imports SalesDashboard and
 * SalesDashboard imports back out of Dashboard, so anything both need has to sit
 * somewhere neither of them owns.
 *
 * Every query runs as the person looking, with access enforced. A handler may read the
 * salespeople they manage and themselves; an admin may read everyone, so the role filter
 * is here as well - without it an admin's rotation list would offer editors and ops
 * accounts that a lead can never be assigned to.
 */

export interface RoutingPerson {
  id: string | number;
  name: string;
}

export interface RoutingView {
  enabled: boolean;
  /** Ids in the rotation that this viewer can actually see in `people`. */
  memberIds: string[];
  /**
   * In the rotation, but invisible to whoever is looking.
   *
   * A handler may read salespeople and themselves - not other handlers. So a rotation
   * containing two handlers renders, for either of them, with the other one missing, and
   * a card that saved only what it could see would quietly drop that person the first
   * time anyone pressed Done. These ids are carried through every save untouched.
   */
  hiddenMemberIds: string[];
  /** Everyone who could be in it, in the order the rotation follows. */
  people: RoutingPerson[];
  /** Who the last lead went to, so the card can work out who is next. */
  lastAssignedId: string | null;
  routed: number;
}

type MaybeUser = { id?: string | number; role?: string } | null | undefined;

const idOf = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'object') {
    const id = (v as { id?: string | number }).id;
    return id == null ? null : String(id);
  }
  return String(v);
};

export async function loadRouting(payload: Payload, user: MaybeUser): Promise<RoutingView | null> {
  const role = user?.role;
  if (role !== 'admin' && role !== 'handler') return null;

  try {
    const [routing, staff] = await Promise.all([
      payload.findGlobal({
        slug: 'lead-routing',
        depth: 0,
        overrideAccess: false,
        user: user as never,
      }),
      payload.find({
        collection: 'users',
        depth: 0,
        limit: 100,
        // The rotation runs in this order, and so does the list on the card. One order,
        // decided in one place, rather than a stored sequence that the card would have
        // to render and edit as well.
        sort: 'name',
        where: { role: { in: ['handler', 'sales'] } } as never,
        overrideAccess: false,
        user: user as never,
      }),
    ]);

    const r = routing as {
      autoAssign?: boolean;
      members?: unknown[];
      lastAssignedTo?: unknown;
      assignedCount?: number;
    };

    const people = staff.docs.map((u) => {
      const row = u as { id: string | number; name?: string; email?: string };
      return { id: row.id, name: row.name || row.email || `User ${row.id}` };
    });
    const visible = new Set(people.map((p) => String(p.id)));
    const stored = (r?.members ?? []).map(idOf).filter((v): v is string => v !== null);

    return {
      enabled: Boolean(r?.autoAssign),
      memberIds: stored.filter((id) => visible.has(id)),
      hiddenMemberIds: stored.filter((id) => !visible.has(id)),
      people,
      lastAssignedId: idOf(r?.lastAssignedTo),
      routed: Number(r?.assignedCount ?? 0),
    };
  } catch {
    // The card is a convenience. A dashboard that fails to render because a global is
    // missing - which is exactly the state between deploying this and running the
    // migration - would be a much worse trade.
    return null;
  }
}
