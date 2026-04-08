import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVSCodeApi } from './vscodeApi';
import { SlideEditor } from './components/SlideEditor';
import { SlidePreview } from './components/SlidePreview';
import { Toolbar } from './components/Toolbar';
import { MetadataEditor } from './components/MetadataEditor';
import { StyleEditor } from './components/StyleEditor';
import type { SlidesDocument, Slide, SlideMetadata } from '../types';
import { getDocDimensions, getDocStyle } from '../types';

const vscode = getVSCodeApi();

export const App: React.FC = () => {
  const [doc, setDoc] = useState<SlidesDocument | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);
  const [sidebarW, setSidebarW] = useState(160);
  const [editorW, setEditorW] = useState<number | null>(null);
  const dragRef = useRef<{ target: 'sidebar' | 'editor'; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'update':
          setDoc(message.data);
          break;
        case 'imported':
          setDoc(message.data);
          setCurrentSlideIndex(0);
          break;
      }
    };
    window.addEventListener('message', handler);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d || !mainRef.current) return;
      const dx = e.clientX - d.startX;
      const total = mainRef.current.clientWidth;
      if (d.target === 'sidebar') {
        setSidebarW(Math.max(80, Math.min(350, d.startW + dx)));
      } else {
        const maxW = total - sidebarW - 200 - 12;
        setEditorW(Math.max(200, Math.min(maxW, d.startW + dx)));
      }
    };
    const onMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        window.document.body.style.cursor = '';
        window.document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [sidebarW]);

  const startResize = useCallback((target: 'sidebar' | 'editor', e: React.MouseEvent) => {
    e.preventDefault();
    let startW: number;
    if (target === 'sidebar') {
      startW = sidebarW;
    } else if (editorW != null) {
      startW = editorW;
    } else if (mainRef.current) {
      startW = (mainRef.current.clientWidth - sidebarW - 12) / 2;
    } else {
      startW = 400;
    }
    dragRef.current = { target, startX: e.clientX, startW };
    window.document.body.style.cursor = 'col-resize';
    window.document.body.style.userSelect = 'none';
  }, [sidebarW, editorW]);

  const updateDocument = useCallback((newDoc: SlidesDocument) => {
    setDoc(newDoc);
    vscode.postMessage({ type: 'edit', data: newDoc });
  }, []);

  const updateMetadata = useCallback((metadata: SlideMetadata) => {
    if (!doc) return;
    updateDocument({ ...doc, metadata });
  }, [doc, updateDocument]);

  const updateSlide = useCallback((index: number, slide: Slide) => {
    if (!doc) return;
    const newSlides = [...doc.slides];
    newSlides[index] = slide;
    updateDocument({ ...doc, slides: newSlides });
  }, [doc, updateDocument]);

  const addSlide = useCallback((afterIndex: number) => {
    if (!doc) return;
    const newSlide: Slide = {
      type: 'body',
      title: 'New Slide',
      content: '',
      elements: [],
    };
    const newSlides = [...doc.slides];
    newSlides.splice(afterIndex + 1, 0, newSlide);
    updateDocument({ ...doc, slides: newSlides });
    setCurrentSlideIndex(afterIndex + 1);
  }, [doc, updateDocument]);

  const deleteSlide = useCallback((index: number) => {
    if (!doc || doc.slides.length <= 1) return;
    const newSlides = doc.slides.filter((_, i) => i !== index);
    updateDocument({ ...doc, slides: newSlides });
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  }, [doc, updateDocument, currentSlideIndex]);

  const moveSlide = useCallback((from: number, to: number) => {
    if (!doc) return;
    if (to < 0 || to >= doc.slides.length) return;
    const newSlides = [...doc.slides];
    const [moved] = newSlides.splice(from, 1);
    newSlides.splice(to, 0, moved);
    updateDocument({ ...doc, slides: newSlides });
    setCurrentSlideIndex(to);
  }, [doc, updateDocument]);

  const duplicateSlide = useCallback((index: number) => {
    if (!doc) return;
    const clone = JSON.parse(JSON.stringify(doc.slides[index])) as Slide;
    const newSlides = [...doc.slides];
    newSlides.splice(index + 1, 0, clone);
    updateDocument({ ...doc, slides: newSlides });
    setCurrentSlideIndex(index + 1);
  }, [doc, updateDocument]);

  const importMarkdown = useCallback(() => {
    vscode.postMessage({ type: 'importMarkdown' });
  }, []);

  const exportHtml = useCallback(() => {
    vscode.postMessage({ type: 'exportHtml' });
  }, []);

  const exportPdf = useCallback(() => {
    vscode.postMessage({ type: 'exportPdf' });
  }, []);

  if (!doc) {
    return <div className="loading">Loading...</div>;
  }

  const dims = getDocDimensions(doc);
  const style = getDocStyle(doc);
  const currentSlide = doc.slides[currentSlideIndex];

  const editorStyle: React.CSSProperties = editorW != null
    ? { width: editorW, flex: 'none' }
    : {};

  return (
    <div className="app">
      <Toolbar
        slideCount={doc.slides.length}
        currentIndex={currentSlideIndex}
        onAddSlide={() => addSlide(currentSlideIndex)}
        onDeleteSlide={() => deleteSlide(currentSlideIndex)}
        onDuplicateSlide={() => duplicateSlide(currentSlideIndex)}
        onMoveUp={() => moveSlide(currentSlideIndex, currentSlideIndex - 1)}
        onMoveDown={() => moveSlide(currentSlideIndex, currentSlideIndex + 1)}
        onImportMarkdown={importMarkdown}
        onExportHtml={exportHtml}
        onExportPdf={exportPdf}
      />
      <div className="main-content" ref={mainRef}>
        <div className="slide-list" style={{ width: sidebarW }}>
          <MetadataEditor metadata={doc.metadata} onChange={updateMetadata} />
          {doc.slides.map((slide, index) => (
            <div
              key={index}
              className={`slide-thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
              onClick={() => setCurrentSlideIndex(index)}
            >
              <div className="slide-thumbnail-number">{index + 1}</div>
              <div className="slide-thumbnail-preview">
                <div className={`mini-slide ${slide.type}`}>
                  <div className="mini-title">{slide.title || '(No Title)'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="resize-handle" onMouseDown={e => startResize('sidebar', e)} />
        <div className="pane-editor" style={editorStyle}>
          <StyleEditor metadata={doc.metadata} onChange={updateMetadata} />
          <SlideEditor
            slide={currentSlide}
            index={currentSlideIndex}
            dims={dims}
            onChange={(slide) => updateSlide(currentSlideIndex, slide)}
          />
        </div>
        <div className="resize-handle" onMouseDown={e => startResize('editor', e)} />
        <div className="pane-preview">
          <SlidePreview slide={currentSlide} dims={dims} style={style} />
        </div>
      </div>
    </div>
  );
};
