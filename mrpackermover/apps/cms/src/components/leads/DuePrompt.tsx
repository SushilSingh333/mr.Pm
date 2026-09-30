'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { duePrompt } from '../dashboard/lead-status.js';

/**
 * The question a promised lead asks on the day it comes due.
 *
 * The board already knows a move was booked for today; making somebody open the lead,
 * find the status select, choose "Won", and press Save is four actions to record an
 * answer they already have in their head. This is that answer as one press, in the row.
 *
 * WHY IT IS NOT A FORM. A lead row is inside the board's own markup, not inside a Payload
 * document form, so there is no form state to set and no Save to press. It PATCHes the
 * REST endpoint directly and then asks Next to re-render the server component, which is
 * what refreshes every count on the page at once - the stage pills, the due strip and the
 * card all move together, because they are all recomputed from the same query.
 *
 * The collection's own hooks do the rest: moving the stage writes the timeline entry, a
 * move answered Won or Lost keeps its date (so it stays on its day in the calendar), and
 * an answered callback loses its date. Nothing about "what happened" is recorded here,
 * because recording it here would be a second place for it to be recorded differently.
 */
export function DuePrompt({
  id,
  status,
}: {
  id: string | number;
  status?: string;
}): React.JSX.Element {
  const router = useRouter();
  const prompt = duePrompt(status);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const answer = async (next: string, snoozeDays?: number): Promise<void> => {
    setBusy(next);
    setFailed(false);
    try {
      const body: Record<string, unknown> = snoozeDays ? {} : { status: next };
      if (snoozeDays) {
        // Same time of day, a day or three later: a callback pushed to "tomorrow" means
        // tomorrow morning if that is when it was promised, not tomorrow at whatever
        // o'clock the button happened to be pressed.
        const when = new Date();
        when.setDate(when.getDate() + snoozeDays);
        body.dueAt = when.toISOString();
      }
      const res = await fetch(`/api/leads/${String(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      // The row stays exactly as it was, so the answer can be given again. A prompt that
      // silently reverted would be worse than one that says it failed.
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mpm-duep">
      <span className="mpm-duep__q">{prompt.question}</span>
      <span className="mpm-duep__btns">
        <button
          type="button"
          className="mpm-duep__btn mpm-duep__btn--yes"
          disabled={busy !== null}
          onClick={() => void answer(prompt.yes.status)}
        >
          {busy === prompt.yes.status ? '…' : prompt.yes.label}
        </button>
        {prompt.no && (
          <button
            type="button"
            className="mpm-duep__btn mpm-duep__btn--no"
            disabled={busy !== null}
            onClick={() => void answer(prompt.no!.status)}
          >
            {busy === prompt.no.status ? '…' : prompt.no.label}
          </button>
        )}
        {/* Neither yes nor no: the commonest real answer is "not yet". Without it the
            only way to keep a promise alive is to lie about it with one of the other two
            buttons, and a board people lie to stops being worth reading. */}
        <button
          type="button"
          className="mpm-duep__btn mpm-duep__btn--snooze"
          disabled={busy !== null}
          title="Push this to tomorrow, same time"
          onClick={() => void answer('', 1)}
        >
          {busy === '' ? '…' : 'Tomorrow'}
        </button>
      </span>
      {failed && <span className="mpm-duep__err">Did not save — try again</span>}
    </div>
  );
}
