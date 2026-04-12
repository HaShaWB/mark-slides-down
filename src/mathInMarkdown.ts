import katex from 'katex';

/**
 * Renders TeX inside markdown before `marked` runs. Skips fenced ``` code ``` blocks
 * and single-line `inline code` spans.
 * Supports: $$ display $$, \[ display \], \( inline \), $ inline $ (not $$).
 */
const PROTECTED_MARKDOWN =
  /(```[\s\S]*?```|`[^`\n]*`)/g;

/**
 * 코드블록·인라인코드·KaTeX 등 보호 영역을 제외하고,
 * 연속된 스페이스(2개 이상)를 &nbsp;로 변환하여
 * HTML의 공백 압축(whitespace collapsing)을 우회한다.
 * 예: "a   b" → "a &nbsp;&nbsp;b"
 *
 * 보호 영역: 펜스 코드블록, 인라인 코드, $$...$$ / \[...\] / \(...\) / $...$
 */
const PROTECTED_FOR_SPACES =
  /(```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<![$\\])\$(?!\$)(?:\\.|[^$\n])+?\$(?!\$))/g;

export function preserveMultipleSpaces(text: string): string {
  const parts = text.split(PROTECTED_FOR_SPACES);
  return parts
    .map((part, i) => (i % 2 === 1 ? part : collapseSpaces(part)))
    .join('');
}

function collapseSpaces(segment: string): string {
  // 2개 이상 연속 스페이스: 첫 스페이스는 일반, 나머지는 &nbsp; 로 치환
  return segment.replace(/ {2,}/g, (match) => ' ' + '&nbsp;'.repeat(match.length - 1));
}

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
