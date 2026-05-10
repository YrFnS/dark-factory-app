/**
 * ReferencePicker — multi-image upload + history tab.
 */

'use client';

import { useState, useEffect } from 'react';
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
}: ReferencePickerProps): React.ReactElement {
  const [activePickerTab, setActivePickerTab] = useState<'upload' | 'history'>('upload');
  const [history, setHistory] = useState<UploadRecord[]>([]);

  // Load history on mount
  useEffect(() => {
    getUploadHistory().then(setHistory);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const thumbnail = await generateThumbnail(dataUrl);
    const record = await saveUpload({ dataUrl, thumbnail });
    setHistory((prev) => [record, ...prev]);
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

  const handleHistoryRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await removeUpload(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
    setActivePickerTab('upload');
  };

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

      {activePickerTab === 'upload' && (
        <div className="ref-upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="ref-file-input"
          />
          <p className="ref-upload-hint">Click or drag to upload</p>
        </div>
      )}

      {activePickerTab === 'history' && (
        <div className="ref-history-grid">
          {history.length === 0 ? (
            <span className="ref-history-empty">No uploads yet</span>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="ref-history-item"
                onClick={() => handleHistorySelect(record)}
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
        .ref-picker { display: flex; flex-direction: column; gap: 8px; }
        .field-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #6b6b78;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ref-tabs { display: flex; gap: 4px; }
        .ref-tab {
          background: #161618;
          border: 1px solid #2a2a2e;
          color: #a1a1aa;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ref-tab--active {
          background: #1a1a1f;
          border-color: #d9ff00;
          color: #d9ff00;
        }
        .ref-upload-area {
          background: #161618;
          border: 1px dashed #2a2a2e;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          position: relative;
        }
        .ref-file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        .ref-upload-hint {
          font-size: 0.78rem;
          color: #52525b;
          margin: 0;
        }
        .ref-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
          gap: 8px;
        }
        .ref-history-empty { font-size: 0.7rem; color: #52525b; text-align: center; padding: 16px 0; }
        .ref-history-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #2a2a2e;
          transition: border-color 0.15s;
        }
        .ref-history-item:hover { border-color: #d9ff00; }
        .ref-history-thumb { width: 100%; height: 100%; object-fit: cover; }
        .ref-history-remove {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}