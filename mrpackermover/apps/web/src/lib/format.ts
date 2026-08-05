/** Indian-locale formatting helpers. */

export function inr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function inrRange(from: number, to?: number): string {
  return to && to !== from ? `${inr(from)}–${inr(to)}` : `from ${inr(from)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
