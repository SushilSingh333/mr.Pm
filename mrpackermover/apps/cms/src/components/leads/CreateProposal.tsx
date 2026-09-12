'use client';
import { useEffect, useState } from 'react';
import { Button, useAuth, useDocumentInfo } from '@payloadcms/ui';

/**
 * `ui` field in the Leads sidebar: opens a new proposal already pointed at this lead,
 * and shows the proposals that already exist for it.
 *
 * Without it, quoting a lead meant leaving the lead, opening Proposals, creating one,
 * then hunting for the right customer in a picker that lists every lead by name - easy
 * to pick the wrong Sharma. The lead is where you decide to quote, so the action
 * belongs there.
 *
 * The link carries only the id. The proposal form's LeadAutofill reads `?lead=` and
 * fills the customer and move details from the lead itself, so that copying logic lives
 * in one place rather than two that drift.
 *
 * Listing existing proposals matters as much as the button: with only a "create" action,
 * a second salesperson opening the lead had no way to see one had already been sent, and
 * the customer got two different numbers from the same company.
 */

/** Who may create a proposal at all - mirrors `proposalsWrite` in access/index.ts. */
const CAN_QUOTE = ['admin', 'handler', 'sales'];

type Existing = { id: string | number; quoteNo?: string | null; status?: string | null };

export function CreateProposal(): React.JSX.Element | null {
  const { id } = useDocumentInfo();
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role;
  const [existing, setExisting] = useState<Existing[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/proposals?where[lead][equals]=${encodeURIComponent(String(id))}` +
            '&limit=10&depth=0&sort=-createdAt',
          { credentials: 'same-origin' },
        );
        if (!res.ok) return;
        const body = (await res.json()) as { docs?: Existing[] };
        if (live) setExisting(body.docs ?? []);
      } catch {
        /* the button still works without this; a failed lookup should not block it */
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  // An unsaved lead has no id to point at, and editor/ops accounts cannot create a
  // proposal - showing them a button that fails on submit is worse than hiding it.
  if (!id || !role || !CAN_QUOTE.includes(role)) return null;

  const has = (existing?.length ?? 0) > 0;

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {has && (
        <div
          style={{
            marginBottom: '.6rem',
            padding: '.55rem .7rem',
            borderRadius: 6,
            // Reads as "already quoted" at a glance, before the button is even noticed.
            border: '1px solid color-mix(in srgb, #12a150 40%, transparent)',
            background: 'color-mix(in srgb, #12a150 10%, transparent)',
            fontSize: '.78rem',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ display: 'block', marginBottom: '.3rem' }}>
            {existing!.length === 1 ? 'Proposal sent' : `${existing!.length} proposals sent`}
          </strong>
          {existing!.map((p) => (
            <a
              key={String(p.id)}
              href={`/admin/collections/proposals/${p.id}`}
              style={{ display: 'block', textDecoration: 'none' }}
            >
              {p.quoteNo || `#${p.id}`}
              {p.status ? ` · ${p.status}` : ''}
            </a>
          ))}
        </div>
      )}
      <Button
        el="anchor"
        url={`/admin/collections/proposals/create?lead=${encodeURIComponent(String(id))}`}
        buttonStyle={has ? 'secondary' : 'primary'}
        size="medium"
        icon={['plus']}
        iconPosition="left"
      >
        {has ? 'Create another proposal' : 'Create proposal'}
      </Button>
    </div>
  );
}
