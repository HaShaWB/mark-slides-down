import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/common';
import mermaid from 'mermaid';
import katex from 'katex';
import type { Slide, SlideElement, SlideDimensions, SlideStyle, LayoutStyle } from '../../types';
import { preprocessKatexInMarkdown, preserveMultipleSpaces } from '../../mathInMarkdown';

interface SlidePreviewProps {
  slide: Slide;
  dims: SlideDimensions;
  style: SlideStyle;
}

/* ------------------------------------------------------------------ */
/*  Rendering helpers – identical to exporter.ts                      */
/* ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const md: Marked = (() => {
  const m = new Marked({ gfm: true, breaks: true });
  m.use({
    renderer: {
      code(code: string, infostring: string | undefined) {
        const lang = infostring && hljs.getLanguage(infostring) ? infostring : undefined;
        const highlighted = lang
          ? hljs.highlight(code, { language: lang }).value
          : hljs.highlightAuto(code).value;
        return `<pre><code class="hljs">${highlighted}</code></pre>`;
      },
    },
  });
  return m;
})();

function preserveBlankLines(text: string): string {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(/\n{3,}/g, (match) => {
      const spacers = match.length - 2;
      return '\n\n' + Array(spacers).fill('&nbsp;').join('\n\n') + '\n\n';
    });
  }).join('');
}

function renderMd(text: string): string {
  if (!text) return '';
  // 파이프라인: 연속 스페이스 보존 → KaTeX → 빈 줄 보존 → 마크다운 파싱
  const r = md.parse(preserveBlankLines(preprocessKatexInMarkdown(preserveMultipleSpaces(text))));
  return typeof r === 'string' ? r : '';
}

const ALIGN: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const VALIGN: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

function renderElement(el: SlideElement, style: SlideStyle): string {
  const userScale = el.scale ?? 1;
  const css = `position:absolute;left:${el.pos[0]}px;top:${el.pos[1]}px;transform-origin:top left;transform:scale(${userScale});`;

  let content: string;
  switch (el.type) {
    case 'code': {
      const lang = el.meta?.language || '';
      const highlighted = lang && hljs.getLanguage(lang)
        ? hljs.highlight(el.data, { language: lang }).value
        : hljs.highlightAuto(el.data).value;
      content = `<pre class="code-block"><code class="hljs">${highlighted}</code></pre>`;
      break;
    }
    case 'markdown':
      content = renderMd(el.data);
      break;
    case 'table': {
      const colWidths = el.meta?.colWidths?.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
      let html = renderMd(el.data);
      if (colWidths && colWidths.length > 0) {
        const colgroup = '<colgroup>' + colWidths.map(w => `<col style="width:${w}%">`).join('') + '</colgroup>';
        html = html.replace(/<table>/, `<table>${colgroup}`);
      }
      content = html;
      break;
    }
    case 'image':
      content = `<img src="${escapeHtml(el.data)}" alt="${escapeHtml(el.meta?.alt || '')}" style="max-width:600px;height:auto;object-fit:contain;">`;
      break;
    case 'text':
      content = `<div style="white-space:pre-wrap;">${escapeHtml(el.data)}</div>`;
      break;
    case 'diagram':
      content = `<div class="mermaid-diagram" data-code="${escapeHtml(el.data)}"><pre style="color:#999;padding:1em;font-size:14px;">Loading diagram...</pre></div>`;
      break;
    case 'latex':
      content = `<div class="latex-element">${katex.renderToString(el.data.trim() || '\\;', {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
      break;
    default:
      content = '';
  }

  return `<div class="element" style="${css}">${content}</div>`;
}

function buildSlideHtml(slide: Slide, style: SlideStyle, dims: SlideDimensions): string {
  const layout: LayoutStyle = slide.type === 'cover' ? style.cover : style.body;

  const slideStyle = [
    `width:${dims.width}px`, `height:${dims.height}px`,
    `background-color:${style.backgroundColor}`, `color:${style.color}`,
    `font-family:${style.fontFamily}`, `font-size:16px`, `line-height:${style.lineHeight}`,
    `padding:${layout.paddingTop}px ${layout.paddingRight}px ${layout.paddingBottom}px ${layout.paddingLeft}px`,
    `display:flex`, `flex-direction:column`,
    `align-items:${ALIGN[layout.align] || 'flex-start'}`,
    `justify-content:${VALIGN[layout.verticalAlign] || 'flex-start'}`,
    `text-align:${layout.align}`,
    `position:relative`, `overflow:hidden`,
  ].join(';');

  const titleStyle = [
    `font-size:${layout.titleSize}px`, `font-weight:700`, `margin-bottom:0.5em`,
    ...(slide.type === 'body' && style.bodySeparatorShow !== false
      ? [`border-bottom:2px solid ${style.bodySeparatorColor || '#007acc'}`, `padding-bottom:0.3em`, `width:100%`]
      : slide.type === 'body' ? [`width:100%`] : []),
  ].join(';');

  const contentStyle = `font-size:${layout.contentSize}px;line-height:${style.lineHeight};width:100%;`;

  const titleHtml = renderMd(slide.title);
  const contentHtml = slide.content ? renderMd(slide.content) : '';
  const elementsHtml = slide.elements.map(el => renderElement(el, style)).join('\n');

  return `<section class="slide ${slide.type}" style="${slideStyle}">
    <div class="slide-title" style="${titleStyle}">${titleHtml}</div>
    ${contentHtml ? `<div class="slide-content" style="${contentStyle}">${contentHtml}</div>` : ''}
    ${elementsHtml}
  </section>`;
}

function getSlideCss(style: SlideStyle): string {
  return `
.slide{box-sizing:border-box;}
.slide *{box-sizing:border-box;margin:0;padding:0;}
.slide h1{font-size:${style.h1Size}px;margin:0.3em 0;}
.slide h2{font-size:${style.h2Size}px;margin:0.3em 0;}
.slide h3{font-size:${style.h3Size}px;margin:0.3em 0;}
.slide h4{font-size:${style.h4Size}px;margin:0.3em 0;}
.slide-title h1,.slide-title h2,.slide-title h3,.slide-title h4{font-size:inherit;margin:0;}
.slide ul,.slide ol{padding-left:1.5em;margin:0.4em 0;}
.slide li{margin:0.2em 0;}
/* cover 슬라이드: 리스트 블럭은 가운데, 내부 항목은 왼쪽 정렬 */
.slide.cover ul,.slide.cover ol{display:inline-block;text-align:left;}
.slide p{margin:0.3em 0;}
.slide a{color:#007acc;text-decoration:none;}
.slide strong{font-weight:700;}
.slide code,.slide code.hljs{background:rgba(128,128,128,0.15);padding:1px 5px;border-radius:3px;font-family:${style.codeFontFamily};font-size:0.9em;}
.slide pre{background:#0d1117;border-radius:5px;padding:0.8em;overflow-x:auto;margin:0.6em 0;}
.slide pre code,.slide pre code.hljs{background:transparent;padding:0;font-size:${style.codeFontSize}px;font-family:${style.codeFontFamily};}
.slide blockquote{border-left:3px solid #007acc;margin:0.5em 0;padding:0.3em 0.8em;color:#888;background:rgba(128,128,128,0.1);}
.slide table{border-collapse:collapse;width:100%;margin:0.5em 0;}
.slide th,.slide td{border:1px solid rgba(128,128,128,0.3);padding:0.4em 0.8em;text-align:left;}
.slide th{background:rgba(128,128,128,0.1);font-weight:600;}
.slide tr:nth-child(even){background:rgba(128,128,128,0.05);}
.element{font-family:${style.fontFamily};line-height:${style.lineHeight};}
.code-block{background:#0d1117;border-radius:5px;padding:0.8em;font-family:${style.codeFontFamily};font-size:${style.codeFontSize}px;overflow:auto;margin:0;}
.code-block code{background:transparent;padding:0;font-size:inherit;}
.mermaid-diagram svg{max-width:100%;height:auto;}
.slide .katex-display{display:block;margin:0.5em 0;text-align:center;overflow-x:auto;}
.latex-element{overflow-x:auto;text-align:center;}
.latex-element .katex-display{margin:0;}
pre code.hljs{display:block;overflow-x:auto;padding:1em}
code.hljs{padding:3px 5px}
.hljs{color:#c9d1d9;background:#0d1117}
.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}
.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}
.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-variable,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id{color:#79c0ff}
.hljs-regexp,.hljs-string,.hljs-meta .hljs-string{color:#a5d6ff}
.hljs-built_in,.hljs-symbol{color:#ffa657}
.hljs-comment,.hljs-code,.hljs-formula{color:#8b949e}
.hljs-name,.hljs-quote,.hljs-selector-tag,.hljs-selector-pseudo{color:#7ee787}
.hljs-subst{color:#c9d1d9}
.hljs-section{color:#1f6feb;font-weight:bold}
.hljs-bullet{color:#f2cc60}
.hljs-emphasis{color:#c9d1d9;font-style:italic}
.hljs-strong{color:#c9d1d9;font-weight:bold}
.hljs-addition{color:#aff5b4;background-color:#033a16}
.hljs-deletion{color:#ffdcd7;background-color:#67060c}`;
}

/* ------------------------------------------------------------------ */
/*  Mermaid helper                                                    */
/* ------------------------------------------------------------------ */

let mermaidReady = false;
let mermaidId = 0;

function ensureMermaidInit() {
  if (mermaidReady) return;
  mermaidReady = true;
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, dims, style }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScale(el.clientWidth / dims.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [dims.width]);

  const slideHtml = useMemo(
    () => buildSlideHtml(slide, style, dims),
    [slide, style, dims],
  );

  const slideCss = useMemo(() => getSlideCss(style), [style]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const diagrams = el.querySelectorAll<HTMLElement>('.mermaid-diagram[data-code]');
    if (diagrams.length === 0) return;
    ensureMermaidInit();
    diagrams.forEach((node) => {
      const code = node.getAttribute('data-code');
      if (!code) return;
      const id = `mmd-pv-${++mermaidId}`;
      mermaid.render(id, code)
        .then(({ svg }) => { node.innerHTML = svg; })
        .catch((err: any) => {
          node.innerHTML = `<pre style="color:#f88;font-size:14px;">${
            typeof err === 'string' ? err : err?.message || 'Error'
          }</pre>`;
        });
    });
  }, [slideHtml]);

  return (
    <div
      className="slide-preview"
      ref={wrapperRef}
      style={{ height: dims.height * scale }}
    >
      <style>{slideCss}</style>
      <div
        style={{ transformOrigin: 'top left', transform: `scale(${scale})` }}
        dangerouslySetInnerHTML={{ __html: slideHtml }}
      />
    </div>
  );
};
