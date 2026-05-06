/**
 * InpaintResultPanel — displays an inpaint generation result with
 * download and "use as reference" actions.
 */

'use client';

import { useCallback } from 'react';

interface InpaintResultPanelProps {
  resultUrl: string | null;
  originalUrl?: string;
  model?: string;
  prompt?: string;
  /** Called when the user wants to use the result as a reference/base image. */
  onUseAsReference?: (url: string) => void;
  /** Optional custom download handler. */
  onDownload?: (url: string) => void;
}

export function InpaintResultPanel({
  resultUrl,
  originalUrl,
  model,
  prompt,
  onUseAsReference,
  onDownload,
}: InpaintResultPanelProps): JSX.Element {
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    if (onDownload) {
      onDownload(resultUrl);
      return;
    }
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `inpaint-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl, onDownload]);

  const handleUseAsReference = useCallback(() => {
    if (!resultUrl || !onUseAsReference) return;
    onUseAsReference(resultUrl);
  }, [resultUrl, onUseAsReference]);

  if (!resultUrl) {
    return (
      <div className="inpaint-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#52525b', marginBottom: 8 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6M9 12h6M9 15h4" />
        </svg>
        <span>No inpaint result yet</span>
        <style jsx>{`
          .inpaint-placeholder {
            background: #0a0a0a;
            border: 1px dashed rgba(255,255,255,0.08);
            border-radius: 0.75rem;
            height: 256px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #52525b;
            font-size: 0.8rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="inpaint-result-panel">
      {originalUrl && (
        <div className="comparison-row">
          <div className="comparison-item">
            <span className="comparison-label">Original</span>
            <img src={originalUrl} alt="Original" className="comparison-image" />
          </div>
          <div className="comparison-item">
            <span className="comparison-label">Result</span>
            <img src={resultUrl} alt="Inpaint result" className="comparison-image" />
          </div>
        </div>
      )}

      {!originalUrl && (
        <img src={resultUrl} alt="Inpaint result" className="result-image" />
      )}

      {(model || prompt) && (
        <div className="result-meta">
          {model && <span className="model-badge">{model}</span>}
          {prompt && <span className="prompt-preview">{prompt.length > 80 ? `${prompt.slice(0, 80)}…` : prompt}</span>}
        </div>
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

        {onUseAsReference && (
          <button type="button" className="action-btn action-btn--ref" onClick={handleUseAsReference} title="Use as new base">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Use as Reference
          </button>
        )}
      </div>

      <style jsx>{`
        .inpaint-result-panel {
          background: #0a0a0a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.05);
        }
        .comparison-item {
          background: #0a0a0a;
          position: relative;
        }
        .comparison-label {
          position: absolute;
          top: 8px;
          left: 8px;
          font-size: 0.65rem;
          color: #a1a1aa;
          background: rgba(0,0,0,0.6);
          padding: 2px 6px;
          border-radius: 4px;
          z-index: 2;
        }
        .comparison-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .result-image {
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: contain;
          display: block;
          background: #050505;
        }
        .result-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .model-badge {
          font-size: 0.65rem;
          font-weight: 600;
          color: #d9ff00;
          background: rgba(217, 255, 0, 0.08);
          border: 1px solid rgba(217, 255, 0, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .prompt-preview {
          font-size: 0.72rem;
          color: #71717a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .result-actions {
          display: flex;
          gap: 8px;
          padding: 8px;
          background: #0f0f0f;
          border-top: 1px solid rgba(255,255,255,0.05);
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
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #a1a1aa;
          font-family: inherit;
          transition: all 0.15s;
        }
        .action-btn:hover {
          border-color: #d9ff00;
          color: #d9ff00;
          background: rgba(217, 255, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
