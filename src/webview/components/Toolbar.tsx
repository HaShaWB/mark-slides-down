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
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn accent" onClick={onImportMarkdown} title="Import Markdown File">
          Import .md
        </button>
        <div className="toolbar-separator" />
        <button className="toolbar-btn" onClick={onAddSlide} title="Add Slide">
          + Slide
        </button>
        <button className="toolbar-btn" onClick={onDuplicateSlide} title="Duplicate Slide">
          Duplicate
        </button>
        <button
          className="toolbar-btn danger"
          onClick={onDeleteSlide}
          disabled={slideCount <= 1}
          title="Delete Slide"
        >
          Delete
        </button>
        <div className="toolbar-separator" />
        <button
          className="toolbar-btn"
          onClick={onMoveUp}
          disabled={currentIndex === 0}
          title="Move Up"
        >
          ▲
        </button>
        <button
          className="toolbar-btn"
          onClick={onMoveDown}
          disabled={currentIndex >= slideCount - 1}
          title="Move Down"
        >
          ▼
        </button>
        <span className="slide-counter">
          {currentIndex + 1} / {slideCount}
        </span>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onExportHtml} title="Export as standalone HTML slideshow">
          Export HTML
        </button>
        <button className="toolbar-btn accent" onClick={onExportPdf} title="Export as PDF (requires Chrome or Edge)">
          Export PDF
        </button>
      </div>
    </div>
  );
};
