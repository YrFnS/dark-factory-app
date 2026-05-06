/**
 * LipSyncResult — video player showing the talking portrait.
 */

'use client';

interface LipSyncResultProps {
  resultUrl: string | null;
}

export function LipSyncResult({ resultUrl }: LipSyncResultProps): React.ReactElement {
  if (!resultUrl) {
    return (
      <div className="result-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
          <polygon points="23,7 16,12 23,17 23,7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        <span>No result yet — upload portrait and audio to begin</span>
        <style jsx>{`
          .result-placeholder {
            background: #161618;
            border: 1px dashed #2a2a2e;
            border-radius: 8px;
            height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #444;
            font-size: 0.8rem;
            text-align: center;
            padding: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="result-container">
      <video
        src={resultUrl}
        controls
        className="result-player"
        playsInline
      />
      <a
        href={resultUrl}
        download="lipsync-result.mp4"
        className="download-btn"
      >
        Download Video
      </a>
      <style jsx>{`
        .result-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .result-player {
          width: 100%;
          max-width: 640px;
          border-radius: 8px;
          background: #000;
          display: block;
        }
        .download-btn {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid #2a2a2e;
          background: #161618;
          color: #888;
          font-size: 0.8rem;
          text-decoration: none;
          text-align: center;
          transition: all 0.15s;
          cursor: pointer;
          font-family: inherit;
        }
        .download-btn:hover { border-color: #d9ff00; color: #d9ff00; }
      `}</style>
    </div>
  );
}
