/**
 * ResultPanel — displays generated image/video result with download and
 * "use as reference" actions.
 */

'use client';

import { useCallback } from 'react';

interface ResultPanelProps {
  resultUrl: string | null;
  type?: 'image' | 'video';
  /** Called when the user wants to use the result as a reference image. */
  onUseAsReference?: (url: string) => void;
  /** Called when the user wants to edit the result in the inpaint canvas. */
  onEditInCanvas?: (url: string) => void;
}

export function ResultPanel({ resultUrl, type = 'image', onUseAsReference, onEditInCanvas }: ResultPanelProps): React.ReactElement {
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = type === 'video'
      ? `generation-${Date.now()}.mp4`
      : `generation-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl, type]);

  const handleUseAsReference = useCallback(() => {
    if (!resultUrl || !onUseAsReference) return;
    onUseAsReference(resultUrl);
  }, [resultUrl, onUseAsReference]);

  const handleEditInCanvas = useCallback(() => {
    if (!resultUrl || !onEditInCanvas) return;
    onEditInCanvas(resultUrl);
  }, [resultUrl, onEditInCanvas]);

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

      <div className="result-actions">
        <button type="button" className="action-btn action-btn--download" onClick={handleDownload} title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>

        {type === 'image' && onUseAsReference && (
          <button type="button" className="action-btn action-btn--ref" onClick={handleUseAsReference} title="Use as reference">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Use as Reference
          </button>
        )}

        {type === 'image' && onEditInCanvas && (
          <button type="button" className="action-btn action-btn--canvas" onClick={handleEditInCanvas} title="Edit in Canvas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit in Canvas
          </button>
        )}
      </div>

      <style jsx>{`
        .result-panel { border-radius: 8px; overflow: hidden; }
        .result-image { width: 100%; height: auto; border-radius: 8px 8px 0 0; display: block; }
        .result-video { width: 100%; border-radius: 8px 8px 0 0; display: block; }
        .result-actions {
          display: flex;
          gap: 8px;
          padding: 8px;
          background: #161618;
          border: 1px solid #2a2a2e;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #2a2a2e;
          background: #1e1e22;
          color: #a1a1aa;
          font-family: inherit;
          transition: all 0.15s;
        }
        .action-btn:hover { border-color: #d9ff00; color: #d9ff00; }
        .action-btn--download:hover { border-color: #d9ff00; color: #d9ff00; }
        .action-btn--ref:hover { border-color: #d9ff00; color: #d9ff00; }
        .action-btn--canvas:hover { border-color: #d9ff00; color: #d9ff00; }
      `}</style>
    </div>
  );
}
