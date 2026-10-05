'use client';
import { useDocumentInfo } from '@payloadcms/ui';
import { ReviewExplorer } from '../dashboard/ReviewExplorer.js';

/**
 * "Lead review" on a salesperson's page under Users: the same review the dashboards show,
 * fixed to this one person, with the same period choices (any dates included).
 *
 * A client component for the reason LeadTimeline gives: Payload renders a server `ui`
 * field once and never again, and this one has controls that redraw it.
 */
export function LeadReviewField(): React.JSX.Element | null {
  const { id } = useDocumentInfo();
  if (id == null) return null;
  return (
    <ReviewExplorer
      mode="person"
      personId={String(id)}
      title="Lead review"
      lede="How this salesperson's leads turned out. Pick any dates. Click a slice to open those leads."
      variant="plain"
    />
  );
}
