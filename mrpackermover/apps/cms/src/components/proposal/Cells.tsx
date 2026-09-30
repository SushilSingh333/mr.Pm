'use client';
import Link from 'next/link';
import { money, personCase } from '../dashboard/lead-status.js';
import { useBrowserClock } from '../../lib/use-browser-clock.js';

/**
 * The Proposals list, in the language of the business rather than of the database.
 *
 * Left to Payload's defaults the list read like a developer's table: "<No Customer>" and
 * "<No Route>" - the field name in angle brackets - wherever a value was missing, a bare
 * `55000` for the price, a Google Places string wide enough to wrap onto two lines, and
 * the customer's name printed twice on every row because it is baked into the title.
 *
 * These are the same four fixes the Leads list already carries, and they are cells rather
 * than data changes: the stored values stay exactly as they are, so the PDF, the API and
 * the proposal form are untouched.
 */

/**
 * The quote number, alone - AND the link into the document.
 *
 * `title` is built as "CUSTOMER · MPM-2026…", and Customer is the very next column, so
 * every row said the name twice while the number that identifies the document wrapped
 * onto a second line. The number leads; the name is where it belongs.
 *
 * THE LINK IS NOT OPTIONAL HERE. Payload wraps the first column in a Link from inside
 * its own `DefaultCell`; supplying `admin.components.Cell` REPLACES that component, so a
 * custom cell that renders a bare span silently turns the whole list into dead text -
 * which is exactly what happened. Every first-column cell in this codebase must render
 * its own anchor.
 */
export function QuoteNoCell({
  cellData,
  rowData,
  collectionSlug,
  linkURL,
}: CellLinkProps): React.JSX.Element {
  const text = typeof cellData === 'string' ? cellData : '';
  const quoteNo = text.includes('·') ? text.split('·').pop()?.trim() : text;
  return (
    <CellLink rowData={rowData} collectionSlug={collectionSlug} linkURL={linkURL}>
      <span className="mpm-cellq">{quoteNo || 'Untitled'}</span>
    </CellLink>
  );
}

/** The props Payload hands a cell that needs to link to its own document. */
export interface CellLinkProps {
  cellData?: unknown;
  rowData?: { id?: number | string };
  collectionSlug?: string;
  linkURL?: string;
}

/**
 * The document link, built the way Payload builds it: prefer the `linkURL` it supplies,
 * fall back to the collection and row id. Renders the children unwrapped when there is no
 * id to point at - an unsaved row in a drawer, for instance - rather than an anchor to
 * nowhere.
 */
export function CellLink({
  rowData,
  collectionSlug,
  linkURL,
  children,
}: CellLinkProps & { children: React.ReactNode }): React.JSX.Element {
  const href =
    linkURL ??
    (rowData?.id != null && collectionSlug
      ? `/admin/collections/${collectionSlug}/${String(rowData.id)}`
      : undefined);
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="mpm-cell-link" prefetch={false}>
      {children}
    </Link>
  );
}

/** The customer. An unnamed draft says so in words rather than in angle brackets. */
export function ClientCell({ cellData }: { cellData?: unknown }): React.JSX.Element {
  const text = typeof cellData === 'string' ? cellData.trim() : '';
  if (!text) return <span className="mpm-cell-empty">Not named yet</span>;
  return <span>{personCase(text)}</span>;
}

/**
 * The route, as two city names.
 *
 * Stored as whatever Google Places returned - "Noida, Uttar Pradesh, India → Lucknow,
 * Uttar Pradesh, India" - which is three quarters identical on every row and wrapped onto
 * two lines. The full string stays in the tooltip for the one time a month somebody needs
 * the district.
 */
export function RouteCell({ cellData }: { cellData?: unknown }): React.JSX.Element {
  const text = typeof cellData === 'string' ? cellData.trim() : '';
  if (!text) return <span className="mpm-cell-empty">Route not set</span>;
  const short = text
    .split('→')
    .map((part) => part.split(',')[0]?.trim() ?? '')
    .filter(Boolean)
    .join(' → ');
  return <span title={text}>{short || text}</span>;
}

/** Rupees, not a bare integer. Right-aligned figures line up when they are tabular. */
export function AmountCell({ cellData }: { cellData?: unknown }): React.JSX.Element {
  const n = Number(cellData);
  if (!Number.isFinite(n) || n <= 0) return <span className="mpm-cell-empty">—</span>;
  return (
    <span className="mpm-cell-money" title={`₹${Math.round(n).toLocaleString('en-IN')}`}>
      {money(n)}
    </span>
  );
}

/** The four proposal states, in the dashboard's soft-pill language. */
const STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'var(--mpm-ink-3,#737E93)' },
  sent: { label: 'Sent', color: 'var(--mpm-v-500,#2558E6)' },
  accepted: { label: 'Accepted', color: 'var(--mpm-ok,#0E7C4A)' },
  lost: { label: 'Lost', color: 'var(--mpm-danger,#B42318)' },
};

export function ProposalStatusCell({ cellData }: { cellData?: unknown }): React.JSX.Element {
  const key = typeof cellData === 'string' ? cellData : 'draft';
  const meta = STATUS[key] ?? { label: key, color: 'var(--mpm-ink-3,#737E93)' };
  return (
    <span className="mpm-cell-pill" style={{ ['--c' as string]: meta.color }}>
      {meta.label}
    </span>
  );
}

/**
 * When it last moved. "September 12th 2026, 2:19 PM" is twenty-eight characters answering
 * a question nobody asks while scanning; the short form is what a person would say, and
 * the full stamp stays in the tooltip.
 */
export function WhenCell({ cellData }: { cellData?: unknown }): React.JSX.Element | null {
  useBrowserClock();
  if (typeof cellData !== 'string' || !cellData) return null;
  const d = new Date(cellData);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  const label = sameDay
    ? `Today, ${time}`
    : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
  return (
    <span
      className="mpm-cell-when"
      title={d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      suppressHydrationWarning
    >
      {label}
    </span>
  );
}
