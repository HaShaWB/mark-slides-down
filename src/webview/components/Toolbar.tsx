import React from 'react';

interface ToolbarProps {
  slideCount: number;
  currentIndex: number;
  onAddSlide: () => void;
  onDeleteSlide: () => void;
  onDuplicateSlide: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onImportMarkdown: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  slideCount,
  currentIndex,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveUp,
  onMoveDown,
  onImportMarkdown,
  onExportHtml,
  onExportPdf,
}) => {
  return (
    <div className="toolbar" role="toolbar" aria-label="슬라이드 도구 모음">
      <div className="toolbar-left" role="group" aria-label="슬라이드 작업">
        <button className="toolbar-btn accent" onClick={onImportMarkdown} title="Import Markdown File" aria-label="마크다운 파일 가져오기">
          Import .md
        </button>
        <div className="toolbar-separator" role="presentation" />
        <button className="toolbar-btn" onClick={onAddSlide} title="Add Slide" aria-label="슬라이드 추가">
          + Slide
        </button>
        <button className="toolbar-btn" onClick={onDuplicateSlide} title="Duplicate Slide" aria-label="슬라이드 복제">
          Duplicate
        </button>
        <button
          className="toolbar-btn danger"
          onClick={onDeleteSlide}
          disabled={slideCount <= 1}
          title="Delete Slide"
          aria-label="슬라이드 삭제"
        >
          Delete
        </button>
        <div className="toolbar-separator" role="presentation" />
        <button
          className="toolbar-btn"
          onClick={onMoveUp}
          disabled={currentIndex === 0}
          title="Move Up"
          aria-label="슬라이드를 앞으로 이동"
        >
          <span aria-hidden="true">▲</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={onMoveDown}
          disabled={currentIndex >= slideCount - 1}
          title="Move Down"
          aria-label="슬라이드를 뒤로 이동"
        >
          <span aria-hidden="true">▼</span>
        </button>
        <span className="slide-counter" role="status" aria-live="polite">
          {currentIndex + 1} / {slideCount}
          <span className="sr-only"> 번째 슬라이드 (전체 {slideCount}개)</span>
        </span>
      </div>
      <div className="toolbar-right" role="group" aria-label="내보내기">
        <button className="toolbar-btn" onClick={onExportHtml} title="Export as standalone HTML slideshow" aria-label="HTML 슬라이드쇼로 내보내기">
          Export HTML
        </button>
        <button className="toolbar-btn accent" onClick={onExportPdf} title="Export as PDF (requires Chrome or Edge)" aria-label="PDF로 내보내기 (Chrome 또는 Edge 필요)">
          Export PDF
        </button>
      </div>
    </div>
  );
};
