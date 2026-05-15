import React, { useCallback } from 'react';
import type { Slide, SlideElement, ElementType, SlideDimensions } from '../../types';
import { createDefaultElement } from '../../types';
import { ElementEditor } from './ElementEditor';
import { MarkdownEditor } from './MarkdownEditor';
import { Field } from './a11y';

interface SlideEditorProps {
  slide: Slide;
  index: number;
  dims: SlideDimensions;
  onChange: (slide: Slide) => void;
}

const ELEMENT_TYPES: { value: ElementType; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Text' },
  { value: 'code', label: 'Code' },
  { value: 'latex', label: 'LaTeX' },
  { value: 'image', label: 'Image' },
  { value: 'table', label: 'Table' },
  { value: 'diagram', label: 'Diagram' },
];

export const SlideEditor: React.FC<SlideEditorProps> = ({ slide, dims, onChange }) => {
  const updateField = useCallback(
    <K extends keyof Slide>(field: K, value: Slide[K]) => {
      onChange({ ...slide, [field]: value });
    },
    [slide, onChange]
  );

  const addElement = useCallback((type: ElementType) => {
    onChange({ ...slide, elements: [...slide.elements, createDefaultElement(type, dims)] });
  }, [slide, dims, onChange]);

  const updateElement = useCallback(
    (idx: number, element: SlideElement) => {
      const newElements = [...slide.elements];
      newElements[idx] = element;
      onChange({ ...slide, elements: newElements });
    },
    [slide, onChange]
  );

  const deleteElement = useCallback(
    (idx: number) => {
      onChange({ ...slide, elements: slide.elements.filter((_, i) => i !== idx) });
    },
    [slide, onChange]
  );

  const duplicateElement = useCallback(
    (idx: number) => {
      const clone: SlideElement = JSON.parse(JSON.stringify(slide.elements[idx]));
      clone.pos = [clone.pos[0] + 20, clone.pos[1] + 20];
      const newElements = [...slide.elements];
      newElements.splice(idx + 1, 0, clone);
      onChange({ ...slide, elements: newElements });
    },
    [slide, onChange]
  );

  const moveElement = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= slide.elements.length) return;
      const newElements = [...slide.elements];
      const [moved] = newElements.splice(from, 1);
      newElements.splice(to, 0, moved);
      onChange({ ...slide, elements: newElements });
    },
    [slide, onChange]
  );

  return (
    <div className="slide-editor">
      <section className="editor-section" aria-label="슬라이드 기본 속성">
        <Field label="Type">
          <select
            value={slide.type}
            onChange={(e) => updateField('type', e.target.value as 'cover' | 'body')}
          >
            <option value="cover">Cover</option>
            <option value="body">Body</option>
          </select>
        </Field>

        <Field label="Title (Markdown)">
          <input
            type="text"
            value={slide.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Slide title..."
          />
        </Field>

        <div className="editor-field">
          <label htmlFor="slide-content-editor">Content (Markdown)</label>
          <MarkdownEditor
            value={slide.content}
            onChange={(val) => updateField('content', val)}
            placeholder="Slide content in Markdown..."
            rows={8}
            ariaLabel="슬라이드 본문 (마크다운)"
          />
        </div>
      </section>

      <section className="editor-section" aria-label={`요소 ${slide.elements.length}개`}>
        <div className="section-header">
          <h3>Elements ({slide.elements.length})</h3>
          <div className="add-element-group" role="group" aria-label="요소 추가">
            {ELEMENT_TYPES.map((t) => (
              <button
                key={t.value}
                className="toolbar-btn small"
                onClick={() => addElement(t.value)}
                title={`Add ${t.label}`}
                aria-label={`${t.label} 요소 추가`}
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>
        {slide.elements.map((element, idx) => (
          <ElementEditor
            key={idx}
            element={element}
            index={idx}
            total={slide.elements.length}
            dims={dims}
            onChange={(el) => updateElement(idx, el)}
            onDelete={() => deleteElement(idx)}
            onDuplicate={() => duplicateElement(idx)}
            onMoveUp={() => moveElement(idx, idx - 1)}
            onMoveDown={() => moveElement(idx, idx + 1)}
          />
        ))}
        {slide.elements.length === 0 && (
          <div className="empty-state">No elements yet. Add one above.</div>
        )}
      </section>
    </div>
  );
};
