'use client';
import { useState } from 'react';
import type { RoutingView } from './lead-routing.js';

/**
 * The auto-assign card on the handler and admin dashboards.
 *
 * Turning this on hands each new lead to the next person on the list, in turn, so a
 * handler stops having to route every enquiry by hand. Off unless somebody turns it on:
 * nobody should find their pipeline being shared out by a setting they never chose.
 *
 * NOTHING SAVES UNTIL "DONE". The first version wrote on every click - flick the switch
 * and it was live, tick a name and it was live - which meant the moment between "on" and
 * "with people in it" was a real, saved state where the feature was running with an empty
 * rotation and quietly doing nothing. Staging the whole thing and committing it once
 * makes that unreachable: Done is disabled until at least one person is ticked.
 *
 * Writes straight to the global's REST endpoint rather than through a Payload form. The
 * whole point is that this is one switch and a set of names on a dashboard - sending
 * someone to a settings screen to change it would defeat it. Access is still the global's
 * own rule, checked on the server: this component cannot grant anybody anything, it only
 * saves what the API already allows.
 */

/**
 * Ids are held as strings here because that is what makes comparison and set membership
 * painless in the UI. They cannot be SENT as strings: the users collection has serial
 * (integer) ids, and Payload validates a relationship with `isValidID(value, 'number')`,
 * which rejects "190" outright - the save came back 400 with "invalid relationships: 190
 * 0, 192 1", naming the value and its index.
 */
const coerceId = (raw: string): string | number => (/^\d+$/.test(raw) ? Number(raw) : raw);

const Spinner = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="14 40"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="0.8s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

export function RoundRobin({
  enabled,
  memberIds,
  hiddenMemberIds,
  people,
  lastAssignedId,
  routed,
}: RoutingView) {
  /**
   * Members are always kept in the order they appear on screen, so the rotation and the
   * list are the same thing. Normalising on every change means the stored order can never
   * drift from what someone is looking at - which is how "who is next" stops being a
   * guess.
   */
  const inDisplayOrder = (ids: string[]): string[] =>
    people.filter((p) => ids.includes(String(p.id))).map((p) => String(p.id));

  const [saved, setSaved] = useState({ on: enabled, members: inDisplayOrder(memberIds) });
  const [draft, setDraft] = useState({ on: enabled, members: inDisplayOrder(memberIds) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const dirty = draft.on !== saved.on || draft.members.join(',') !== saved.members.join(',');
  // Turning it on with nobody ticked would be a saved state that does nothing at all.
  // Somebody this viewer cannot see still counts as somebody.
  const incomplete = draft.on && draft.members.length + hiddenMemberIds.length === 0;

  /** Who the next lead goes to, previewed live as the ticks change. */
  const rotation = people.filter((p) => draft.members.includes(String(p.id)));
  const lastIndex = rotation.findIndex((p) => String(p.id) === lastAssignedId);
  const nextUp = rotation.length > 0 ? rotation[(lastIndex + 1) % rotation.length] : null;

  const setOn = (next: boolean): void => {
    setError(null);
    setConfirmed(false);
    setDraft((d) => ({ ...d, on: next }));
  };

  const toggleMember = (id: string): void => {
    setError(null);
    setConfirmed(false);
    setDraft((d) => ({
      ...d,
      members: inDisplayOrder(
        d.members.includes(id) ? d.members.filter((m) => m !== id) : [...d.members, id],
      ),
    }));
  };

  const cancel = (): void => {
    setError(null);
    setConfirmed(false);
    setDraft({ on: saved.on, members: saved.members });
  };

  const commit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/globals/lead-routing', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoAssign: draft.on,
          // Hidden members ride along untouched. Saving only what is on screen would
          // remove whoever this viewer lacks permission to see.
          members: [...draft.members, ...hiddenMemberIds].map(coerceId),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSaved({ on: draft.on, members: draft.members });
      setConfirmed(true);
    } catch {
      // The draft is left exactly as it was so the work is not lost and Done can be
      // pressed again. A card that silently reverted would be worse than the error.
      setError('Could not save that. Check your connection and press Done again.');
    } finally {
      setSaving(false);
    }
  };

  const live = saved.on && saved.members.length > 0;

  return (
    <article className="mpm-card mpm-rr">
      <div className="mpm-card__head">
        <h3>
          <span className="mpm-card__ico" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </span>
          Share leads automatically
        </h3>

        <button
          type="button"
          role="switch"
          aria-checked={draft.on}
          aria-label="Share new leads automatically"
          className={`mpm-switch${draft.on ? ' is-on' : ''}`}
          disabled={saving}
          onClick={() => setOn(!draft.on)}
        >
          <span className="mpm-switch__knob" aria-hidden="true" />
        </button>
      </div>

      <p className="mpm-rr__lede">
        {draft.on
          ? 'Pick who shares the load. Each new lead goes to the next person in turn; one that already has an owner is left alone.'
          : live
            ? 'Currently on. Switch off and press Done to stop sharing leads out.'
            : 'Off. Every new lead arrives unassigned for you to route by hand.'}
      </p>

      {/* The list stays on screen either way so the card keeps its height and you can see
          who WOULD receive leads before committing. Readable when off, not operable. */}
      <div className={`mpm-rr__body${draft.on ? '' : ' is-off'}`}>
        <ul className="mpm-rr__list">
          {people.length === 0 && (
            <li className="mpm-empty">No salespeople yet. Add one before turning this on.</li>
          )}
          {people.map((p) => {
            const id = String(p.id);
            const picked = draft.members.includes(id);
            return (
              <li key={id}>
                <label className={`mpm-rr__row${picked ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={picked}
                    disabled={saving || !draft.on}
                    onChange={() => toggleMember(id)}
                  />
                  <span className="mpm-rr__name">{p.name}</span>
                  {draft.on && nextUp && String(nextUp.id) === id && (
                    <span className="mpm-rr__next">next</span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {incomplete && people.length > 0 && (
        <p className="mpm-rr__warn">Tick at least one person before pressing Done.</p>
      )}

      {hiddenMemberIds.length > 0 && (
        <p className="mpm-rr__note">
          {hiddenMemberIds.length === 1
            ? 'One more person is'
            : `${hiddenMemberIds.length} more people are`}{' '}
          in the rotation who you do not have permission to see here. They stay in it.
        </p>
      )}

      <div className="mpm-rr__foot">
        <span className="mpm-rr__status">
          {saving && (
            <span className="mpm-rr__saving">
              <Spinner /> Saving
            </span>
          )}
          {!saving && error && <span className="mpm-rr__error">{error}</span>}
          {!saving && !error && confirmed && (
            <span className="mpm-rr__ok">
              {saved.on ? 'Saved. New leads are being shared out.' : 'Saved. Sharing is off.'}
            </span>
          )}
          {!saving && !error && !confirmed && routed > 0 && (
            <span>
              {routed.toLocaleString('en-IN')} {routed === 1 ? 'lead' : 'leads'} shared out so far
            </span>
          )}
        </span>

        {dirty && (
          <span className="mpm-rr__actions">
            <button type="button" className="mpm-rr__cancel" onClick={cancel} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="mpm-rr__done"
              onClick={() => void commit()}
              disabled={saving || incomplete}
            >
              Done
            </button>
          </span>
        )}
      </div>
    </article>
  );
}
