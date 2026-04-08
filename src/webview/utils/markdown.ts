import { Marked } from 'marked';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';

const marked = new Marked({
  gfm: true,
  breaks: true,
});

marked.use({
  renderer: {
    code(code: string, infostring: string | undefined) {
      const lang = infostring && hljs.getLanguage(infostring) ? infostring : undefined;
      const highlighted = lang
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
      const langClass = lang ? ` language-${lang}` : '';
      return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`;
    },
  },
});

/**
 * Preserve consecutive blank lines as visible vertical spacing.
 * Standard Markdown collapses any number of blank lines into a single
 * paragraph break. This converts each extra blank line into an `&nbsp;`
 * paragraph so the spacing is rendered.
 */
function preserveBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, (match) => {
    const spacers = match.length - 2;
    return '\n\n' + Array(spacers).fill('&nbsp;').join('\n\n') + '\n\n';
  });
}

export function renderMarkdown(text: string): string {
  if (!text) return '';
  try {
    const result = marked.parse(preserveBlankLines(text));
    if (typeof result === 'string') return result;
    return '';
  } catch {
    return text;
  }
}

export function highlightCode(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language }).value;
  }
  return hljs.highlightAuto(code).value;
}
