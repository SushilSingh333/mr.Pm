'use client';
import { useEffect, useState } from 'react';
import { useAllFormFields, useAuth, useDocumentInfo } from '@payloadcms/ui';
// Not re-exported by @payloadcms/ui in 3.87 - it lives on the core package's shared
// entry, which is the browser-safe one (payload/shared, not payload).
import { reduceFieldsToValues } from 'payload/shared';
import {
  KIND_META,
  buildTimeline,
  noteRows,
  stampFor,
  type TimelineKind,
  type TimelineLead,
  type TimelineProposal,
  type TimelineRow,
} from './lead-timeline.js';

/**
 * "What has happened" — the lead's own history, under the notes.
 *
 * A `ui` field on the Leads collection, rendered inside Payload's own document form, so
 * the save bar, validation, access rules and the Versions tab are all untouched. It reads
 * the lead out of LIVE FORM STATE rather than the saved document, which is what makes a
 * new note appear the instant it is added instead of after a round trip.
 *
 * WHY THIS IS A CLIENT COMPONENT, and why every future card on this page must be:
 * Payload renders a server `ui` field exactly once. `renderField.js` guards re-rendering
 * with `requiresRender = renderAllFields || !lastRenderedPath || lastRenderedPath !== path
 * || hasBeforeOrAfterInput`, and stamps `lastRenderedPath` on the way out — so a server
 * component here would show the timeline as it was when the page loaded and never move
 * again, which is the worst possible failure for a widget whose whole job is "what just
 * happened".
 *
 * THE COMPOSER APPENDS, IT DOES NOT REPLACE. It pushes one row onto the `noteLog` array
 * in form state and submits the form; the collection's existing hook stamps author and
 * time. It must never write the array wholesale: @payloadcms/drizzle deletes every child
 * row of an array present in a write and re-inserts only what was supplied, so sending a
 * one-element array would silently delete every earlier note on the lead.
 */

const ICONS: Record<string, React.JSX.Element> = {
  note: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5.5h16M4 12h16M4 18.5h10" />
    </svg>
  ),
  phone: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.8 2Z" />
    </svg>
  ),
  missed: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  doc: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
    </svg>
  ),
  rupee: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 5h10M7 9.5h10M15.5 5c0 3.5-2.6 4.5-5.5 4.5H7l7.5 9.5" />
    </svg>
  ),
  stage: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h10M12 7l5 5-5 5" />
    </svg>
  ),
  handover: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-2.8 2.5-4.5 5.5-4.5M16 9l3 3-3 3" />
    </svg>
  ),
  plus: (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
};

/** Rows shown before the rest go behind a disclosure. A lead can gather hundreds. */
const VISIBLE = 12;

export function LeadTimeline(): React.JSX.Element | null {
  const { id, savedDocumentData } = useDocumentInfo();
  const { user } = useAuth();
  const [fields] = useAllFormFields();
  const [proposals, setProposals] = useState<TimelineProposal[]>([]);
  const [populated, setPopulated] = useState<TimelineLead | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Two sources, each for what it is actually good at.
   *
   * Form state has the notes AS THEY STAND, unsaved rows included, which is what makes a
   * new note appear the moment it is added. What it does not have is populated
   * relationships: `assignedTo` there is the bare id `33`, so a row built from it can
   * only say "Given an owner". The saved document carries the same field resolved to
   * `{ id: 33, name: 'Preeti Sharma' }`.
   *
   * So: relationships and arrival facts from the saved document, notes from the form.
   */
  const saved = (populated ?? savedDocumentData ?? {}) as TimelineLead;
  const live = reduceFieldsToValues(fields, true) as TimelineLead;
  const lead: TimelineLead = {
    ...live,
    ...saved,
    // Notes come from the SAVED document. A row sitting in form state has not been
    // written yet, and showing it as history would tell somebody their note is recorded
    // when a refresh would lose it. The composer refreshes this on every successful add,
    // so a real note still appears immediately.
    noteLog: saved.noteLog ?? live.noteLog,
  };
  const noteCount = noteRows(lead.noteLog).length;

  /**
   * Two reads, both access-checked by the API.
   *
   * Proposals live in another collection. The lead is read again at depth 1 purely to
   * resolve `assignedTo` to a person: the form and `savedDocumentData` both carry the
   * bare id, so without this the hand-over line can only say "Given an owner". Where the
   * viewer may not read the staff directory - a salesperson - Payload returns the id
   * rather than failing, and the row falls back to the generic wording by itself.
   *
   * Keyed on the note count as well as the id: raising a proposal moves the lead to
   * Quoted and writes a note, so a changing note count is the cheapest honest signal that
   * the other two may have moved too.
   */
  useEffect(() => {
    if (!id) return;
    let live = true;
    const q = encodeURIComponent(String(id));
    void (async () => {
      try {
        const [pRes, lRes] = await Promise.all([
          fetch(`/api/proposals?where[lead][equals]=${q}&limit=50&depth=0&sort=-createdAt`, {
            credentials: 'same-origin',
          }),
          fetch(`/api/leads/${q}?depth=1`, { credentials: 'same-origin' }),
        ]);
        if (live && pRes.ok) {
          const body = (await pRes.json()) as { docs?: TimelineProposal[] };
          setProposals(body.docs ?? []);
        }
        if (live && lRes.ok) setPopulated((await lRes.json()) as TimelineLead);
      } catch {
        /* The timeline is still worth showing without either of them. */
      }
    })();
    return () => {
      live = false;
    };
  }, [id, noteCount]);

  // A lead that has never been saved has no history and no id to hang one on.
  if (!id) return null;

  const rows = buildTimeline(lead, proposals);
  const head = rows.slice(0, VISIBLE);
  const tail = rows.slice(VISIBLE);

  /**
   * Adding a note writes straight to the REST endpoint, not through the form.
   *
   * `useForm().addFieldRow` looked like the obvious route and quietly does not work here.
   * Its own source says why: "dispatch ADD_ROW adds a blank row to local form state. This
   * performs no form state request, as the debounced onChange effect will do that for
   * us." The row is BLANK until that debounce lands, so calling submit() in the same
   * breath sends a save with no note in it - which is exactly what happened: the PATCH
   * returned 200 and the note existed only on screen. A note that looks saved and is not
   * is the worst outcome available here.
   *
   * So the write is explicit, the way RoundRobin already writes this codebase's other
   * out-of-form control. The whole array is sent, current rows included, because
   * @payloadcms/drizzle deletes every child row of an array present in a write before
   * re-inserting what was supplied - send one row and the lead's history is gone. Author
   * and time are left off the new row on purpose: the collection's hook stamps any row
   * that arrives without them, so there is one place that decides who wrote what.
   */
  const add = async (): Promise<void> => {
    const body = draft.trim();
    if (!body || saving || !id) return;
    setSaving(true);
    setError(null);
    try {
      const rows = noteRows(saved.noteLog).map((n) => ({
        body: n.body,
        kind: n.kind ?? 'note',
        amount: n.amount ?? null,
        // Depth 1 populates the author; the API wants the id back.
        author:
          n.author && typeof n.author === 'object' ? (n.author as { id?: unknown }).id : n.author,
        authorName: n.authorName ?? null,
        at: n.at ?? null,
      }));
      const res = await fetch(`/api/leads/${encodeURIComponent(String(id))}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ noteLog: [...rows, { body, kind: 'note' }] }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const updated = (await res.json()) as { doc?: TimelineLead };
      // Re-read at depth 1 so the new row arrives stamped and the owner stays named.
      const fresh = await fetch(`/api/leads/${encodeURIComponent(String(id))}?depth=1`, {
        credentials: 'same-origin',
      });
      setPopulated(fresh.ok ? ((await fresh.json()) as TimelineLead) : (updated.doc ?? null));
      setDraft('');
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ row }: { row: TimelineRow }): React.JSX.Element => {
    const meta = KIND_META[row.kind as TimelineKind] ?? KIND_META.note;
    return (
      <li className="mpm-tl__row">
        <span className="mpm-tl__ico" style={{ ['--c' as string]: meta.color }} aria-hidden="true">
          {ICONS[meta.icon] ?? ICONS.note}
        </span>
        <span className="mpm-tl__body">
          <span className="mpm-tl__title">{row.title}</span>
          {row.detail && <span className="mpm-tl__detail">{row.detail}</span>}
          {row.link && (
            <a className="mpm-tl__link" href={row.link.href}>
              {row.link.label}
            </a>
          )}
          <span className="mpm-tl__stamp">{stampFor(row)}</span>
        </span>
      </li>
    );
  };

  return (
    <div className="mpm-lead-tl">
      <style>{TIMELINE_CSS}</style>
      <h3 className="mpm-tl__head">What has happened</h3>

      <div className="mpm-tl__compose">
        <input
          className="mpm-tl__input"
          value={draft}
          disabled={saving}
          placeholder="Add a note, e.g. customer will confirm by Friday"
          aria-label="Add a note"
          onChange={(e) => setDraft(e.target.value)}
          // Enter sends it. This is a one-line thought typed between calls, not an essay.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void add();
            }
          }}
        />
        <button
          type="button"
          className="mpm-tl__add"
          disabled={saving || !draft.trim()}
          onClick={() => void add()}
        >
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
      {error && <p className="mpm-tl__error">{error}</p>}
      {!user && <p className="mpm-tl__stamp">Sign in to add a note.</p>}

      {rows.length === 0 ? (
        <p className="mpm-tl__empty">
          Nothing yet. The first call, the first quote and every note will show up here.
        </p>
      ) : (
        <>
          <ul className="mpm-tl__list">
            {head.map((r) => (
              <Row key={r.id} row={r} />
            ))}
          </ul>
          {tail.length > 0 && (
            <details className="mpm-tl__more">
              <summary>
                {tail.length} earlier {tail.length === 1 ? 'entry' : 'entries'}
              </summary>
              <ul className="mpm-tl__list">
                {tail.map((r) => (
                  <Row key={r.id} row={r} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Scoped to `.mpm-lead-tl`.
 *
 * The dashboard's tokens are declared on `.mpm-dash` and do not reach this page, so the
 * few that are needed are read straight from the admin theme's `--mpm-*` variables, which
 * are global and already handle light and dark. Nothing here invents a colour.
 */
const TIMELINE_CSS = `
.mpm-lead-tl{
  --tl-ink:var(--mpm-ink,var(--theme-elevation-1000));
  --tl-ink-2:var(--mpm-ink-2,var(--theme-elevation-600));
  --tl-ink-3:var(--mpm-ink-3,var(--theme-elevation-500));
  --tl-line:var(--mpm-line,var(--theme-elevation-100));
  --tl-paper:var(--mpm-paper,var(--theme-elevation-0));
  --tl-violet:var(--mpm-v-500,#2558E6);
  margin:24px 0 0;padding:20px;border:1px solid var(--tl-line);
  border-radius:20px;background:var(--tl-paper);
  box-shadow:0 1px 2px color-mix(in srgb,var(--mpm-shadow,rgba(15,21,35,.13)) 45%,transparent),
             0 12px 26px -18px var(--mpm-shadow,rgba(15,21,35,.13));
}
.mpm-tl__head{margin:0 0 14px;font-size:18px;font-weight:700;
  letter-spacing:-.015em;color:var(--tl-ink)}

.mpm-tl__compose{display:flex;gap:8px;align-items:stretch;margin:0 0 16px}
.mpm-tl__input{flex:1;min-width:0;min-height:40px;padding:0 16px;
  border:1px solid var(--tl-line);border-radius:999px;
  background:var(--mpm-tint,var(--tl-paper));color:var(--tl-ink);
  font-size:14px;font-family:inherit}
.mpm-tl__input:focus{outline:none;border-color:var(--tl-violet)}
.mpm-tl__input::placeholder{color:var(--tl-ink-3)}
.mpm-tl__add{flex:none;min-height:40px;padding:0 22px;border:0;border-radius:999px;
  background:var(--mpm-grad,linear-gradient(140deg,#4C6FFF,#1E3ED4));color:#fff;
  font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;
  box-shadow:0 1px 2px rgba(15,21,35,.10),
             0 10px 20px -12px color-mix(in srgb,var(--tl-violet) 80%,transparent);
  transition:filter .12s ease,transform .12s ease}
.mpm-tl__add:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px)}
.mpm-tl__add:disabled{opacity:.45;cursor:not-allowed}
.mpm-tl__add:focus-visible,.mpm-tl__input:focus-visible{outline:2px solid var(--tl-violet);outline-offset:2px}
.mpm-tl__error{margin:0 0 12px;font-size:12px;color:var(--mpm-ember-ink,#C63F00)}

.mpm-tl__list{list-style:none;margin:0;padding:0}
/* The connecting line is drawn by the row, not by a wrapper, so it stops cleanly at the
   last entry instead of running into the padding. */
.mpm-tl__row{position:relative;display:flex;gap:11px;padding:0 0 16px}
.mpm-tl__row:last-child{padding-bottom:0}
.mpm-tl__row::before{content:"";position:absolute;left:13px;top:28px;bottom:0;
  width:1px;background:var(--tl-line)}
.mpm-tl__row:last-child::before{display:none}
.mpm-tl__ico{flex:none;display:grid;place-items:center;width:27px;height:27px;
  border-radius:50%;color:var(--c);
  background:color-mix(in srgb,var(--c) 14%,transparent);
  border:1px solid color-mix(in srgb,var(--c) 30%,transparent)}
.mpm-tl__body{display:flex;flex-direction:column;gap:2px;min-width:0;padding-top:3px}
.mpm-tl__title{font-size:14px;font-weight:600;color:var(--tl-ink);line-height:1.35}
.mpm-tl__detail{font-size:13px;color:var(--tl-ink-2);line-height:1.45}
.mpm-tl__link{align-self:flex-start;font-size:13px;font-weight:600;
  color:var(--tl-violet);text-decoration:none}
.mpm-tl__link:hover{text-decoration:underline}
.mpm-tl__stamp{font-size:12px;color:var(--tl-ink-3)}
.mpm-tl__empty{margin:8px 0 0;font-size:13px;color:var(--tl-ink-3)}

.mpm-tl__more{margin-top:14px;padding-top:14px;border-top:1px solid var(--tl-line)}
.mpm-tl__more>summary{cursor:pointer;font-size:13px;font-weight:600;
  color:var(--tl-violet);list-style:none}
.mpm-tl__more>summary::-webkit-details-marker{display:none}
.mpm-tl__more>summary:focus-visible{outline:2px solid var(--tl-violet);outline-offset:2px}
.mpm-tl__more[open]>summary{margin-bottom:14px}

@media (max-width:640px){
  .mpm-lead-tl{padding:16px}
  .mpm-tl__compose{flex-wrap:wrap}
  .mpm-tl__input{flex:1 1 100%}
  .mpm-tl__add{flex:1 1 100%}
}
`;
