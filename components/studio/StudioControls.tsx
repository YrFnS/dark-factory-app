// Stub studio UI components used by tabs.
// These are minimal stubs — full implementations are Phase 7.

import type { ModelInputs } from '@/lib/models';

// ===== PromptInput =====
interface PromptInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function PromptInput({
  label,
  value,
  onChange,
  placeholder = 'Describe what you want to generate...',
  rows = 4,
}: PromptInputProps): JSX.Element {
  return (
    <div className="prompt-input">
      {label && <label className="field-label">{label}</label>}
      <textarea
        className="prompt-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      <style jsx>{`
        .prompt-input { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .prompt-textarea {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          color: #e2e2e8;
          font-size: 0.85rem;
          padding: 12px;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          transition: border-color 0.2s;
        }
        .prompt-textarea:focus {
          outline: none;
          border-color: #d9ff00;
        }
        .prompt-textarea::placeholder { color: #444; }
      `}</style>
    </div>
  );
}

// ===== ModelSelector =====
interface ModelSelectorOption {
  value: string;
  label: string;
  providerColor?: string;
}

interface ModelSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ModelSelectorOption[];
}

export function ModelSelector({
  label,
  value,
  onChange,
  options,
}: ModelSelectorProps): JSX.Element {
  const selected = options.find((o) => o.value === value);
  const selectedColor = selected?.providerColor;

  return (
    <div className="model-selector">
      {label && <label className="field-label">{label}</label>}
      <div className="model-select-wrapper">
        {selectedColor && (
          <span className="provider-dot" style={{ background: selectedColor }} />
        )}
        <select
          className="model-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <style jsx>{`
        .model-selector { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .model-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .provider-dot {
          position: absolute;
          left: 10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
        }
        .model-select {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 8px 12px 8px 26px;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
        }
        .model-select:focus { outline: none; border-color: #d9ff00; }
      `}</style>
    </div>
  );
}
// ===== ReferencePicker =====
// ===== ReferencePicker =====
import { useState } from 'react';
import { getUploadHistory, saveUpload, removeUpload } from '@/lib/storage';
import type { UploadRecord } from '@/lib/storage';

interface ReferencePickerProps {
  label?: string;
  value: string | null;
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateThumbnail(dataUrl: string, size = 80): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Center-crop to square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function ReferencePicker({
  label,
  value,
  onChange,
  multiple = false,
}: ReferencePickerProps): JSX.Element {
  const [activePickerTab, setActivePickerTab] = useState<'upload' | 'history'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const thumbnail = await generateThumbnail(dataUrl);
    saveUpload({ dataUrl, thumbnail });
    if (multiple) {
      const current = value ? (Array.isArray(value) ? value : [value]) : [];
      onChange([...current, dataUrl]);
    } else {
      onChange(dataUrl);
    }
  };

  const handleHistorySelect = (record: UploadRecord) => {
    if (multiple) {
      const current = value ? (Array.isArray(value) ? value : [value]) : [];
      onChange([...current, record.dataUrl]);
    } else {
      onChange(record.dataUrl);
    }
  };

  const handleHistoryRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeUpload(id);
    // Re-render by triggering a state update trick: toggle tab
    setActivePickerTab((t) => (t === 'history' ? 'upload' : 'history'));
    setActivePickerTab('history');
  };

  const history = getUploadHistory();

  return (
    <div className="ref-picker">
      {label && <label className="field-label">{label}</label>}
      <div className="ref-tabs">
        <button
          type="button"
          className={`ref-tab ${activePickerTab === 'upload' ? 'ref-tab--active' : ''}`}
          onClick={() => setActivePickerTab('upload')}
        >
          Upload
        </button>
        <button
          type="button"
          className={`ref-tab ${activePickerTab === 'history' ? 'ref-tab--active' : ''}`}
          onClick={() => setActivePickerTab('history')}
        >
          History ({history.length})
        </button>
      </div>

      {activePickerTab === 'upload' ? (
        <div className="ref-drop-zone">
          {value && !multiple && (
            <img src={value} alt="Reference" className="ref-thumb" />
          )}
          <label className="ref-upload-btn">
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            {value ? 'Change' : 'Upload'}
          </label>
        </div>
      ) : (
        <div className="ref-history-grid">
          {history.length === 0 ? (
            <span className="ref-history-empty">No uploads yet</span>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="ref-history-item"
                onClick={() => handleHistorySelect(record)}
                title={new Date(record.timestamp).toLocaleString()}
              >
                <img src={record.thumbnail} alt="Uploaded" className="ref-history-thumb" />
                <button
                  type="button"
                  className="ref-history-remove"
                  onClick={(e) => handleHistoryRemove(e, record.id)}
                  aria-label="Remove from history"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .ref-picker { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .ref-tabs { display: flex; gap: 2px; background: #161618; border-radius: 6px; padding: 3px; }
        .ref-tab {
          flex: 1; padding: 5px 10px; background: transparent; border: none;
          color: #6b6b78; font-size: 0.7rem; font-weight: 500; cursor: pointer;
          border-radius: 4px; transition: background 0.15s, color 0.15s; font-family: inherit;
        }
        .ref-tab--active { background: #2a2a2e; color: #e2e2e8; }
        .ref-tab:hover:not(.ref-tab--active) { color: #aaa; }
        .ref-drop-zone {
          background: #161618;
          border: 1px dashed #2a2a2e;
          border-radius: 6px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px;
        }
        .ref-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; }
        .ref-upload-btn {
          font-size: 0.75rem;
          color: #d9ff00;
          cursor: pointer;
          padding: 6px 12px;
          border: 1px solid #d9ff00;
          transition: background 0.2s;
        }
        .ref-upload-btn:hover { background: rgba(217,255,0,0.1); }
        .ref-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
          gap: 6px;
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          padding: 8px;
          min-height: 80px;
        }
        .ref-history-empty { font-size: 0.7rem; color: #52525b; text-align: center; padding: 16px 0; }
        .ref-history-item {
          position: relative; cursor: pointer; border-radius: 4px; overflow: hidden;
        }
        .ref-history-item:hover .ref-history-remove { opacity: 1; }
        .ref-history-thumb { width: 56px; height: 56px; object-fit: cover; display: block; border-radius: 4px; }
        .ref-history-remove {
          position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
          background: rgba(0,0,0,0.75); border: none; border-radius: 50%;
          color: #fff; font-size: 0.8rem; line-height: 1; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.15s;
        }
        .ref-history-remove:hover { background: rgba(220,38,38,0.9); }
      `}</style>
    </div>
  );
}

// ===== StylePresets =====
interface StylePresetsProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called with modifier suffix when a preset button is clicked. */
  onPromptAppend?: (modifier: string) => void;
}

const STYLE_OPTIONS = [
  { value: 'none', label: 'None', modifier: '' },
  { value: 'photorealistic', label: 'Photorealistic', modifier: ', photorealistic, high detail, 8k' },
  { value: 'anime', label: 'Anime', modifier: ', anime style, vibrant colors' },
  { value: 'digital-art', label: 'Digital Art', modifier: ', digital art, illustration' },
  { value: 'concept-art', label: 'Concept Art', modifier: ', concept art, intricate details' },
  { value: 'cinematic', label: 'Cinematic', modifier: ', cinematic lighting, film still' },
  { value: 'noir', label: 'Film Noir', modifier: ', film noir, black and white, high contrast' },
  { value: 'vintage', label: 'Vintage', modifier: ', vintage photography, faded colors' },
];

export function StylePresets({ label, value, onChange, onPromptAppend }: StylePresetsProps): JSX.Element {
  const handleClick = (opt: typeof STYLE_OPTIONS[number]) => {
    onChange(opt.value);
    if (opt.modifier && onPromptAppend) {
      onPromptAppend(opt.modifier);
    }
  };

  return (
    <div className="style-presets">
      {label && <label className="field-label">{label}</label>}
      <div className="preset-grid">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`preset-btn ${value === opt.value ? 'preset-btn--active' : ''}`}
            onClick={() => handleClick(opt)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <style jsx>{`
        .style-presets { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .preset-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .preset-btn {
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid #2a2a2e;
          background: #161618;
          color: #888;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .preset-btn:hover { border-color: #d9ff00; color: #ccc; }
        .preset-btn--active { border-color: #d9ff00; background: rgba(217,255,0,0.12); color: #d9ff00; }
      `}</style>
    </div>
  );
}

// ===== SmartControls =====
// Renders dynamic controls based on the selected model's inputs.
interface SmartControlsProps {
  seed: number | null;
  onSeedChange: (seed: number | null) => void;
  /** Steps from the parent — defaults to model input default or 30. */
  steps?: number;
  onStepsChange?: (steps: number) => void;
  /** Guidance from the parent — defaults to model input default or 7.5. */
  guidance?: number;
  onGuidanceChange?: (guidance: number) => void;
  /** Aspect ratio selected by the user (from parent state). */
  aspectRatio?: string;
  onAspectRatioChange?: (ratio: string) => void;
  /** Width selected by the user (from parent state). */
  width?: number;
  onWidthChange?: (w: number) => void;
  /** Height selected by the user (from parent state). */
  height?: number;
  onHeightChange?: (h: number) => void;
  /** Quality selected by the user (from parent state). */
  quality?: string;
  onQualityChange?: (q: string) => void;
  /** Model-specific input schema. */
  modelInputs?: ModelInputs;
}

export function SmartControls({
  seed,
  onSeedChange,
  steps,
  onStepsChange,
  guidance,
  onGuidanceChange,
  aspectRatio,
  onAspectRatioChange,
  width,
  onWidthChange,
  height,
  onHeightChange,
  quality,
  onQualityChange,
  modelInputs,
}: SmartControlsProps): JSX.Element {
  const handleSeedInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onSeedChange(v === '' ? null : parseInt(v, 10));
  };

  // Resolve effective steps/guidance from model defaults if not controlled by parent
  const effectiveSteps = steps ?? modelInputs?.steps?.default ?? 30;
  const effectiveGuidance = guidance ?? modelInputs?.guidance?.default ?? 7.5;

  return (
    <div className="smart-controls">
      {/* Seed — always shown */}
      <div className="control-row">
        <label className="field-label">Seed</label>
        <input
          type="number"
          className="control-input"
          value={seed ?? ''}
          onChange={handleSeedInput}
          placeholder="Random"
        />
        <button type="button" className="random-btn" onClick={() => onSeedChange(Math.floor(Math.random() * 999999))}>
          Random
        </button>
      </div>

      {/* Aspect ratio buttons — shown when model uses aspectRatios */}
      {modelInputs?.aspectRatios && onAspectRatioChange && (
        <div className="control-row">
          <label className="field-label">Ratio</label>
          <div className="ratio-buttons">
            {modelInputs.aspectRatios.map((r) => (
              <button
                key={r}
                type="button"
                className={`ratio-btn ${aspectRatio === r ? 'ratio-btn--active' : ''}`}
                onClick={() => onAspectRatioChange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Width / Height — shown when NO aspectRatios but w/h defined */}
      {!modelInputs?.aspectRatios && modelInputs?.width && modelInputs?.height && (
        <div className="control-row">
          <label className="field-label">Size</label>
          <input
            type="number"
            className="control-input small"
            value={width ?? modelInputs.width}
            onChange={(e) => onWidthChange?.(parseInt(e.target.value, 10))}
            min={128}
            max={2048}
          />
          <span className="field-label" style={{ minWidth: 'auto' }}>×</span>
          <input
            type="number"
            className="control-input small"
            value={height ?? modelInputs.height}
            onChange={(e) => onHeightChange?.(parseInt(e.target.value, 10))}
            min={128}
            max={2048}
          />
        </div>
      )}

      {/* Quality dropdown — shown when defined */}
      {modelInputs?.quality && onQualityChange && (
        <div className="control-row">
          <label className="field-label">Quality</label>
          <select
            className="control-select"
            value={quality ?? modelInputs.quality[0]}
            onChange={(e) => onQualityChange(e.target.value)}
          >
            {modelInputs.quality.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      )}

      {/* Steps slider — shown when model defines steps or when controlled */}
      {(modelInputs?.steps || onStepsChange) && (
        <div className="control-row">
          <label className="field-label">Steps</label>
          <input
            type="range"
            min={modelInputs?.steps?.min ?? 1}
            max={modelInputs?.steps?.max ?? 100}
            step={1}
            value={effectiveSteps}
            onChange={(e) => onStepsChange?.(parseInt(e.target.value, 10))}
            className="control-slider"
          />
          <span className="control-value">{effectiveSteps}</span>
        </div>
      )}

      {/* Guidance slider — shown when model defines guidance or when controlled */}
      {(modelInputs?.guidance || onGuidanceChange) && (
        <div className="control-row">
          <label className="field-label">Guidance</label>
          <input
            type="range"
            min={modelInputs?.guidance?.min ?? 1}
            max={modelInputs?.guidance?.max ?? 20}
            step={0.5}
            value={effectiveGuidance}
            onChange={(e) => onGuidanceChange?.(parseFloat(e.target.value))}
            className="control-slider"
          />
          <span className="control-value">{effectiveGuidance}</span>
        </div>
      )}

      <style jsx>{`
        .smart-controls { display: flex; flex-direction: column; gap: 10px; }
        .control-row { display: flex; align-items: center; gap: 10px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; min-width: 60px; }
        .control-input {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 5px 8px;
          width: 100px;
          font-family: inherit;
        }
        .control-input.small { width: 70px; }
        .control-input:focus { outline: none; border-color: #d9ff00; }
        .control-select {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 5px 8px;
          cursor: pointer;
          font-family: inherit;
        }
        .control-select:focus { outline: none; border-color: #d9ff00; }
        .random-btn {
          font-size: 0.7rem;
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          background: transparent;
          color: #888;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .random-btn:hover { border-color: #d9ff00; color: #d9ff00; }
        .control-slider { flex: 1; accent-color: #d9ff00; cursor: pointer; }
        .control-value { font-size: 0.75rem; color: #888; min-width: 30px; text-align: right; }
        .ratio-buttons { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
        .ratio-btn {
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          background: #161618;
          color: #888;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .ratio-btn:hover { border-color: #d9ff00; color: #ccc; }
        .ratio-btn--active { border-color: #d9ff00; background: rgba(217,255,0,0.12); color: #d9ff00; }
      `}</style>
    </div>
  );
}

// ===== GenerationButton =====
interface GenerationButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export function GenerationButton({ onClick, loading = false, label = 'Generate' }: GenerationButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={`gen-btn ${loading ? 'gen-btn--loading' : ''}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'Generating...' : label}
      <style jsx>{`
        .gen-btn {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          border: none;
          background: #d9ff00;
          color: black;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
          letter-spacing: 0.04em;
        }
        .gen-btn:hover:not(:disabled) { background: #b8d900; }
        .gen-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .gen-btn--loading { background: #a3bf00; }
      `}</style>
    </button>
  );
}

