import React, { useState, useId } from 'react';
import type { SlideElement, ElementType, SlideDimensions } from '../../types';
import { TableEditorGui } from './TableEditorGui';
import { MarkdownEditor } from './MarkdownEditor';
import { Field } from './a11y';

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
  const panelId = useId();
  const label = `${element.type} 요소 #${index + 1}`;

  const updateMeta = (key: string, value: string) => {
    onChange({ ...element, meta: { ...element.meta, [key]: value } });
  };

  return (
    <div className={`element-editor ${collapsed ? 'collapsed' : ''}`}>
      <div className="element-header">
        <button
          type="button"
          className="disclosure-btn element-header-left"
          aria-expanded={!collapsed}
          aria-controls={panelId}
          aria-label={`${label} ${collapsed ? '펼치기' : '접기'}`}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="collapse-icon" aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
          <span className="element-badge" data-type={element.type}>
            {element.type}
          </span>
          <span className="element-index">#{index + 1}</span>
        </button>
        <div className="element-header-right" role="group" aria-label={`${label} 동작`}>
          <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="Move Up" aria-label={`${label} 위로 이동`}>
            <span aria-hidden="true">▲</span>
          </button>
          <button className="icon-btn" onClick={onMoveDown} disabled={index >= total - 1} title="Move Down" aria-label={`${label} 아래로 이동`}>
            <span aria-hidden="true">▼</span>
          </button>
          <button className="icon-btn" onClick={onDuplicate} title="Duplicate" aria-label={`${label} 복제`}>
            <span aria-hidden="true">⧉</span>
          </button>
          <button className="icon-btn danger" onClick={onDelete} title="Delete" aria-label={`${label} 삭제`}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="element-body" id={panelId}>
          <div className="element-row">
            <Field label="Type" className="element-field narrow">
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
            </Field>
            {element.type === 'code' && (
              <Field label="Language" className="element-field narrow">
                <select
                  value={element.meta?.language || 'typescript'}
                  onChange={(e) => updateMeta('language', e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Field>
            )}
            {element.type === 'image' && (
              <Field label="Alt Text" className="element-field">
                <input
                  type="text"
                  value={element.meta?.alt || ''}
                  onChange={(e) => updateMeta('alt', e.target.value)}
                  placeholder="Image description..."
                />
              </Field>
            )}
          </div>

          <div className="element-row">
            <Field label="X (px)" className="element-field quad">
              <input
                type="number" min={0} max={dims.width}
                value={element.pos[0]}
                onChange={(e) =>
                  onChange({ ...element, pos: [parseInt(e.target.value) || 0, element.pos[1]] })
                }
              />
            </Field>
            <Field label="Y (px)" className="element-field quad">
              <input
                type="number" min={0} max={dims.height}
                value={element.pos[1]}
                onChange={(e) =>
                  onChange({ ...element, pos: [element.pos[0], parseInt(e.target.value) || 0] })
                }
              />
            </Field>
            <Field label="Scale" className="element-field quad">
              <input
                type="number" min={0.1} max={5} step={0.1}
                value={element.scale ?? 1}
                onChange={(e) =>
                  onChange({ ...element, scale: parseFloat(e.target.value) || 1 })
                }
              />
            </Field>
          </div>
          <div className="element-size-hint">
            Slide: {dims.width}×{dims.height}px · Scale: {((element.scale ?? 1) * 100).toFixed(0)}%
          </div>

          <div className="element-field">
            {element.type === 'table' ? (
              <>
                <label id={`${panelId}-data-lbl`}>{getDataLabel(element.type)}</label>
                <div role="group" aria-labelledby={`${panelId}-data-lbl`}>
                  <TableEditorGui
                    data={element.data}
                    onChange={(newData) => onChange({ ...element, data: newData })}
                    colWidths={parseColWidths(element.meta?.colWidths)}
                    onColWidthsChange={(widths) =>
                      onChange({ ...element, meta: { ...element.meta, colWidths: widths.map(Math.round).join(',') } })
                    }
                  />
                </div>
              </>
            ) : element.type === 'image' ? (
              <>
                <label htmlFor={`${panelId}-data`}>{getDataLabel(element.type)}</label>
                <input
                  id={`${panelId}-data`}
                  type="text"
                  value={element.data}
                  onChange={(e) => onChange({ ...element, data: e.target.value })}
                  placeholder="Image URL or path..."
                />
              </>
            ) : element.type === 'markdown' || element.type === 'text' ? (
              <>
                <label htmlFor={`${panelId}-data`}>{getDataLabel(element.type)}</label>
                <MarkdownEditor
                  value={element.data}
                  onChange={(val) => onChange({ ...element, data: val })}
                  placeholder={getPlaceholder(element.type)}
                  rows={element.type === 'markdown' ? 6 : 4}
                  enableMarkdown={element.type === 'markdown'}
                  ariaLabel={getDataLabel(element.type)}
                />
              </>
            ) : (
              <>
                <label htmlFor={`${panelId}-data`}>{getDataLabel(element.type)}</label>
                <MarkdownEditor
                  value={element.data}
                  onChange={(val) => onChange({ ...element, data: val })}
                  placeholder={getPlaceholder(element.type)}
                  rows={element.type === 'code' ? 8 : element.type === 'latex' ? 6 : 4}
                  className={element.type === 'code' || element.type === 'latex' ? 'code-textarea' : ''}
                  enableMarkdown={false}
                  ariaLabel={getDataLabel(element.type)}
                />
              </>
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
