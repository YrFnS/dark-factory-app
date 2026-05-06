/**
 * InpaintHistory — shows inpaint history from localStorage.
 * Click to restore params, hover to delete.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY_INPAINT_HISTORY = 'dark-factory-inpaint-history';
const MAX_INPAINT_HISTORY = 50;

export interface InpaintHistoryRecord {
  id: string;
  originalUrl: string;
  maskUrl?: string;
  resultUrl: string;
  thumbnail?: string;
  model: string;
  provider: string;
  prompt: string;
  timestamp: number;
}

function getInpaintHistory(): InpaintHistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_INPAINT_HISTORY);
    return raw ? (JSON.parse(raw) as InpaintHistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveInpaintHistory(
  record: Omit<InpaintHistoryRecord, 'id' | 'timestamp'>
): InpaintHistoryRecord {
  if (typeof window === 'undefined') throw new Error('localStorage not available');
  const full: InpaintHistoryRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const history = getInpaintHistory();
  history.unshift(full);
  if (history.length > MAX_INPAINT_HISTORY) history.splice(MAX_INPAINT_HISTORY);
  localStorage.setItem(KEY_INPAINT_HISTORY, JSON.stringify(history));
  return full;
}

export function removeInpaintHistory(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getInpaintHistory().filter((r) => r.id !== id);
    localStorage.setItem(KEY_INPAINT_HISTORY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

interface InpaintHistoryProps {
  onRestore?: (record: InpaintHistoryRecord) => void;
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function InpaintHistory({ onRestore }: InpaintHistoryProps): React.ReactElement {
  const [records, setRecords] = useState<InpaintHistoryRecord[]>([]);

  const load = useCallback(() => {
    setRecords(getInpaintHistory());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      removeInpaintHistory(id);
      load();
    },
    [load]
  );

  if (records.length === 0) {
    return (
      <div className="inpaint-history-empty">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#52525b', marginBottom: 8 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>No inpaint history yet</span>
        <style jsx>{`
          .inpaint-history-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            color: #52525b;
            font-size: 0.8rem;
            gap: 4px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="inpaint-history">
      <div className="history-grid">
        {records.map((record) => (
          <div
            key={record.id}
            className="history-card"
            onClick={() => onRestore?.(record)}
            title={record.prompt}
          >
            <div className="card-thumbnail-wrap">
              <img
                src={record.thumbnail || record.resultUrl}
                alt="Inpaint result"
                className="card-thumbnail"
              />
              <button
                type="button"
                className="delete-btn"
                onClick={(e) => handleDelete(e, record.id)}
                title="Delete"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="card-info">
              <span className="card-model">{record.model}</span>
              <span className="card-prompt">{record.prompt.length > 50 ? `${record.prompt.slice(0, 50)}…` : record.prompt}</span>
              <span className="card-time">{formatTimestamp(record.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .inpaint-history {
          width: 100%;
        }
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 8px;
        }
        .history-card {
          background: #141414;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0.75rem;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.15s, transform 0.15s;
          position: relative;
        }
        .history-card:hover {
          border-color: rgba(217, 255, 0, 0.3);
          transform: translateY(-1px);
        }
        .card-thumbnail-wrap {
          position: relative;
          width: 100%;
          height: 100px;
          background: #0a0a0a;
        }
        .card-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .delete-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s, color 0.15s;
          padding: 0;
          font-family: inherit;
        }
        .history-card:hover .delete-btn {
          opacity: 1;
        }
        .delete-btn:hover {
          color: #ff4d4d;
          border-color: #ff4d4d;
        }
        .card-info {
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .card-model {
          font-size: 0.62rem;
          font-weight: 600;
          color: #d9ff00;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-prompt {
          font-size: 0.65rem;
          color: #71717a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .card-time {
          font-size: 0.6rem;
          color: #52525b;
        }
      `}</style>
    </div>
  );
}
