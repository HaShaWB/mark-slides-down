import { Marked } from 'marked';
import hljs from 'highlight.js/lib/common';
import katex from 'katex';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import type { SlidesDocument, Slide, SlideElement, SlideDimensions, SlideStyle, LayoutStyle } from './types';
import { getDocDimensions, getDocStyle } from './types';
import { preprocessKatexInMarkdown, preserveMultipleSpaces } from './mathInMarkdown';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createMarked(): Marked {
  const md = new Marked({ gfm: true, breaks: true });
  md.use({
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
  return md;
}

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

function renderMd(md: Marked, text: string): string {
  if (!text) return '';
  // 파이프라인: 연속 스페이스 보존 → KaTeX → 빈 줄 보존 → 마크다운 파싱
  const r = md.parse(preserveBlankLines(preprocessKatexInMarkdown(preserveMultipleSpaces(text))));
  return typeof r === 'string' ? r : '';
}

function hljsHighlight(code: string, lang?: string): string {
  if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
  return hljs.highlightAuto(code).value;
}

const ALIGN: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const VALIGN: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

function renderElement(
  el: SlideElement, dims: SlideDimensions, style: SlideStyle, md: Marked, elIdx: number
): string {
  const userScale = el.scale ?? 1;
  const css = `position:absolute;left:${el.pos[0]}px;top:${el.pos[1]}px;transform-origin:top left;transform:scale(${userScale});`;

  let content: string;
  switch (el.type) {
    case 'code': {
      const lang = el.meta?.language || '';
      const highlighted = hljsHighlight(el.data, lang);
      content = `<pre class="code-block"><code class="hljs">${highlighted}</code></pre>`;
      break;
    }
    case 'markdown':
      content = renderMd(md, el.data);
      break;
    case 'table': {
      const colWidths = el.meta?.colWidths?.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
      let html = renderMd(md, el.data);
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

function renderSlide(
  slide: Slide, idx: number, total: number, style: SlideStyle, dims: SlideDimensions, md: Marked
): string {
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
    `position:relative`, `overflow:hidden`, `flex-shrink:0`,
  ].join(';');

  const titleStyle = [
    `font-size:${layout.titleSize}px`, `font-weight:700`, `margin-bottom:0.5em`,
    ...(slide.type === 'body' && style.bodySeparatorShow !== false
      ? [`border-bottom:2px solid ${style.bodySeparatorColor || '#007acc'}`, `padding-bottom:0.3em`, `width:100%`]
      : slide.type === 'body' ? [`width:100%`] : []),
  ].join(';');

  const contentStyle = `font-size:${layout.contentSize}px;line-height:${style.lineHeight};width:100%;`;

  const titleHtml = renderMd(md, slide.title);
  const contentHtml = slide.content ? renderMd(md, slide.content) : '';
  let elIdx = 0;
  const elementsHtml = slide.elements.map(el => renderElement(el, dims, style, md, elIdx++)).join('\n');

  return `<div class="slide-wrapper" data-index="${idx}">
  <div class="slide-label">${idx + 1} / ${total}</div>
  <section class="slide ${slide.type}" style="${slideStyle}">
    <div class="slide-title" style="${titleStyle}">${titleHtml}</div>
    ${contentHtml ? `<div class="slide-content" style="${contentStyle}">${contentHtml}</div>` : ''}
    ${elementsHtml}
  </section>
</div>`;
}

function getCss(dims: SlideDimensions, style: SlideStyle): string {
  return `
*{box-sizing:border-box;margin:0;padding:0;}
html{background:#2d2d2d;}
body{min-height:100vh;}

.slides-container{display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:30px;}

.slide-wrapper{width:100%;max-width:960px;position:relative;}
.slide-label{font-family:sans-serif;font-size:12px;color:#888;margin-bottom:6px;}

.slide{transform-origin:top left;box-shadow:0 2px 16px rgba(0,0,0,0.4);border-radius:4px;}

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

${getHljsCss()}

.nav-bar{position:fixed;top:12px;right:16px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 14px;border-radius:20px;font-family:sans-serif;font-size:13px;z-index:100;display:flex;align-items:center;gap:10px;user-select:none;}
.nav-bar button{background:#007acc;color:#fff;border:none;padding:4px 12px;border-radius:12px;cursor:pointer;font-size:12px;}
.nav-bar button:hover{background:#0098ff;}
.nav-bar .exit-btn{display:none;}
.nav-bar #counter{display:none;}

body.presenting{overflow:hidden;background:#000;}
body.presenting .slides-container{padding:0;gap:0;}
body.presenting .slide-wrapper{position:fixed;inset:0;max-width:none;display:none;justify-content:center;align-items:center;}
body.presenting .slide-wrapper.active{display:flex;}
body.presenting .slide-label{display:none;}
body.presenting .slide{box-shadow:none;border-radius:0;}
body.presenting .nav-bar .present-btn{display:none;}
body.presenting .nav-bar .exit-btn{display:inline;}
body.presenting .nav-bar #counter{display:inline;}

@media print{
  body,html{background:white!important;}
  .nav-bar{display:none!important;}
  .slides-container{padding:0;gap:0;}
  .slide-wrapper{max-width:none;page-break-after:always;}
  .slide{transform:none!important;box-shadow:none;border-radius:0;}
  .slide-label{display:none;}
  @page{size:${dims.width}px ${dims.height}px;margin:0;}
}`;
}

function getJs(dims: SlideDimensions, slideCount: number): string {
  return `(function(){
  var wrappers=document.querySelectorAll('.slide-wrapper');
  var counter=document.getElementById('counter');
  var W=${dims.width},H=${dims.height};
  var presenting=false,current=0;

  function scaleDocument(){
    wrappers.forEach(function(w){
      var slide=w.querySelector('.slide');
      var scale=w.clientWidth/W;
      slide.style.transform='scale('+scale+')';
      slide.style.transformOrigin='top left';
      w.style.height=(H*scale+30)+'px';
    });
  }

  function scalePresentation(){
    var s=Math.min(window.innerWidth/W,window.innerHeight/H);
    wrappers.forEach(function(w){
      var slide=w.querySelector('.slide');
      slide.style.transform='scale('+s+')';
      slide.style.transformOrigin='center center';
    });
  }

  function showSlide(idx){
    current=Math.max(0,Math.min(idx,wrappers.length-1));
    wrappers.forEach(function(w,i){w.classList.toggle('active',i===current);});
    counter.textContent=(current+1)+' / '+wrappers.length;
  }

  function enterPresent(){
    presenting=true;
    document.body.classList.add('presenting');
    showSlide(current);
    scalePresentation();
  }

  function exitPresent(){
    presenting=false;
    document.body.classList.remove('presenting');
    wrappers.forEach(function(w){w.classList.remove('active');w.style.display='';w.style.position='';w.style.inset='';});
    scaleDocument();
  }

  window.enterPresent=enterPresent;
  window.exitPresent=exitPresent;

  document.addEventListener('keydown',function(e){
    if(e.key==='f'||e.key==='F'){presenting?exitPresent():enterPresent();return;}
    if(e.key==='Escape'&&presenting){exitPresent();return;}
    if(presenting){
      if(e.key==='ArrowRight'||e.key===' '||e.key==='Enter'){e.preventDefault();showSlide(current+1);}
      else if(e.key==='ArrowLeft'||e.key==='Backspace'){e.preventDefault();showSlide(current-1);}
      else if(e.key==='Home')showSlide(0);
      else if(e.key==='End')showSlide(wrappers.length-1);
    }
  });

  window.addEventListener('resize',function(){
    if(presenting)scalePresentation();
    else scaleDocument();
  });

  scaleDocument();
})();`;
}

function getMermaidJs(): string {
  return `
if(typeof mermaid!=='undefined'){
  mermaid.initialize({startOnLoad:false,theme:'default'});
  var diagrams=document.querySelectorAll('.mermaid-diagram');
  diagrams.forEach(function(el,i){
    var code=el.getAttribute('data-code');
    if(!code)return;
    mermaid.render('mmd-'+i,code).then(function(r){el.innerHTML=r.svg;}).catch(function(e){el.innerHTML='<pre style=\"color:#f88;\">'+e+'</pre>';});
  });
}`;
}

function getHljsCss(): string {
  return `pre code.hljs{display:block;overflow-x:auto;padding:1em}
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

export function generateSlideshowHtml(doc: SlidesDocument): string {
  const dims = getDocDimensions(doc);
  const style = getDocStyle(doc);
  const md = createMarked();

  const slidesHtml = doc.slides.map((slide, i) =>
    renderSlide(slide, i, doc.slides.length, style, dims, md)
  ).join('\n\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(doc.metadata.title || 'Presentation')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" crossorigin="anonymous">
<style>
${getCss(dims, style)}
</style>
</head>
<body>

<div class="slides-container">
${slidesHtml}
</div>

<div class="nav-bar">
  <button class="present-btn" onclick="enterPresent()">Present (F)</button>
  <button class="exit-btn" onclick="exitPresent()">Exit (Esc)</button>
  <span id="counter">1 / ${doc.slides.length}</span>
</div>

<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
${getJs(dims, doc.slides.length)}
${getMermaidJs()}
</script>
</body>
</html>`;
}

export function findChromePath(): string | undefined {
  const platform = process.platform;

  if (platform === 'win32') {
    const bases = [
      process.env['PROGRAMFILES'],
      process.env['PROGRAMFILES(X86)'],
      process.env['LOCALAPPDATA'],
    ].filter(Boolean) as string[];

    for (const base of bases) {
      for (const browser of [
        path.join('Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join('Microsoft', 'Edge', 'Application', 'msedge.exe'),
      ]) {
        const p = path.join(base, browser);
        if (fs.existsSync(p)) return p;
      }
    }
    return undefined;
  }

  if (platform === 'darwin') {
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
    return candidates.find(p => fs.existsSync(p));
  }

  const { execSync } = require('child_process');
  for (const cmd of ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium']) {
    try {
      const p = execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim();
      if (p && fs.existsSync(p)) return p;
    } catch { /* not found */ }
  }
  return undefined;
}

export async function exportToPdf(doc: SlidesDocument, pdfPath: string): Promise<void> {
  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error(
      'Chrome or Edge not found.\n' +
      'Install Google Chrome or Microsoft Edge to use PDF export.\n' +
      'Alternatively, export as HTML and print to PDF from your browser.'
    );
  }

  const html = generateSlideshowHtml(doc);
  const tmpHtml = path.join(os.tmpdir(), `msd-export-${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf-8');

  const fileUri = process.platform === 'win32'
    ? `file:///${tmpHtml.replace(/\\/g, '/')}`
    : `file://${tmpHtml}`;

  try {
    await new Promise<void>((resolve, reject) => {
      execFile(chromePath, [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-extensions',
        '--run-all-compositor-stages-before-draw',
        `--print-to-pdf=${pdfPath}`,
        '--no-pdf-header-footer',
        fileUri,
      ], { timeout: 30000 }, (error) => {
        if (error) reject(new Error(`Chrome PDF generation failed: ${error.message}`));
        else resolve();
      });
    });
  } finally {
    try { fs.unlinkSync(tmpHtml); } catch { /* ignore */ }
  }
}
