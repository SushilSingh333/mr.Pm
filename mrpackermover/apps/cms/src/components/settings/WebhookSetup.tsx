'use client';
import { useState } from 'react';
import { useFormFields } from '@payloadcms/ui';

/**
 * `ui` field at the top of Integrations: the webhook address, a copy button, and the
 * five steps to wire Zapier up.
 *
 * The address is not stored anywhere - it is this site's own origin plus a fixed path,
 * so showing it beats asking someone to assemble it from a doc and get the domain
 * wrong. Everything here is read-only; the secret itself lives in the field below.
 */

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 6,
  padding: '.75rem .9rem',
  marginBottom: '1rem',
  fontSize: '.82rem',
  lineHeight: 1.6,
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
  margin: '.35rem 0 .1rem',
};

export function WebhookSetup(): React.JSX.Element {
  const enabled = useFormFields(([fields]) => fields?.leadWebhookEnabled?.value);
  const secret = useFormFields(([fields]) => fields?.leadWebhookSecret?.value);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = `${origin}/api/lead-webhook`;
  const hasSecret = typeof secret === 'string' && secret.length > 0;

  const copy = (label: string, text: string): void => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(label);
        setTimeout(() => setCopied(null), 1800);
      },
      () => setCopied('Could not copy — select the text instead'),
    );
  };

  return (
    <div style={box}>
      <strong style={{ display: 'block', marginBottom: '.5rem' }}>
        Send leads here from Zapier
      </strong>

      <div>Webhook URL (POST)</div>
      <code style={code}>{url}</code>
      <button
        type="button"
        onClick={() => copy('URL', url)}
        style={{
          cursor: 'pointer',
          border: '1px solid var(--theme-elevation-150)',
          background: 'transparent',
          color: 'var(--theme-text)',
          borderRadius: 5,
          padding: '.2rem .5rem',
          fontSize: '.75rem',
          marginBottom: '.75rem',
        }}
      >
        Copy URL
      </button>

      <ol style={{ margin: '.25rem 0 .75rem', paddingLeft: '1.1rem' }}>
        <li>
          Trigger: <em>Facebook Lead Ads → New Lead</em>. Pick your page and form.
        </li>
        <li>
          Action: <em>Webhooks by Zapier → POST</em>.
        </li>
        <li>
          <strong>URL</strong> — paste the address above.
        </li>
        <li>
          <strong>Headers</strong> (scroll down past Basic Auth) — add <code>x-webhook-secret</code>{' '}
          with the secret below.
        </li>
        <li>
          <strong>Data</strong> — one row per field. Put the field name on the left and the Facebook
          value on the right.
        </li>
        <li>Turn the Zap on and send a test. It should appear in Leads straight away.</li>
      </ol>

      <div style={{ opacity: 0.8 }}>
        <strong>Payload Type</strong> can be Json or Form — both are accepted, as are{' '}
        <em>Wrap Request In Array</em> and <em>Unflatten</em> in either position. Nothing here
        depends on getting a dropdown right.
        <br />
        <br />
        Field names are matched loosely: <code>full_name</code>, <code>fullName</code>,{' '}
        <code>Full Name</code> and <code>Phone No.</code> all land correctly. A{' '}
        <strong>phone number is the only required field</strong>. Everything you send is kept on the
        lead, so a field that did not map can be read rather than guessed at.
        <br />
        <br />
        If you cannot add a header, append <code>?secret=…</code> to the URL instead. It works, but
        a header is better — query strings end up in server logs.
      </div>

      {!hasSecret && (
        <div style={{ marginTop: '.6rem', color: 'var(--theme-warning-500)' }}>
          No secret yet — press Save and one will be generated.
        </div>
      )}
      {enabled === false && (
        <div style={{ marginTop: '.6rem', color: 'var(--theme-warning-500)' }}>
          Receiving is switched off below, so anything sent now is rejected.
        </div>
      )}
      {copied && <div style={{ marginTop: '.5rem', opacity: 0.75 }}>{copied} copied</div>}
    </div>
  );
}
