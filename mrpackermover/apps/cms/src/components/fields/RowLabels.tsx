'use client';
import { useRowLabel } from '@payloadcms/ui';

/**
 * Row labels for Services → "Service page": a section shows its heading and an FAQ its
 * question, instead of "Section 07" - with ten sections on a page, an editor looking for
 * "Documents" should not have to open each row to find it.
 */
const clip = (s: string, n = 80): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function SectionRowLabel(): React.JSX.Element {
  const { data, rowNumber } = useRowLabel<{ heading?: string }>();
  const n = String((rowNumber ?? 0) + 1).padStart(2, '0');
  const heading = data?.heading?.trim();
  return <span>{heading ? `${n} · ${clip(heading)}` : `${n} · Opening paragraphs`}</span>;
}

export function FaqRowLabel(): React.JSX.Element {
  const { data, rowNumber } = useRowLabel<{ question?: string }>();
  const n = String((rowNumber ?? 0) + 1).padStart(2, '0');
  const q = data?.question?.trim();
  return <span>{q ? `${n} · ${clip(q)}` : `Question ${n}`}</span>;
}

/** Locations → "Customer reviews": the customer's name and stars, e.g. "02 · Priya S. · 5★". */
export function ReviewRowLabel(): React.JSX.Element {
  const { data, rowNumber } = useRowLabel<{ name?: string; rating?: string }>();
  const n = String((rowNumber ?? 0) + 1).padStart(2, '0');
  const name = data?.name?.trim();
  return (
    <span>
      {name ? `${n} · ${clip(name, 40)}${data?.rating ? ` · ${data.rating}★` : ''}` : `Review ${n}`}
    </span>
  );
}
