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

/** A Payload doc arrives as untyped JSON; model it as unknown-valued rather than `any`. */
type Json = Record<string, unknown>;

const obj = (v: unknown): Json => (v !== null && typeof v === 'object' ? (v as Json) : {});
const rows = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
/** Mirrors the previous `value || fallback` semantics (falsy → fallback). */
const text = (v: unknown, fallback = ''): string => (v ? String(v) : fallback);

/** A caught value is `unknown`; render it the way `e?.message || e` used to. */
function errText(e: unknown): string {
  const message = e instanceof Error ? e.message : '';
  return message || String(e);
}

/** Map a saved Proposals doc → the PDF generator's data shape. */
function toPdfData(doc: Json): Json {
  const charges = rows(doc.charges).map((c) => ({ name: text(c.name), amt: num(c.amt) }));
  const sub = charges.reduce((s, c) => s + num(c.amt), 0);
  const p = obj(doc.pricing);
  const gstRate = num(p.gstRate);
  const gv = num(p.goodsValue);
  const insRate = num(p.insRate);
  const premium = Math.round((gv * insRate) / 100);
  const gst = Math.round((sub * gstRate) / 100);
  const grand = sub + gst + premium;
  const move = obj(doc.move);
  return {
    quoteNo: text(doc.quoteNo) || genQuoteNo(),
    company: obj(doc.company),
    customer: obj(doc.customer),
    move: { ...move, date: move.date ? String(move.date).slice(0, 10) : '' },
    items: rows(doc.inventory).map((it) => ({
      name: text(it.name),
      qty: num(it.qty),
      pack: text(it.pack, 'Standard Wrap'),
      rem: text(it.rem),
    })),
    charges,
    totals: { sub, gstRate, gst, gv, insRate, premium, grand },
    services: rows(doc.services)
      .map((s) => text(s.line))
      .filter(Boolean),
    terms: rows(doc.terms)
      .map((s) => text(s.line))
      .filter(Boolean),
    pay: text(p.pay),
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
        text(obj(data.company).name, 'MrPackerMover')
          .replace(/[^\w-]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-Proposal-' +
        text(data.quoteNo) +
        '.pdf';
      setFileName(name);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (e) {
      setError('Could not build the PDF: ' + errText(e));
    } finally {
      setBusy(false);
    }
  }, [id]);

  // Auto-build once the proposal is saved (has an id). `build` is itself keyed on `id`,
  // so listing it here is equivalent to the previous [id]-only dependency list.
  useEffect(() => {
    if (id) void build();
  }, [id, build]);

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
                style={{
                  ...btn,
                  background: 'var(--theme-elevation-100)',
                  color: 'var(--theme-text)',
                }}
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
