import React, { useState } from 'react';
import type { SlideStyle, LayoutStyle, SlideMetadata } from '../../types';
import { createDefaultStyle } from '../../types';
import { THEME_PRESETS } from '../../themes';

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
        <div className="element-field" style={{ flex: 1 }}>
          <label>Title Size (px)</label>
          <input type="number" min={12} max={200} value={layout.titleSize}
            onChange={e => updateLayout(which, { titleSize: parseInt(e.target.value) || 48 })} />
        </div>
        <div className="element-field" style={{ flex: 1 }}>
          <label>Content Size (px)</label>
          <input type="number" min={12} max={120} value={layout.contentSize}
            onChange={e => updateLayout(which, { contentSize: parseInt(e.target.value) || 28 })} />
        </div>
      </div>
      <div className="element-row">
        <div className="element-field" style={{ flex: 1 }}>
          <label>Align</label>
          <select value={layout.align}
            onChange={e => updateLayout(which, { align: e.target.value as any })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="element-field" style={{ flex: 1 }}>
          <label>V-Align</label>
          <select value={layout.verticalAlign}
            onChange={e => updateLayout(which, { verticalAlign: e.target.value as any })}>
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>
      <div className="style-hint">Padding (px)</div>
      <div className="element-row">
        <div className="element-field quad">
          <label>Top</label>
          <input type="number" min={0} max={500} value={layout.paddingTop}
            onChange={e => updateLayout(which, { paddingTop: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="element-field quad">
          <label>Right</label>
          <input type="number" min={0} max={500} value={layout.paddingRight}
            onChange={e => updateLayout(which, { paddingRight: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="element-field quad">
          <label>Bottom</label>
          <input type="number" min={0} max={500} value={layout.paddingBottom}
            onChange={e => updateLayout(which, { paddingBottom: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="element-field quad">
          <label>Left</label>
          <input type="number" min={0} max={500} value={layout.paddingLeft}
            onChange={e => updateLayout(which, { paddingLeft: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
    </>
  );

  return (
    <div className="style-editor-wrapper">
      <div className="style-editor-toggle" onClick={() => setOpen(!open)}>
        <span className="collapse-icon">{open ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 600 }}>Slide Style</span>
        <span className="metadata-summary">{style.fontFamily.split(',')[0].replace(/'/g, '')}</span>
      </div>
      {open && (
        <div className="style-editor">
          {/* Theme Presets */}
          <div className="element-field" style={{ marginBottom: 8 }}>
            <label>Theme Preset</label>
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
          </div>

          {/* Typography */}
          <div className="style-section">
            <div className="style-section-header" onClick={() => toggle('typo')}>
              <span className="collapse-icon">{openSection === 'typo' ? '▼' : '▶'}</span>
              Typography
            </div>
            {openSection === 'typo' && (
              <div className="style-section-body">
                <div className="element-field">
                  <label>Font Family</label>
                  <select value={FONT_PRESETS.includes(style.fontFamily) ? style.fontFamily : '__custom'}
                    onChange={e => { if (e.target.value !== '__custom') update({ fontFamily: e.target.value }); }}>
                    {FONT_PRESETS.map(f => (
                      <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>
                    ))}
                    {!FONT_PRESETS.includes(style.fontFamily) && (
                      <option value="__custom">Custom</option>
                    )}
                  </select>
                  <input type="text" value={style.fontFamily} style={{ marginTop: 4 }}
                    onChange={e => update({ fontFamily: e.target.value })} />
                </div>
                <div className="element-field">
                  <label>Code Font Family</label>
                  <select value={CODE_FONT_PRESETS.includes(style.codeFontFamily) ? style.codeFontFamily : '__custom'}
                    onChange={e => { if (e.target.value !== '__custom') update({ codeFontFamily: e.target.value }); }}>
                    {CODE_FONT_PRESETS.map(f => (
                      <option key={f} value={f}>{f.split(',')[0].replace(/'/g, '')}</option>
                    ))}
                    {!CODE_FONT_PRESETS.includes(style.codeFontFamily) && (
                      <option value="__custom">Custom</option>
                    )}
                  </select>
                  <input type="text" value={style.codeFontFamily} style={{ marginTop: 4 }}
                    onChange={e => update({ codeFontFamily: e.target.value })} />
                </div>
                <div className="style-hint">Heading Sizes (px, in reference resolution)</div>
                <div className="element-row">
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>H1</label>
                    <input type="number" min={12} max={200} value={style.h1Size}
                      onChange={e => update({ h1Size: parseInt(e.target.value) || 48 })} />
                  </div>
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>H2</label>
                    <input type="number" min={12} max={200} value={style.h2Size}
                      onChange={e => update({ h2Size: parseInt(e.target.value) || 36 })} />
                  </div>
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>H3</label>
                    <input type="number" min={12} max={200} value={style.h3Size}
                      onChange={e => update({ h3Size: parseInt(e.target.value) || 28 })} />
                  </div>
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>H4</label>
                    <input type="number" min={12} max={200} value={style.h4Size}
                      onChange={e => update({ h4Size: parseInt(e.target.value) || 24 })} />
                  </div>
                </div>
                <div className="element-row">
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>Code Size (px)</label>
                    <input type="number" min={10} max={60} value={style.codeFontSize}
                      onChange={e => update({ codeFontSize: parseInt(e.target.value) || 22 })} />
                  </div>
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>Line Height</label>
                    <input type="number" min={1} max={3} step={0.1} value={style.lineHeight}
                      onChange={e => update({ lineHeight: parseFloat(e.target.value) || 1.7 })} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="style-section">
            <div className="style-section-header" onClick={() => toggle('colors')}>
              <span className="collapse-icon">{openSection === 'colors' ? '▼' : '▶'}</span>
              Colors
            </div>
            {openSection === 'colors' && (
              <div className="style-section-body">
                <div className="element-row">
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>Text</label>
                    <div className="color-input-row">
                      <input type="color" className="color-swatch" value={style.color}
                        onChange={e => update({ color: e.target.value })} />
                      <input type="text" value={style.color}
                        onChange={e => update({ color: e.target.value })} />
                    </div>
                  </div>
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>Background</label>
                    <div className="color-input-row">
                      <input type="color" className="color-swatch" value={style.backgroundColor}
                        onChange={e => update({ backgroundColor: e.target.value })} />
                      <input type="text" value={style.backgroundColor}
                        onChange={e => update({ backgroundColor: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cover Layout */}
          <div className="style-section">
            <div className="style-section-header" onClick={() => toggle('cover')}>
              <span className="collapse-icon">{openSection === 'cover' ? '▼' : '▶'}</span>
              Cover Layout
            </div>
            {openSection === 'cover' && (
              <div className="style-section-body">
                {renderLayoutSection('cover', style.cover)}
              </div>
            )}
          </div>

          {/* Body Layout */}
          <div className="style-section">
            <div className="style-section-header" onClick={() => toggle('body')}>
              <span className="collapse-icon">{openSection === 'body' ? '▼' : '▶'}</span>
              Body Layout
            </div>
            {openSection === 'body' && (
              <div className="style-section-body">
                {renderLayoutSection('body', style.body)}
                <div className="style-hint" style={{ marginTop: 8 }}>Title Separator</div>
                <div className="element-row">
                  <div className="element-field" style={{ flex: 0, minWidth: 'auto' }}>
                    <label>Show</label>
                    <input type="checkbox"
                      checked={style.bodySeparatorShow !== false}
                      onChange={e => update({ bodySeparatorShow: e.target.checked })}
                      style={{ width: 'auto', margin: '4px 0' }} />
                  </div>
                  <div className="element-field" style={{ flex: 1 }}>
                    <label>Color</label>
                    <div className="color-input-row">
                      <input type="color" className="color-swatch"
                        value={style.bodySeparatorColor || '#007acc'}
                        disabled={style.bodySeparatorShow === false}
                        onChange={e => update({ bodySeparatorColor: e.target.value })} />
                      <input type="text"
                        value={style.bodySeparatorColor || '#007acc'}
                        disabled={style.bodySeparatorShow === false}
                        onChange={e => update({ bodySeparatorColor: e.target.value })} />
                    </div>
                  </div>
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
