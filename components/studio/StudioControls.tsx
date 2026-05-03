// Stub studio UI components used by tabs.
// These are minimal stubs — full implementations are Phase 7.

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
interface ModelSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function ModelSelector({
  label,
  value,
  onChange,
  options,
}: ModelSelectorProps): JSX.Element {
  return (
    <div className="model-selector">
      {label && <label className="field-label">{label}</label>}
      <select
        className="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <style jsx>{`
        .model-selector { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .model-select {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 8px 12px;
          cursor: pointer;
          font-family: inherit;
        }
        .model-select:focus { outline: none; border-color: #d9ff00; }
      `}</style>
    </div>
  );
}

// ===== ReferencePicker =====
interface ReferencePickerProps {
  label?: string;
  value: string | null;
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
}

export function ReferencePicker({
  label,
  value,
  onChange,
  multiple = false,
}: ReferencePickerProps): JSX.Element {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (multiple) {
      const current = value ? (Array.isArray(value) ? value : [value]) : [];
      onChange([...current, url]);
    } else {
      onChange(url);
    }
  };

  return (
    <div className="ref-picker">
      {label && <label className="field-label">{label}</label>}
      <div className="ref-drop-zone">
        {value && !multiple && (
          <img src={value} alt="Reference" className="ref-thumb" />
        )}
        <label className="ref-upload-btn">
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          {value ? 'Change' : 'Upload'}
        </label>
      </div>
      <style jsx>{`
        .ref-picker { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
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
      `}</style>
    </div>
  );
}

// ===== StylePresets =====
interface StylePresetsProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

const STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'concept-art', label: 'Concept Art' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: ' noir', label: 'Film Noir' },
  { value: 'vintage', label: 'Vintage' },
];

export function StylePresets({ label, value, onChange }: StylePresetsProps): JSX.Element {
  return (
    <div className="style-presets">
      {label && <label className="field-label">{label}</label>}
      <div className="preset-grid">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`preset-btn ${value === opt.value ? 'preset-btn--active' : ''}`}
            onClick={() => onChange(opt.value)}
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
interface SmartControlsProps {
  seed: number | null;
  onSeedChange: (seed: number | null) => void;
  steps?: number;
  onStepsChange?: (steps: number) => void;
  guidance?: number;
  onGuidanceChange?: (guidance: number) => void;
}

export function SmartControls({
  seed,
  onSeedChange,
  steps = 30,
  onStepsChange,
  guidance = 7.5,
  onGuidanceChange,
}: SmartControlsProps): JSX.Element {
  const handleSeedInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onSeedChange(v === '' ? null : parseInt(v, 10));
  };

  return (
    <div className="smart-controls">
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
      {onStepsChange && (
        <div className="control-row">
          <label className="field-label">Steps</label>
          <input
            type="range"
            min={10} max={100} step={5}
            value={steps}
            onChange={(e) => onStepsChange(parseInt(e.target.value, 10))}
            className="control-slider"
          />
          <span className="control-value">{steps}</span>
        </div>
      )}
      {onGuidanceChange && (
        <div className="control-row">
          <label className="field-label">Guidance</label>
          <input
            type="range"
            min={1} max={20} step={0.5}
            value={guidance}
            onChange={(e) => onGuidanceChange(parseFloat(e.target.value))}
            className="control-slider"
          />
          <span className="control-value">{guidance}</span>
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
        .control-input:focus { outline: none; border-color: #d9ff00; }
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

// ===== ResultPanel =====
interface ResultPanelProps {
  resultUrl: string | null;
  type?: 'image' | 'video';
}

export function ResultPanel({ resultUrl, type = 'image' }: ResultPanelProps): JSX.Element {
  if (!resultUrl) {
    return (
      <div className="result-placeholder">
        <span>No result yet</span>
        <style jsx>{`
          .result-placeholder {
            background: #161618;
            border: 1px dashed #2a2a2e;
            border-radius: 8px;
            height: 256px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #444;
            font-size: 0.8rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="result-panel">
      {type === 'image' ? (
        <img src={resultUrl} alt="Generated result" className="result-image" />
      ) : (
        <video src={resultUrl} controls className="result-video" />
      )}
      <style jsx>{`
        .result-panel { border-radius: 8px; overflow: hidden; }
        .result-image { width: 100%; height: auto; border-radius: 8px; display: block; }
        .result-video { width: 100%; border-radius: 8px; display: block; }
      `}</style>
    </div>
  );
}

// ===== HistoryPanel =====
interface HistoryItem {
  prompt: string;
  resultUrl: string;
  timestamp: number;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect?: (item: HistoryItem) => void;
}

export function HistoryPanel({ history, onSelect }: HistoryPanelProps): JSX.Element {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        <span>No history yet</span>
        <style jsx>{`
          .history-empty {
            padding: 16px;
            text-align: center;
            color: #444;
            font-size: 0.75rem;
            border: 1px dashed #2a2a2e;
            border-radius: 6px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="history-panel">
      {history.slice().reverse().map((item, i) => (
        <button
          key={i}
          type="button"
          className="history-item"
          onClick={() => onSelect?.(item)}
        >
          <img src={item.resultUrl} alt={`History ${i}`} className="history-thumb" />
          <div className="history-info">
            <span className="history-prompt">{item.prompt}</span>
            <span className="history-time">
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </button>
      ))}
      <style jsx>{`
        .history-panel { display: flex; flex-direction: column; gap: 6px; }
        .history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .history-item:hover { border-color: #d9ff00; }
        .history-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .history-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .history-prompt { font-size: 0.72rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .history-time { font-size: 0.65rem; color: #555; }
      `}</style>
    </div>
  );
}
