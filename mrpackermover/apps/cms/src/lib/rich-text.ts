/**
 * Minimal Lexical rich-text helpers. We only need to (a) count words for the
 * publish gate and (b) flatten to plain text for meta/JSON-LD. Full rendering to
 * HTML happens in the web app via Payload's Lexical → HTML converter.
 */

interface LexicalNode {
  type?: string;
  text?: string;
  children?: LexicalNode[];
  root?: LexicalNode;
}

export function richTextToPlain(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const root = (value as LexicalNode).root ?? (value as LexicalNode);
  const parts: string[] = [];
  const walk = (node: LexicalNode | undefined): void => {
    if (!node) return;
    if (typeof node.text === 'string') parts.push(node.text);
    node.children?.forEach(walk);
  };
  walk(root);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function countWords(value: unknown): number {
  const text = richTextToPlain(value);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

interface RichNode {
  type?: string;
  tag?: string | number;
  text?: string;
  format?: number | string;
  listType?: string;
  url?: string;
  fields?: { url?: string };
  children?: RichNode[];
  root?: RichNode;
}

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Allowlist safe URL schemes for links. Anything else — `javascript:`, `data:`, `vbscript:`,
 * … — is dropped to `#`. The output of this converter is rendered on the public site with
 * `set:html`, so a scripted href entered by an editor (or via a compromised account) must
 * never survive into the HTML.
 */
const safeHref = (raw: string): string => {
  const url = raw.trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : '#';
};

/**
 * Compact Lexical → HTML for editable page bodies (the Pages collection). Handles
 * paragraphs, h2/h3 headings, ordered/unordered lists, links and bold/italic — enough
 * for the editorial pages, without pulling in a converter dependency. Denormalised into
 * the manifest so the web app renders plain HTML with no Lexical dependency at runtime.
 */
export function richTextToHtml(value: unknown): string {
  const root = (value as RichNode)?.root;
  if (!root?.children) return '';

  const inline = (node: RichNode): string => {
    if (typeof node.text === 'string') {
      let t = esc(node.text);
      const f = typeof node.format === 'number' ? node.format : 0;
      if (f & 1) t = `<strong>${t}</strong>`;
      if (f & 2) t = `<em>${t}</em>`;
      return t;
    }
    if (node.type === 'link') {
      const url = safeHref(node.fields?.url ?? node.url ?? '#');
      const rel = /^https?:/i.test(url) ? ' rel="noopener noreferrer"' : '';
      return `<a href="${esc(url)}"${rel}>${(node.children ?? []).map(inline).join('')}</a>`;
    }
    return (node.children ?? []).map(inline).join('');
  };

  const block = (node: RichNode): string => {
    const kids = (node.children ?? []).map(inline).join('');
    switch (node.type) {
      case 'heading': {
        const tag = node.tag === 'h3' || node.tag === 3 ? 'h3' : 'h2';
        return `<${tag}>${kids}</${tag}>`;
      }
      case 'list': {
        const tag = node.listType === 'number' ? 'ol' : 'ul';
        const items = (node.children ?? [])
          .map((li) => `<li>${(li.children ?? []).map(inline).join('')}</li>`)
          .join('');
        return `<${tag}>${items}</${tag}>`;
      }
      case 'quote':
        return `<blockquote>${kids}</blockquote>`;
      default:
        return kids.trim() ? `<p>${kids}</p>` : '';
    }
  };

  return root.children.map(block).join('\n');
}
