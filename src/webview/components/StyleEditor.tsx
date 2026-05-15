import React, { useState } from 'react';
import type { SlideStyle, LayoutStyle, SlideMetadata } from '../../types';
import { createDefaultStyle } from '../../types';
import { THEME_PRESETS } from '../../themes';
import { Field, Disclosure } from './a11y';

interface StyleEditorProps {
  metadata: SlideMetadata;
  onChange: (metadata: SlideMetadata) => void;
}

const FONT_PRESETS = [
  "'Segoe UI', 'Noto Sans KR', sans-serif",
  "'Arial', 'Noto Sans KR', sans-serif",
  "'Helvetica Neue', 'Noto Sans KR', sans-serif",
  "'Georgia', 'Noto Serif KR', serif",
  "'Times New Roman', 'Noto Serif KR', serif",
  "'Nanum Gothic', sans-serif",
  "'Malgun Gothic', sans-serif",
];

const CODE_FONT_PRESETS = [
  "'Consolas', 'D2Coding', monospace",
  "'Fira Code', 'D2Coding', monospace",
  "'JetBrains Mono', monospace",
  "'Source Code Pro', monospace",
  "'D2Coding', monospace",
];

/** color picker + hex text 두 컨트롤을 하나의 그룹으로 묶어 레이블링 */
const ColorField: React.FC<{
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}> = ({ label, value, disabled, onChange, style }) => (
  <div className="element-field" style={style} role="group" aria-label={label}>
    <label aria-hidden="true">{label}</label>
    <div className="color-input-row">
      <input
        type="color"
        className="color-swatch"
        value={value}
        disabled={disabled}
        aria-label={`${label} 색상 선택기`}
        onChange={e => onChange(e.target.value)}
      />
      <input
        type="text"
        value={value}
        disabled={disabled}
        aria-label={`${label} 색상 코드`}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);

export const StyleEditor: React.FC<StyleEditorProps> = ({ metadata, onChange }) => {
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const defStyle = createDefaultStyle();
  const style: SlideStyle = {
    ...defStyle,
    ...(metadata.style || {}),
    cover: { ...defStyle.cover, ...(metadata.style?.cover || {}) },
    body: { ...defStyle.body, ...(metadata.style?.body || {}) },
  };

  const update = (partial: Partial<SlideStyle>) => {
    onChange({ ...metadata, style: { ...style, ...partial } });
  };

  const updateLayout = (which: 'cover' | 'body', partial: Partial<LayoutStyle>) => {
    onChange({ ...metadata, style: { ...style, [which]: { ...style[which], ...partial } } });
  };

  const toggle = (section: string) =>
    setOpenSection(openSection === section ? null : section);

  const renderLayoutSection = (which: 'cover' | 'body', layout: LayoutStyle) => (
    <>
      <div className="element-row">
        <Field label="Title Size (px)" className="element-field" style={{ flex: 1 }}>
          <input type="number" min={12} max={200} value={layout.titleSize}
            onChange={e => updateLayout(which, { titleSize: parseInt(e.target.value) || 48 })} />
        </Field>
        <Field label="Content Size (px)" className="element-field" style={{ flex: 1 }}>
          <input type="number" min={12} max={120} value={layout.contentSize}
            onChange={e => updateLayout(which, { contentSize: parseInt(e.target.value) || 28 })} />
        </Field>
      </div>
      <div className="element-row">
        <Field label="Align" className="element-field" style={{ flex: 1 }}>
          <select value={layout.align}
            onChange={e => updateLayout(which, { align: e.target.value as any })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
        <Field label="V-Align" className="element-field" style={{ flex: 1 }}>
          <select value={layout.verticalAlign}
            onChange={e => updateLayout(which, { verticalAlign: e.target.value as any })}>
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </Field>
      </div>
      <div className="style-hint">Padding (px)</div>
      <div className="element-row">
        <Field label="Top" className="element-field quad">
          <input type="number" min={0} max={500} value={layout.paddingTop}
            onChange={e => updateLayout(which, { paddingTop: parseInt(e.target.value) || 0 })} />
        </Field>
        <Field label="Right" className="element-field quad">
          <input type="number" min={0} max={500} value={layout.paddingRight}
            onChange={e => updateLayout(which, { paddingRight: parseInt(e.target.value) || 0 })} />
        </Field>
        <Field label="Bottom" className="element-field quad">
          <input type="number" min={0} max={500} value={layout.paddingBottom}
            onChange={e => updateLayout(which, { paddingBottom: parseInt(e.target.value) || 0 })} />
        </Field>
        <Field label="Left" className="element-field quad">
          <input type="number" min={0} max={500} value={layout.paddingLeft}
            onChange={e => updateLayout(which, { paddingLeft: parseInt(e.target.value) || 0 })} />
        </Field>
      </div>
    </>
  );

  const sectionPanel = (id: string) => `style-section-${id}`;

  return (
    <div className="style-editor-wrapper">
      <Disclosure
        open={open}
        onToggle={() => setOpen(!open)}
        className="style-editor-toggle"
        panelId="style-editor-panel"
        ariaLabel={`슬라이드 스타일 ${open ? '접기' : '펼치기'}`}
      >
        <span className="collapse-icon" aria-hidden="true">{open ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 600 }}>Slide Style</span>
        <span className="metadata-summary">{style.fontFamily.split(',')[0].replace(/'/g, '')}</span>
      </Disclosure>
      {open && (
        <div className="style-editor" id="style-editor-panel">
          {/* Theme Presets */}
          <Field label="Theme Preset" className="element-field" style={{ marginBottom: 8 }}>
            <select
              value="__none"
              onChange={e => {
                const preset = THEME_PRESETS.find(t => t.id === e.target.value);
                if (preset) {
                  onChange({ ...metadata, style: { ...preset.style } });
                }
              }}
            >
              <option value="__none" disabled>Apply a theme...</option>
              {THEME_PRESETS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>

          {/* Typography */}
          <div className="style-section">
            <Disclosure
              open={openSection === 'typo'}
              onToggle={() => toggle('typo')}
              className="style-section-header"
              panelId={sectionPanel('typo')}
            >
              <span className="collapse-icon" aria-hidden="true">{openSection === 'typo' ? '▼' : '▶'}</span>
              Typography
            </Disclosure>
            {openSection === 'typo' && (
              <div className="style-section-body" id={sectionPanel('typo')}>
                <div className="element-field" role="group" aria-label="Font Family">
                  <label aria-hidden="true">Font Family</label>
                  <select aria-label="Font Family 프리셋"
                    value={FONT_PRESETS.includes(style.fontFamily) ? style.fontFamily : '__custom'}
                    onChange={e => { if (e.target.value !== '__custom') update({ fontFamily: e.target.value }); }}>
                    {FONT_PRESETS.map(f => (
                      <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>
                    ))}
                    {!FONT_PRESETS.includes(style.fontFamily) && (
                      <option value="__custom">Custom</option>
                    )}
                  </select>
                  <input type="text" value={style.fontFamily} style={{ marginTop: 4 }}
                    aria-label="Font Family 직접 입력"
                    onChange={e => update({ fontFamily: e.target.value })} />
                </div>
                <div className="element-field" role="group" aria-label="Code Font Family">
                  <label aria-hidden="true">Code Font Family</label>
                  <select aria-label="Code Font Family 프리셋"
                    value={CODE_FONT_PRESETS.includes(style.codeFontFamily) ? style.codeFontFamily : '__custom'}
                    onChange={e => { if (e.target.value !== '__custom') update({ codeFontFamily: e.target.value }); }}>
                    {CODE_FONT_PRESETS.map(f => (
                      <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>
                    ))}
                    {!CODE_FONT_PRESETS.includes(style.codeFontFamily) && (
                      <option value="__custom">Custom</option>
                    )}
                  </select>
                  <input type="text" value={style.codeFontFamily} style={{ marginTop: 4 }}
                    aria-label="Code Font Family 직접 입력"
                    onChange={e => update({ codeFontFamily: e.target.value })} />
                </div>
                <div className="style-hint">Heading Sizes (px, in reference resolution)</div>
                <div className="element-row">
                  <Field label="H1" className="element-field" style={{ flex: 1 }}>
                    <input type="number" min={12} max={200} value={style.h1Size}
                      onChange={e => update({ h1Size: parseInt(e.target.value) || 48 })} />
                  </Field>
                  <Field label="H2" className="element-field" style={{ flex: 1 }}>
                    <input type="number" min={12} max={200} value={style.h2Size}
                      onChange={e => update({ h2Size: parseInt(e.target.value) || 36 })} />
                  </Field>
                  <Field label="H3" className="element-field" style={{ flex: 1 }}>
                    <input type="number" min={12} max={200} value={style.h3Size}
                      onChange={e => update({ h3Size: parseInt(e.target.value) || 28 })} />
                  </Field>
                  <Field label="H4" className="element-field" style={{ flex: 1 }}>
                    <input type="number" min={12} max={200} value={style.h4Size}
                      onChange={e => update({ h4Size: parseInt(e.target.value) || 24 })} />
                  </Field>
                </div>
                <div className="element-row">
                  <Field label="Code Size (px)" className="element-field" style={{ flex: 1 }}>
                    <input type="number" min={10} max={60} value={style.codeFontSize}
                      onChange={e => update({ codeFontSize: parseInt(e.target.value) || 22 })} />
                  </Field>
                  <Field label="Line Height" className="element-field" style={{ flex: 1 }}>
                    <input type="number" min={1} max={3} step={0.1} value={style.lineHeight}
                      onChange={e => update({ lineHeight: parseFloat(e.target.value) || 1.7 })} />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="style-section">
            <Disclosure
              open={openSection === 'colors'}
              onToggle={() => toggle('colors')}
              className="style-section-header"
              panelId={sectionPanel('colors')}
            >
              <span className="collapse-icon" aria-hidden="true">{openSection === 'colors' ? '▼' : '▶'}</span>
              Colors
            </Disclosure>
            {openSection === 'colors' && (
              <div className="style-section-body" id={sectionPanel('colors')}>
                <div className="element-row">
                  <ColorField label="Text" value={style.color} style={{ flex: 1 }}
                    onChange={v => update({ color: v })} />
                  <ColorField label="Background" value={style.backgroundColor} style={{ flex: 1 }}
                    onChange={v => update({ backgroundColor: v })} />
                </div>
              </div>
            )}
          </div>

          {/* Cover Layout */}
          <div className="style-section">
            <Disclosure
              open={openSection === 'cover'}
              onToggle={() => toggle('cover')}
              className="style-section-header"
              panelId={sectionPanel('cover')}
            >
              <span className="collapse-icon" aria-hidden="true">{openSection === 'cover' ? '▼' : '▶'}</span>
              Cover Layout
            </Disclosure>
            {openSection === 'cover' && (
              <div className="style-section-body" id={sectionPanel('cover')}>
                {renderLayoutSection('cover', style.cover)}
              </div>
            )}
          </div>

          {/* Body Layout */}
          <div className="style-section">
            <Disclosure
              open={openSection === 'body'}
              onToggle={() => toggle('body')}
              className="style-section-header"
              panelId={sectionPanel('body')}
            >
              <span className="collapse-icon" aria-hidden="true">{openSection === 'body' ? '▼' : '▶'}</span>
              Body Layout
            </Disclosure>
            {openSection === 'body' && (
              <div className="style-section-body" id={sectionPanel('body')}>
                {renderLayoutSection('body', style.body)}
                <div className="style-hint" style={{ marginTop: 8 }}>Title Separator</div>
                <div className="element-row">
                  <Field label="Show" className="element-field" style={{ flex: 0, minWidth: 'auto' }}>
                    <input type="checkbox"
                      checked={style.bodySeparatorShow !== false}
                      onChange={e => update({ bodySeparatorShow: e.target.checked })}
                      style={{ width: 'auto', margin: '4px 0' }} />
                  </Field>
                  <ColorField label="Color" value={style.bodySeparatorColor || '#007acc'}
                    disabled={style.bodySeparatorShow === false} style={{ flex: 1 }}
                    onChange={v => update({ bodySeparatorColor: v })} />
                </div>
              </div>
            )}
          </div>

          <button className="toolbar-btn small" style={{ marginTop: 8, width: '100%' }}
            onClick={() => onChange({ ...metadata, style: createDefaultStyle() })}>
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
};
