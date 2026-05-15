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

  const resizeByKeyboard = useCallback((target: 'sidebar' | 'editor', e: React.KeyboardEvent) => {
    const STEP = e.shiftKey ? 48 : 16;
    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -STEP;
    else if (e.key === 'ArrowRight') delta = STEP;
    else if (e.key === 'Home') delta = -10000;
    else if (e.key === 'End') delta = 10000;
    else return;
    e.preventDefault();
    if (target === 'sidebar') {
      setSidebarW((w) => Math.max(80, Math.min(350, w + delta)));
    } else {
      const total = mainRef.current?.clientWidth ?? 1200;
      const maxW = total - sidebarW - 200 - 12;
      setEditorW((w) => {
        const base = w ?? (total - sidebarW - 12) / 2;
        return Math.max(200, Math.min(maxW, base + delta));
      });
    }
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
    return (
      <div className="loading" role="status" aria-live="polite">
        Loading...
      </div>
    );
  }

  const dims = getDocDimensions(doc);
  const style = getDocStyle(doc);
  const currentSlide = doc.slides[currentSlideIndex];

  const editorStyle: React.CSSProperties = editorW != null
    ? { width: editorW, flex: 'none' }
    : {};

  return (
    <div className="app">
      <a className="skip-link" href="#editor-main">
        본문 편집기로 건너뛰기
      </a>
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
        <nav
          className="slide-list"
          style={{ width: sidebarW }}
          aria-label="문서 설정 및 슬라이드 목록"
        >
          <MetadataEditor metadata={doc.metadata} onChange={updateMetadata} />
          <ul className="slide-thumb-list" aria-label={`슬라이드 ${doc.slides.length}개`}>
            {doc.slides.map((slide, index) => (
              <li key={index}>
                <button
                  type="button"
                  className={`slide-thumbnail ${index === currentSlideIndex ? 'active' : ''}`}
                  aria-current={index === currentSlideIndex ? 'true' : undefined}
                  aria-label={`슬라이드 ${index + 1}, ${slide.type === 'cover' ? '표지' : '본문'}: ${slide.title || '제목 없음'}`}
                  onClick={() => setCurrentSlideIndex(index)}
                >
                  <span className="slide-thumbnail-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="slide-thumbnail-preview" aria-hidden="true">
                    <span className={`mini-slide ${slide.type}`}>
                      <span className="mini-title">{slide.title || '(No Title)'}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className="resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="사이드바 너비 조절"
          aria-valuenow={Math.round(sidebarW)}
          aria-valuemin={80}
          aria-valuemax={350}
          tabIndex={0}
          onMouseDown={e => startResize('sidebar', e)}
          onKeyDown={e => resizeByKeyboard('sidebar', e)}
        />
        <main className="pane-editor" id="editor-main" style={editorStyle} aria-label="슬라이드 편집기">
          <StyleEditor metadata={doc.metadata} onChange={updateMetadata} />
          <SlideEditor
            slide={currentSlide}
            index={currentSlideIndex}
            dims={dims}
            onChange={(slide) => updateSlide(currentSlideIndex, slide)}
          />
        </main>
        <div
          className="resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="편집기 너비 조절"
          aria-valuemin={200}
          tabIndex={0}
          onMouseDown={e => startResize('editor', e)}
          onKeyDown={e => resizeByKeyboard('editor', e)}
        />
        <section className="pane-preview" aria-label="슬라이드 미리보기">
          <SlidePreview slide={currentSlide} dims={dims} style={style} />
        </section>
      </div>
    </div>
  );
};
