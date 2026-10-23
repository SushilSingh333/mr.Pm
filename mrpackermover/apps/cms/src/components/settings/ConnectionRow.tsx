'use client';
import { useEffect, useState } from 'react';
import { useFormFields, useRowLabel } from '@payloadcms/ui';

/**
 * One Integrations connection (Settings → Integrations → Connections): its row label,
 * and the panel inside the row - the link to give the tool, copy buttons, and how many
 * leads it has actually sent.
 *
 * The count is read from the leads themselves (`webhookConnection`), not from a counter
 * the webhook keeps on the settings, so it is right even after an edit here, and the
 * webhook never has to write to this screen while someone is using it.
 */

/** "01 · Facebook - Delhi form", with "(off)" when it is switched off. */
export function ConnectionRowLabel(): React.JSX.Element {
  const { data, rowNumber } = useRowLabel<{ name?: string; enabled?: boolean }>();
  const n = String((rowNumber ?? 0) + 1).padStart(2, '0');
  const name = data?.name?.trim() || 'New connection';
  return (
    <span>
      {n} · {name}
      {data?.enabled === false ? ' (off)' : ''}
    </span>
  );
}

const ago = (iso: string): string => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const code: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: '.78rem',
  wordBreak: 'break-all',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: 4,
  padding: '.4rem .55rem',
  margin: '.3rem 0 .4rem',
};
const btn: React.CSSProperties = {
  cursor: 'pointer',
  border: '1px solid var(--theme-elevation-150)',
  background: 'transparent',
  color: 'var(--theme-text)',
  borderRadius: 5,
  padding: '.2rem .55rem',
  fontSize: '.75rem',
  marginRight: '.4rem',
};

export function ConnectionInfo({ path }: { path?: string }): React.JSX.Element {
  const base = (path ?? '').replace(/\.connectionInfo$/, '');
  const secret = useFormFields(([f]) => f?.[`${base}.secret`]?.value) as string | undefined;
  const id = useFormFields(([f]) => f?.[`${base}.id`]?.value) as string | undefined;
  const enabled = useFormFields(([f]) => f?.[`${base}.enabled`]?.value) as boolean | undefined;

  // Read after mounting, never during render: the server does not know the domain, and
  // two different first renders would throw the whole form away (see WebhookSetup).
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const [stats, setStats] = useState<{ total: number; last?: string } | null>(null);
  useEffect(() => {
    if (!id) return undefined;
    let live = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/leads?where[webhookConnection][equals]=${encodeURIComponent(id)}&limit=1&sort=-createdAt&depth=0&select[createdAt]=true`,
          { credentials: 'include' },
        );
        if (!res.ok) return;
        const j = (await res.json()) as { totalDocs?: number; docs?: { createdAt?: string }[] };
        if (live) setStats({ total: j.totalDocs ?? 0, last: j.docs?.[0]?.createdAt });
      } catch {
        /* the count is a convenience; the connection works without it */
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  const [copied, setCopied] = useState<string | null>(null);
  const copy = (label: string, text: string): void => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(`${label} copied`);
        setTimeout(() => setCopied(null), 1800);
      },
      () => setCopied('Could not copy - select the text instead'),
    );
  };

  const url = `${origin}/api/lead-webhook`;
  const hasSecret = typeof secret === 'string' && secret.length > 0;
  const link = hasSecret ? `${url}?secret=${secret}` : '';

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 6,
        padding: '.7rem .85rem',
        margin: '.25rem 0 .5rem',
        fontSize: '.82rem',
        lineHeight: 1.55,
      }}
    >
      {!hasSecret ? (
        <div style={{ color: 'var(--theme-warning-500)' }}>
          Press Save to create this connection&apos;s secret and link.
        </div>
      ) : (
        <>
          {/* The address and the steps are at the top of the page, once for every
              connection; a row holds only what is its own. */}
          <div>
            <button type="button" style={btn} onClick={() => copy('Secret', secret)}>
              Copy secret
            </button>
            <button type="button" style={btn} onClick={() => copy('Link', link)}>
              Copy link with secret
            </button>
          </div>
          <div style={{ marginTop: '.5rem', opacity: 0.8 }}>
            Link with this connection&apos;s secret built in, for tools that cannot add a header:
          </div>
          <code style={code}>{link}</code>
        </>
      )}
      <div style={{ marginTop: '.25rem' }}>
        {enabled === false ? (
          <strong style={{ color: 'var(--theme-warning-500)' }}>
            Switched off - anything it sends is rejected.{' '}
          </strong>
        ) : null}
        {stats === null
          ? null
          : stats.total === 0
            ? 'No leads from this connection yet.'
            : `${stats.total.toLocaleString('en-IN')} ${stats.total === 1 ? 'lead' : 'leads'} received · last ${stats.last ? ago(stats.last) : '-'}.`}
      </div>
      {copied && <div style={{ marginTop: '.35rem', opacity: 0.75 }}>{copied}</div>}
    </div>
  );
}
