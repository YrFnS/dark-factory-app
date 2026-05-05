/**
 * HistoryPanel — browsable history of past generations.
 * Clicking an item restores its prompt and result; hover reveals delete.
 */

'use client';

import { removeGeneration } from '@/lib/storage';

interface HistoryPanelProps {
  history: Array<{
    prompt: string;
    resultUrl: string;
    timestamp: number;
  }>;
  onSelect?: (item: { prompt: string; resultUrl: string }) => void;
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
        <div key={i} className="history-item-wrapper">
          <button
            type="button"
            className="history-item"
            onClick={() => onSelect?.({ prompt: item.prompt, resultUrl: item.resultUrl })}
          >
            <img src={item.resultUrl} alt={`History ${i}`} className="history-thumb" />
            <div className="history-info">
              <span className="history-prompt">{item.prompt}</span>
              <span className="history-time">
                {new Date(item.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </button>
          <button
            type="button"
            className="history-delete"
            onClick={(e) => {
              e.stopPropagation();
              removeGeneration(item.resultUrl);
            }}
            aria-label="Delete from history"
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
      <style jsx>{`
        .history-panel { display: flex; flex-direction: column; gap: 6px; }
        .history-item-wrapper { position: relative; }
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
          width: 100%;
        }
        .history-item:hover { border-color: #d9ff00; }
        .history-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .history-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .history-prompt { font-size: 0.72rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .history-time { font-size: 0.65rem; color: #555; }
        .history-delete {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background: rgba(0,0,0,0.75);
          border: none;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
          font-family: inherit;
        }
        .history-item-wrapper:hover .history-delete { opacity: 1; }
        .history-delete:hover { background: rgba(220,38,38,0.9); }
      `}</style>
    </div>
  );
}
