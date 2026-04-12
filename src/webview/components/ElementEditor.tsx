import React, { useState } from 'react';
import type { SlideElement, ElementType, SlideDimensions } from '../../types';
import { TableEditorGui } from './TableEditorGui';
import { MarkdownEditor } from './MarkdownEditor';

interface ElementEditorProps {
  element: SlideElement;
  index: number;
  total: number;
  dims: SlideDimensions;
  onChange: (element: SlideElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const LANGUAGES = [
  'typescript', 'javascript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'kotlin', 'swift', 'ruby', 'php', 'html', 'css',
  'sql', 'bash', 'json', 'yaml', 'xml', 'markdown',
];

export const ElementEditor: React.FC<ElementEditorProps> = ({
  element,
  index,
  total,
  dims,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const updateMeta = (key: string, value: string) => {
    onChange({ ...element, meta: { ...element.meta, [key]: value } });
  };

  return (
    <div className={`element-editor ${collapsed ? 'collapsed' : ''}`}>
      <div className="element-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="element-header-left">
          <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
          <span className="element-badge" data-type={element.type}>
            {element.type}
          </span>
          <span className="element-index">#{index + 1}</span>
        </div>
        <div className="element-header-right" onClick={(e) => e.stopPropagation()}>
          <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="Move Up">
            ▲
          </button>
          <button className="icon-btn" onClick={onMoveDown} disabled={index >= total - 1} title="Move Down">
            ▼
          </button>
          <button className="icon-btn" onClick={onDuplicate} title="Duplicate">
            ⧉
          </button>
          <button className="icon-btn danger" onClick={onDelete} title="Delete">
            ×
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="element-body">
          <div className="element-row">
            <div className="element-field narrow">
              <label>Type</label>
              <select
                value={element.type}
                onChange={(e) =>
                  onChange({ ...element, type: e.target.value as ElementType })
                }
              >
                <option value="text">Text</option>
                <option value="markdown">Markdown</option>
                <option value="code">Code</option>
                <option value="diagram">Diagram</option>
                <option value="image">Image</option>
                <option value="table">Table</option>
                <option value="latex">LaTeX</option>
              </select>
            </div>
            {element.type === 'code' && (
              <div className="element-field narrow">
                <label>Language</label>
                <select
                  value={element.meta?.language || 'typescript'}
                  onChange={(e) => updateMeta('language', e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
            {element.type === 'image' && (
              <div className="element-field">
                <label>Alt Text</label>
                <input
                  type="text"
                  value={element.meta?.alt || ''}
                  onChange={(e) => updateMeta('alt', e.target.value)}
                  placeholder="Image description..."
                />
              </div>
            )}
          </div>

          <div className="element-row">
            <div className="element-field quad">
              <label>X (px)</label>
              <input
                type="number" min={0} max={dims.width}
                value={element.pos[0]}
                onChange={(e) =>
                  onChange({ ...element, pos: [parseInt(e.target.value) || 0, element.pos[1]] })
                }
              />
            </div>
            <div className="element-field quad">
              <label>Y (px)</label>
              <input
                type="number" min={0} max={dims.height}
                value={element.pos[1]}
                onChange={(e) =>
                  onChange({ ...element, pos: [element.pos[0], parseInt(e.target.value) || 0] })
                }
              />
            </div>
            <div className="element-field quad">
              <label>Scale</label>
              <input
                type="number" min={0.1} max={5} step={0.1}
                value={element.scale ?? 1}
                onChange={(e) =>
                  onChange({ ...element, scale: parseFloat(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          <div className="element-size-hint">
            Slide: {dims.width}×{dims.height}px · Scale: {((element.scale ?? 1) * 100).toFixed(0)}%
          </div>

          <div className="element-field">
            <label>{getDataLabel(element.type)}</label>
            {element.type === 'table' ? (
              <TableEditorGui
                data={element.data}
                onChange={(newData) => onChange({ ...element, data: newData })}
                colWidths={parseColWidths(element.meta?.colWidths)}
                onColWidthsChange={(widths) =>
                  onChange({ ...element, meta: { ...element.meta, colWidths: widths.map(Math.round).join(',') } })
                }
              />
            ) : element.type === 'image' ? (
              <input
                type="text"
                value={element.data}
                onChange={(e) => onChange({ ...element, data: e.target.value })}
                placeholder="Image URL or path..."
              />
            ) : element.type === 'markdown' || element.type === 'text' ? (
              // 마크다운/텍스트: 풀 마크다운 편집 지원
              <MarkdownEditor
                value={element.data}
                onChange={(val) => onChange({ ...element, data: val })}
                placeholder={getPlaceholder(element.type)}
                rows={element.type === 'markdown' ? 6 : 4}
                enableMarkdown={element.type === 'markdown'}
              />
            ) : (
              // 코드/다이어그램/LaTeX: Tab 들여쓰기만 지원 (마크다운 하이라이팅 없음)
              <MarkdownEditor
                value={element.data}
                onChange={(val) => onChange({ ...element, data: val })}
                placeholder={getPlaceholder(element.type)}
                rows={element.type === 'code' ? 8 : element.type === 'latex' ? 6 : 4}
                className={element.type === 'code' || element.type === 'latex' ? 'code-textarea' : ''}
                enableMarkdown={false}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function getDataLabel(type: ElementType): string {
  switch (type) {
    case 'text': return 'Text Content';
    case 'markdown': return 'Markdown Content';
    case 'code': return 'Source Code';
    case 'diagram': return 'Diagram (Mermaid)';
    case 'image': return 'Image URL';
    case 'table': return 'Table';
    case 'latex': return 'LaTeX (KaTeX)';
  }
}

function getPlaceholder(type: ElementType): string {
  switch (type) {
    case 'text': return 'Plain text content...';
    case 'markdown': return '**Bold**, *italic*, `code`, - list item...';
    case 'code': return 'function hello() {\n  console.log("Hello!");\n}';
    case 'diagram': return 'graph TD\n  A[Start] --> B[End]';
    case 'image': return 'https://example.com/image.png';
    case 'table': return '| Col1 | Col2 |\n|------|------|\n| A    | B    |';
    case 'latex': return '\\int_0^1 x^2\\,dx = \\frac{1}{3}';
  }
}

function parseColWidths(raw?: string): number[] | undefined {
  if (!raw) return undefined;
  const nums = raw.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
  return nums.length > 0 ? nums : undefined;
}
