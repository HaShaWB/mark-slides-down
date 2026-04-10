import katex from 'katex';

/**
 * Renders TeX inside markdown before `marked` runs. Skips fenced ``` code ``` blocks
 * and single-line `inline code` spans.
 * Supports: $$ display $$, \[ display \], \( inline \), $ inline $ (not $$).
 */
const PROTECTED_MARKDOWN =
  /(```[\s\S]*?```|`[^`\n]*`)/g;

export function preprocessKatexInMarkdown(text: string): string {
  const parts = text.split(PROTECTED_MARKDOWN);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : replaceMathInProse(part)))
    .join('');
}

function replaceMathInProse(segment: string): string {
  let s = segment;
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, body: string) => renderKatexBlock(body, 'dollar'));
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => renderKatexBlock(body, 'bracket'));
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => renderKatexInline(body, 'paren'));
  s = s.replace(/(?<![$\\])\$(?!\$)((?:\\.|[^$\n])+?)\$(?!\$)/g, (_, body: string) =>
    renderKatexInline(body, 'dollar'),
  );
  return s;
}

function renderKatexBlock(body: string, kind: 'dollar' | 'bracket'): string {
  const trimmed = body.trim();
  if (!trimmed) return kind === 'dollar' ? `$$${body}$$` : `\\[${body}\\]`;
  try {
    return katex.renderToString(trimmed, { displayMode: true, throwOnError: false });
  } catch {
    return kind === 'dollar' ? `$$${body}$$` : `\\[${body}\\]`;
  }
}

function renderKatexInline(body: string, kind: 'dollar' | 'paren'): string {
  const trimmed = body.trim();
  if (!trimmed) return kind === 'dollar' ? `$${body}$` : `\\(${body}\\)`;
  try {
    return katex.renderToString(trimmed, { displayMode: false, throwOnError: false });
  } catch {
    return kind === 'dollar' ? `$${body}$` : `\\(${body}\\)`;
  }
}
