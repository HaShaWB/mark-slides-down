import {
  SlidesDocument,
  Slide,
  SlideElement,
  createDefaultMetadata,
  createDefaultSlide,
  createDefaultElement,
  DEFAULT_DIMENSIONS,
} from './types';

const MAX_CONTENT_LINES = 18;

/**
 * Import rules:
 * - Frontmatter (---...---) → metadata
 * - H1 → cover slide
 * - H2 → new body slide title
 * - H3~text → body slide content
 *   - Overflow → new page with same H2 title
 *   - `---` → forced page break
 * - ```code``` blocks → code element on current slide
 * - ![alt](url) → image element on current slide
 */
export function importMarkdownToSlides(markdown: string): SlidesDocument {
  const metadata = createDefaultMetadata();
  const { body, frontmatter } = parseFrontmatter(markdown);

  if (frontmatter.title) metadata.title = frontmatter.title;
  if (frontmatter.author) metadata.author = frontmatter.author;
  if (frontmatter.date) metadata.date = frontmatter.date;
  if (frontmatter.theme) metadata.theme = frontmatter.theme;

  const slides: Slide[] = [];
  const lines = body.split('\n');

  let currentSlide: Slide | null = null;
  let contentLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  function flushSlide() {
    if (!currentSlide) return;
    currentSlide.content = contentLines.join('\n').trim();
    if (currentSlide.title || currentSlide.content || currentSlide.elements.length > 0) {
      slides.push(currentSlide);
    }
    contentLines = [];
    currentSlide = null;
  }

  function ensureSlide(): Slide {
    if (!currentSlide) {
      currentSlide = createDefaultSlide('body');
      currentSlide.title = '';
    }
    return currentSlide;
  }

  function overflowIfNeeded() {
    if (!currentSlide) return;
    if (contentLines.length >= MAX_CONTENT_LINES) {
      const savedTitle = currentSlide.title;
      flushSlide();
      currentSlide = createDefaultSlide('body');
      currentSlide.title = savedTitle;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim() || 'text';
        codeBlockLines = [];
        continue;
      } else {
        inCodeBlock = false;
        const slide = ensureSlide();
        const elementCount = slide.elements.length;
        const W = DEFAULT_DIMENSIONS.width;
        const H = DEFAULT_DIMENSIONS.height;
        const xPos = elementCount > 0 ? Math.round(W * 0.52) : Math.round(W * 0.05);
        const elem = createDefaultElement('code');
        elem.data = codeBlockLines.join('\n');
        elem.meta = { language: codeBlockLang };
        elem.pos = [xPos, Math.min(Math.round(H * 0.25) + elementCount * 50, Math.round(H * 0.6))];
        slide.elements.push(elem);
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Horizontal rule → page break
    if (/^---+$/.test(trimmed)) {
      flushSlide();
      continue;
    }

    // Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const slide = ensureSlide();
      const elem = createDefaultElement('image');
      const W = DEFAULT_DIMENSIONS.width;
      const H = DEFAULT_DIMENSIONS.height;
      elem.data = imgMatch[2];
      elem.meta = { alt: imgMatch[1] };
      const elementCount = slide.elements.length;
      elem.pos = [Math.round(W * 0.55), Math.min(Math.round(H * 0.2) + elementCount * 60, Math.round(H * 0.6))];
      slide.elements.push(elem);
      continue;
    }

    // H1 → cover slide
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushSlide();
      currentSlide = createDefaultSlide('cover');
      currentSlide.title = h1Match[1];
      if (metadata.title === 'Untitled Presentation') {
        metadata.title = h1Match[1];
      }
      continue;
    }

    // H2 → new body slide
    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushSlide();
      currentSlide = createDefaultSlide('body');
      currentSlide.title = h2Match[1];
      continue;
    }

    // H3~H6, text → content
    ensureSlide();
    contentLines.push(line);
    overflowIfNeeded();
  }

  // Flush unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    const slide = ensureSlide();
    const elem = createDefaultElement('code');
    elem.data = codeBlockLines.join('\n');
    elem.meta = { language: codeBlockLang };
    elem.pos = [Math.round(DEFAULT_DIMENSIONS.width * 0.05), Math.round(DEFAULT_DIMENSIONS.height * 0.3)];
    slide.elements.push(elem);
  }

  flushSlide();

  if (slides.length === 0) {
    slides.push(createDefaultSlide('cover'));
  }

  return { metadata, slides };
}

interface Frontmatter {
  [key: string]: string;
}

function parseFrontmatter(markdown: string): { body: string; frontmatter: Frontmatter } {
  const fm: Frontmatter = {};
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return { body: markdown, frontmatter: fm };

  const block = match[1];
  for (const line of block.split('\n')) {
    const kv = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
    if (kv) {
      fm[kv[1].trim().toLowerCase()] = kv[2].trim();
    }
  }

  return {
    body: markdown.slice(match[0].length),
    frontmatter: fm,
  };
}
