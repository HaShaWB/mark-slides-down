import React, { useState } from 'react';
import type { SlideMetadata } from '../../types';
import { DIMENSION_PRESETS } from '../../types';

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
      <div className="metadata-header" onClick={() => setOpen(!open)}>
        <span className="collapse-icon">{open ? '▼' : '▶'}</span>
        <span className="metadata-title">Settings</span>
        <span className="metadata-summary">
          {metadata.width}×{metadata.height}
        </span>
      </div>
      {open && (
        <div className="metadata-body">
          <div className="editor-field">
            <label>Title</label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => onChange({ ...metadata, title: e.target.value })}
            />
          </div>
          <div className="editor-field">
            <label>Author</label>
            <input
              type="text"
              value={metadata.author}
              onChange={(e) => onChange({ ...metadata, author: e.target.value })}
            />
          </div>
          <div className="editor-field">
            <label>Theme</label>
            <input
              type="text"
              value={metadata.theme}
              onChange={(e) => onChange({ ...metadata, theme: e.target.value })}
            />
          </div>

          <div className="metadata-divider" />

          <div className="editor-field">
            <label>Slide Size</label>
            <select
              value={currentPreset ? String(DIMENSION_PRESETS.indexOf(currentPreset)) : 'custom'}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {DIMENSION_PRESETS.map((p, i) => (
                <option key={i} value={String(i)}>{p.label}</option>
              ))}
              {!currentPreset && <option value="custom">Custom ({metadata.width}×{metadata.height})</option>}
            </select>
          </div>
          <div className="element-row">
            <div className="element-field" style={{ flex: 1 }}>
              <label>Width (px)</label>
              <input
                type="number" min={320} max={7680}
                value={metadata.width}
                onChange={(e) => onChange({ ...metadata, width: parseInt(e.target.value) || 1920 })}
              />
            </div>
            <div className="element-field" style={{ flex: 1 }}>
              <label>Height (px)</label>
              <input
                type="number" min={240} max={4320}
                value={metadata.height}
                onChange={(e) => onChange({ ...metadata, height: parseInt(e.target.value) || 1080 })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
