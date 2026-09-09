'use client';

/**
 * The Lead "Status" select, with the routing stages hidden from salespeople.
 *
 * `new`, `assigned` and `reassigned` are not stages a salesperson moves a lead into —
 * they are set by the assignment hook when a handler routes work. Leaving them in the
 * dropdown meant a salesperson opening a reassigned lead saw "Reassigned" sitting in an
 * editable field and could set it by hand, which is meaningless coming from them and
 * quietly corrupts the pipeline.
 *
 * This only tidies the UI. The rule itself is enforced server-side in the Leads
 * collection, because a select the browser cannot show is still a value the REST API
 * will happily accept.
 */
import React from 'react';
import { useAuth, useField } from '@payloadcms/ui';

/** Must mirror the `status` options on the Leads collection. */
const ALL = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'reassigned', label: 'Reassigned' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'call-not-picked', label: 'Call not picked' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

/** Set by the assignment hook, never chosen by hand. */
const ROUTING = ['new', 'assigned', 'reassigned'];

export function LeadStatusSelect({ path }: { path: string }): React.JSX.Element {
  const { user } = useAuth();
  const { value, setValue } = useField<string>({ path });
  const isSales = (user as { role?: string } | null)?.role === 'sales';

  // A salesperson gets the working stages only — plus whatever the lead currently is,
  // so a reassigned lead still shows its own status rather than an empty box.
  const options = isSales
    ? ALL.filter((o) => !ROUTING.includes(o.value) || o.value === value)
    : ALL;

  const current = ALL.find((o) => o.value === value);

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={`field-${path}`}>
        Status <span className="required">*</span>
      </label>
      <select
        id={`field-${path}`}
        className="lead-status-select"
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
      >
        {!current && <option value="">Select a status</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isSales && current && ROUTING.includes(current.value) && (
        <p className="field-description">
          This lead is waiting on you. Move it to Contacted, Call not picked or Quoted once you have
          worked it.
        </p>
      )}
      <style>{`
        .lead-status-select{
          width:100%;
          padding:.55rem .7rem;
          border-radius:var(--style-radius-s,4px);
          border:1px solid var(--theme-elevation-150);
          background:var(--theme-input-bg,var(--theme-elevation-0));
          color:var(--theme-elevation-800);
          font-size:1rem;
          line-height:1.4;
        }
        .lead-status-select:focus{
          outline:none;
          border-color:var(--theme-success-500,#6D5AE6);
          box-shadow:0 0 0 1px var(--theme-success-500,#6D5AE6);
        }
      `}</style>
    </div>
  );
}
