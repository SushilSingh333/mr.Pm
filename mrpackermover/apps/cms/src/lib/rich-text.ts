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
