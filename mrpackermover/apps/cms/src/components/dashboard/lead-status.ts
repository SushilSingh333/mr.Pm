/**
 * The lead pipeline: one definition, shared by every dashboard.
 *
 * This lives in its own module rather than in Dashboard.tsx for two reasons.
 *
 * 1. Drift. The admin dashboard used to keep a private copy of this list. When
 *    `assigned` and `reassigned` were added to the Leads collection but not to that
 *    copy, an assigned lead fell through the lookup and rendered as "New", and the
 *    pipeline bars counted none of them, so the totals were quietly short.
 *
 * 2. Import cycles. Dashboard.tsx imports SalesDashboard.tsx, so SalesDashboard cannot
 *    read a constant from Dashboard at module-initialisation time — it crashes with
 *    "Cannot access 'LEAD_STATUS' before initialization". A leaf module both can import
 *    removes the cycle instead of tiptoeing around it.
 *
 * The values here MUST match the `status` field options on the Leads collection.
 * `verify-roles` asserts that, so the two cannot silently diverge again.
 */
export interface LeadStage {
  value: string;
  label: string;
  color: string;
}

export const LEAD_STATUS: LeadStage[] = [
  { value: 'new', label: 'New', color: '#8a8f98' },
  { value: 'assigned', label: 'Assigned', color: '#6D5AE6' },
  { value: 'reassigned', label: 'Reassigned', color: '#8b6df0' },
  { value: 'contacted', label: 'Contacted', color: '#2f6df6' },
  { value: 'call-not-picked', label: 'Call not picked', color: '#d16a5a' },
  { value: 'quoted', label: 'Quoted', color: '#c98a00' },
  { value: 'won', label: 'Won', color: '#1a9d5a' },
  { value: 'lost', label: 'Lost', color: '#8a8f98' },
  { value: 'invalid', label: 'Invalid lead', color: '#b23c17' },
];

/**
 * Stages that mean the lead is finished with, in one place.
 *
 * Three dashboard queries used to spell `['won', 'lost']` inline to mean "still open".
 * Adding "Invalid lead" without touching them would have left every wrong number and
 * spam entry sitting in somebody's open workload for good - counted on their dashboard,
 * counted in the per-salesperson load a handler reads before distributing work. A stage
 * added here now leaves the open queues by itself.
 *
 * Deliberately NOT the same set as the win-rate denominator. Win rate is won against
 * decided, and an invalid lead was never an opportunity anyone could have won - folding
 * it in would push the number down for reasons that have nothing to do with selling.
 */
export const CLOSED_STAGES = ['won', 'lost', 'invalid'];

/**
 * Look up a stage for display. An unrecognised value shows itself rather than being
 * silently relabelled as the first entry, so a future mismatch is visible on screen
 * instead of masquerading as a real status.
 */
export const statusMeta = (v?: string): { label: string; color: string } =>
  LEAD_STATUS.find((s) => s.value === v) ?? { label: v ?? 'Unknown', color: '#8a8f98' };

/** A relationship arrives as an id until populated; show a name only when we have one. */
export const ownerName = (
  v: { name?: string; email?: string } | string | number | null | undefined,
): string => (v && typeof v === 'object' ? (v.name ?? v.email ?? '') : '');

/**
 * The exact moment, for the tooltip behind a relative time. "6m ago" is what you scan;
 * the precise stamp is what you need when a customer asks who called and when.
 */
export const exactTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
