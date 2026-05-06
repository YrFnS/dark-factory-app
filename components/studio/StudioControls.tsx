// Stub studio UI components used by tabs.
// SmartControls extracted to components/studio/SmartControls.tsx

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
export { ModelSelector } from './ModelSelector';
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
export { StylePresets } from './StylePresets';

// ===== SmartControls =====
// Dynamic controls based on selected model's inputs — imported from separate file
export { SmartControls } from './SmartControls';

// ===== GenerationButton =====
export { GenerationButton, useGenerate } from './GenerationButton';

