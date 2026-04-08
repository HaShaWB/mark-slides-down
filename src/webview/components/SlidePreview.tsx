import React, { useRef, useEffect, useState } from 'react';
import type { Slide, SlideElement, SlideDimensions, SlideStyle } from '../../types';
import { renderMarkdown, highlightCode } from '../utils/markdown';
import { MermaidDiagram } from './MermaidDiagram';

interface SlidePreviewProps {
  slide: Slide;
  dims: SlideDimensions;
  style: SlideStyle;
}

function pxToCqw(px: number, refWidth: number): string {
  return `${(px / refWidth) * 100}cqw`;
}

function pxToPct(px: number, refWidth: number): string {
  return `${(px / refWidth) * 100}%`;
}

const ALIGN_MAP: Record<string, string> = {
  left: 'flex-start', center: 'center', right: 'flex-end',
};
const VALIGN_MAP: Record<string, string> = {
  top: 'flex-start', center: 'center', bottom: 'flex-end',
};

export const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, dims, style }) => {
  const aspectRatio = `${dims.width} / ${dims.height}`;
  const layout = slide.type === 'cover' ? style.cover : style.body;

  const canvasStyle = {
    aspectRatio,
    containerType: 'inline-size',
    fontFamily: style.fontFamily,
    color: style.color,
    backgroundColor: style.backgroundColor,
    lineHeight: style.lineHeight,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: ALIGN_MAP[layout.align] || 'flex-start',
    justifyContent: VALIGN_MAP[layout.verticalAlign] || 'flex-start',
    textAlign: layout.align as any,
    padding: [
      pxToPct(layout.paddingTop, dims.width),
      pxToPct(layout.paddingRight, dims.width),
      pxToPct(layout.paddingBottom, dims.width),
      pxToPct(layout.paddingLeft, dims.width),
    ].join(' '),
    '--h1-size': pxToCqw(style.h1Size, dims.width),
    '--h2-size': pxToCqw(style.h2Size, dims.width),
    '--h3-size': pxToCqw(style.h3Size, dims.width),
    '--h4-size': pxToCqw(style.h4Size, dims.width),
    '--code-font': style.codeFontFamily,
    '--code-size': pxToCqw(style.codeFontSize, dims.width),
    '--content-size': pxToCqw(layout.contentSize, dims.width),
  } as React.CSSProperties;

  const titleStyle: React.CSSProperties = {
    fontSize: pxToCqw(layout.titleSize, dims.width),
    fontWeight: 700,
    marginBottom: '0.5em',
    width: slide.type === 'body' ? '100%' : (layout.align !== 'center' ? '100%' : undefined),
    ...(slide.type === 'body' && style.bodySeparatorShow !== false ? {
      borderBottom: `2px solid ${style.bodySeparatorColor || '#007acc'}`,
      paddingBottom: '0.3em',
    } : {}),
  };

  const contentStyle: React.CSSProperties = {
    fontSize: pxToCqw(layout.contentSize, dims.width),
    lineHeight: style.lineHeight,
    width: '100%',
  };

  return (
    <div className={`slide-preview ${slide.type}`}>
      <div className="slide-canvas" style={canvasStyle}>
        <div
          className="slide-title-rendered"
          style={titleStyle}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(slide.title) }}
        />
        {slide.content && (
          <div
            className="slide-content-rendered"
            style={contentStyle}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(slide.content) }}
          />
        )}
        {slide.elements.map((element, idx) => (
          <ElementPreview key={idx} element={element} dims={dims} style={style} />
        ))}
      </div>
    </div>
  );
};

const ElementPreview: React.FC<{ element: SlideElement; dims: SlideDimensions; style: SlideStyle }> = ({
  element, dims, style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = container.closest('.slide-canvas') as HTMLElement | null;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      setCanvasScale(canvas.clientWidth / dims.width);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [dims.width]);

  const userScale = element.scale ?? 1;
  const effectiveScale = canvasScale * userScale;

  const xPct = (element.pos[0] / dims.width) * 100;
  const yPct = (element.pos[1] / dims.height) * 100;

  const containerStyle: React.CSSProperties = {
    left: `${xPct}%`,
    top: `${yPct}%`,
    transformOrigin: 'top left',
    transform: `scale(${effectiveScale})`,
  };

  const innerStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    lineHeight: style.lineHeight,
  };

  const colWidths = element.meta?.colWidths
    ?.split(',')
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  const renderContent = () => {
    switch (element.type) {
      case 'image':
        return (
          <img
            src={element.data}
            alt={element.meta?.alt || ''}
            style={{ maxWidth: 600, height: 'auto', objectFit: 'contain' }}
          />
        );

      case 'code': {
        const lang = element.meta?.language || '';
        const highlighted = highlightCode(element.data, lang || undefined);
        return (
          <pre className="element-code-block" style={{
            fontFamily: style.codeFontFamily,
            fontSize: style.codeFontSize,
          }}>
            <div className="code-lang-label">{lang}</div>
            <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        );
      }

      case 'table': {
        const html = renderMarkdown(element.data);
        if (colWidths && colWidths.length > 0) {
          const colgroup = '<colgroup>' +
            colWidths.map((w) => `<col style="width:${w}%">`).join('') +
            '</colgroup>';
          const withWidths = html.replace(/<table>/, `<table>${colgroup}`);
          return <div dangerouslySetInnerHTML={{ __html: withWidths }} />;
        }
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
      }

      case 'markdown':
        return (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(element.data) }} />
        );

      case 'diagram':
        return <MermaidDiagram code={element.data} />;

      case 'text':
      default:
        return <div className="element-text">{element.data}</div>;
    }
  };

  return (
    <div ref={containerRef} className={`slide-element element-${element.type}`} style={containerStyle}>
      <div className="element-scale-wrapper" style={innerStyle}>
        {renderContent()}
      </div>
    </div>
  );
};
