import { REVIVABLE_STAGES } from '../components/dashboard/lead-status.js';

/**
 * Who LOST a lead, read from its saved history (Payload keeps a snapshot per save).
 *
 * A loss is a lead at a lost stage (lost, call-not-picked, call-not-connected) leaving
 * the person who took it there. The words "who took it there" matter: the oldest code
 * moved leads without resetting the stage, so a lead could arrive at somebody already
 * "Lost" and be passed on again untouched. That person never had a chance with it - it
 * is a pass-on, not their loss. One rule, used by the live Leads hook and by the
 * backfill, so the two can never disagree about who lost what.
 */
export interface Snap {
  /** When this save happened. */
  at: string;
  status: string;
  /** Owner id, '' for nobody. */
  owner: string;
  /** Who the save names as having handed it over. */
  byName?: string | null;
}

export interface Loss {
  from: string;
  owner: string;
  /** When it left them. */
  at: string;
  /** When it reached that stage with them. */
  markedAt: string;
  byName: string | null;
}

/**
 * Did `owner` inherit `stage` rather than reach it? `newestFirst` starts at the lead as
 * it is now. Walk back over the saves where it sat at that stage with them; if the save
 * before those already had it at that stage, someone else got it there.
 */
export function inheritedStage(newestFirst: Snap[], stage: string, owner: string): boolean {
  let k = 0;
  while (
    k < newestFirst.length &&
    newestFirst[k]?.status === stage &&
    newestFirst[k]?.owner === owner
  )
    k += 1;
  return k > 0 && k < newestFirst.length && newestFirst[k]?.status === stage;
}

/** Every loss and every pass-on in a lead's history, oldest first. */
export function readLosses(oldestFirst: Snap[]): { losses: Loss[]; passOns: Loss[] } {
  const losses: Loss[] = [];
  const passOns: Loss[] = [];
  for (let i = 0; i + 1 < oldestFirst.length; i++) {
    const was = oldestFirst[i]!;
    const next = oldestFirst[i + 1]!;
    if (!REVIVABLE_STAGES.includes(was.status) || !was.owner || next.owner === was.owner) continue;
    let j = i;
    while (
      j > 0 &&
      oldestFirst[j - 1]?.status === was.status &&
      oldestFirst[j - 1]?.owner === was.owner
    )
      j -= 1;
    const event: Loss = {
      from: was.status,
      owner: was.owner,
      at: next.at,
      markedAt: oldestFirst[j]?.at ?? next.at,
      // Whoever the next save names as handing it over - blank when it was only unassigned.
      byName: next.owner ? (next.byName ?? null) : null,
    };
    if (j > 0 && oldestFirst[j - 1]?.status === was.status) passOns.push(event);
    else losses.push(event);
  }
  return { losses, passOns };
}

/** A Payload version document, reduced to what the rule needs. */
export function toSnap(v: {
  createdAt?: string;
  updatedAt?: string;
  version?: { status?: string; assignedTo?: unknown; assignedByName?: string | null };
}): Snap {
  const a = v.version?.assignedTo;
  const owner =
    a && typeof a === 'object'
      ? String((a as { id?: unknown }).id ?? '')
      : a == null
        ? ''
        : String(a);
  return {
    at: String(v.createdAt ?? v.updatedAt ?? ''),
    status: String(v.version?.status ?? ''),
    owner,
    byName: v.version?.assignedByName ?? null,
  };
}
