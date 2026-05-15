import React, { useState } from 'react';
import type { SlideMetadata } from '../../types';
import { DIMENSION_PRESETS } from '../../types';
import { THEME_PRESETS } from '../../themes';
import { Field, Disclosure } from './a11y';

interface MetadataEditorProps {
  metadata: SlideMetadata;
  onChange: (metadata: SlideMetadata) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({ metadata, onChange }) => {
  const [open, setOpen] = useState(false);

  const currentPreset = DIMENSION_PRESETS.find(
    (p) => p.width === metadata.width && p.height === metadata.height
  );

  const handlePresetChange = (value: string) => {
    if (value === 'custom') return;
    const preset = DIMENSION_PRESETS[parseInt(value)];
    if (preset) {
      onChange({ ...metadata, width: preset.width, height: preset.height });
    }
  };

  return (
    <div className="metadata-editor">
      <Disclosure
        open={open}
        onToggle={() => setOpen(!open)}
        className="metadata-header"
        panelId="metadata-body"
        ariaLabel={`설정 ${open ? '접기' : '펼치기'} (현재 ${metadata.width}×${metadata.height})`}
      >
        <span className="collapse-icon" aria-hidden="true">{open ? '▼' : '▶'}</span>
        <span className="metadata-title">Settings</span>
        <span className="metadata-summary">
          {metadata.width}×{metadata.height}
        </span>
      </Disclosure>
      {open && (
        <div className="metadata-body" id="metadata-body">
          <Field label="Title">
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => onChange({ ...metadata, title: e.target.value })}
            />
          </Field>
          <Field label="Author">
            <input
              type="text"
              value={metadata.author}
              onChange={(e) => onChange({ ...metadata, author: e.target.value })}
            />
          </Field>
          <Field label="Theme">
            <select
              value={THEME_PRESETS.some(t => t.id === metadata.theme) ? metadata.theme : '__custom'}
              onChange={(e) => {
                const preset = THEME_PRESETS.find(t => t.id === e.target.value);
                if (preset) {
                  onChange({ ...metadata, theme: preset.id, style: { ...preset.style } });
                }
              }}
            >
              {THEME_PRESETS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              {!THEME_PRESETS.some(t => t.id === metadata.theme) && (
                <option value="__custom" disabled>Custom</option>
              )}
            </select>
          </Field>

          <div className="metadata-divider" role="presentation" />

          <Field label="Slide Size">
            <select
              value={currentPreset ? String(DIMENSION_PRESETS.indexOf(currentPreset)) : 'custom'}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {DIMENSION_PRESETS.map((p, i) => (
                <option key={i} value={String(i)}>{p.label}</option>
              ))}
              {!currentPreset && <option value="custom">Custom ({metadata.width}×{metadata.height})</option>}
            </select>
          </Field>
          <div className="element-row">
            <Field label="Width (px)" className="element-field" style={{ flex: 1 }}>
              <input
                type="number" min={320} max={7680}
                value={metadata.width}
                onChange={(e) => onChange({ ...metadata, width: parseInt(e.target.value) || 1920 })}
              />
            </Field>
            <Field label="Height (px)" className="element-field" style={{ flex: 1 }}>
              <input
                type="number" min={240} max={4320}
                value={metadata.height}
                onChange={(e) => onChange({ ...metadata, height: parseInt(e.target.value) || 1080 })}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
};
