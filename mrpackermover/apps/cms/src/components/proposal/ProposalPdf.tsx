'use client';
import { useCallback, useEffect, useState } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';
import { genProposalPDF } from './proposal-pdf';

/**
 * `ui` field on the Proposals collection — the in-form "Preview & Download" panel. After you
 * Create/Save a proposal, this reads the saved record, builds the SAME 2-page A4 vector PDF as
 * the studio (via ./proposal-pdf, ported verbatim), and shows it inline with Download + Print.
 * Reading the saved doc (not live form state) keeps it robust across Payload versions.
 */

const num = (v: unknown): number => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

function genQuoteNo(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return (
    'MPM-' +
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    '-' +
    p(((d.getHours() * 60 + d.getMinutes()) % 99) + 1)
  );
}

/** Map a saved Proposals doc → the PDF generator's data shape. */
function toPdfData(doc: Record<string, any>): Record<string, any> {
  const charges = (doc.charges || []).map((c: any) => ({ name: c?.name || '', amt: num(c?.amt) }));
  const sub = charges.reduce((s: number, c: any) => s + num(c.amt), 0);
  const p = doc.pricing || {};
  const gstRate = num(p.gstRate);
  const gv = num(p.goodsValue);
  const insRate = num(p.insRate);
  const premium = Math.round((gv * insRate) / 100);
  const gst = Math.round((sub * gstRate) / 100);
  const grand = sub + gst + premium;
  const move = doc.move || {};
  return {
    quoteNo: doc.quoteNo || genQuoteNo(),
    company: doc.company || {},
    customer: doc.customer || {},
    move: { ...move, date: move.date ? String(move.date).slice(0, 10) : '' },
    items: (doc.inventory || []).map((it: any) => ({
      name: it?.name || '',
      qty: num(it?.qty),
      pack: it?.pack || 'Standard Wrap',
      rem: it?.rem || '',
    })),
    charges,
    totals: { sub, gstRate, gst, gv, insRate, premium, grand },
    services: (doc.services || []).map((s: any) => s?.line).filter(Boolean),
    terms: (doc.terms || []).map((s: any) => s?.line).filter(Boolean),
    pay: p.pay || '',
    validDays: num(p.validDays) || 15,
  };
}

const V = '#5A46D6';
const btn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '.88rem',
  padding: '.55rem 1rem',
  borderRadius: 10,
  border: 'none',
};

export function ProposalPdf(): React.JSX.Element {
  const { id } = useDocumentInfo();
  const [url, setUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('proposal.pdf');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const build = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${id}?depth=0`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = await res.json();
      const data = toPdfData(doc);
      const blob = genProposalPDF(data);
      const name =
        (data.company?.name || 'MrPackerMover').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') +
        '-Proposal-' +
        data.quoteNo +
        '.pdf';
      setFileName(name);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (e: any) {
      setError('Could not build the PDF: ' + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }, [id]);

  // Auto-build once the proposal is saved (has an id).
  useEffect(() => {
    if (id) void build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) {
    return (
      <div
        style={{
          padding: '1rem 1.2rem',
          borderRadius: 12,
          border: '1px dashed var(--theme-elevation-200)',
          color: 'var(--theme-elevation-600)',
          fontSize: '.9rem',
        }}
      >
        Fill in the details, then click <b>Create</b> (top-right) to save the proposal. The live
        preview and <b>Download PDF</b> button will appear here.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => void build()}
          disabled={busy}
          style={{ ...btn, background: 'var(--theme-elevation-100)', color: 'var(--theme-text)' }}
        >
          {busy ? 'Building…' : '↻ Refresh preview'}
        </button>
        {url && (
          <>
            <a href={url} download={fileName} style={{ textDecoration: 'none' }}>
              <span
                style={{
                  ...btn,
                  color: '#fff',
                  background: `linear-gradient(140deg,#8B7CF0,${V})`,
                  boxShadow: '0 6px 16px rgba(90,70,214,.35)',
                }}
              >
                ↓ Download PDF
              </span>
            </a>
            <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <span
                style={{ ...btn, background: 'var(--theme-elevation-100)', color: 'var(--theme-text)' }}
              >
                ⧉ Open / Print
              </span>
            </a>
          </>
        )}
      </div>

      {error && <div style={{ color: 'var(--theme-error-500)', marginBottom: 10 }}>{error}</div>}

      {url ? (
        <iframe
          title="Proposal PDF preview"
          src={url}
          style={{
            width: '100%',
            height: 900,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 8,
            background: 'var(--theme-elevation-50)',
          }}
        />
      ) : (
        !error && <div style={{ color: 'var(--theme-elevation-500)' }}>Building preview…</div>
      )}
    </div>
  );
}
