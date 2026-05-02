/**
 * LipSyncTab — talking portrait from portrait image + audio.
 */

'use client';

import { useCallback } from 'react';
import type { LipSyncTabState } from '@/store/useStudioStore';
import { GenerationButton } from '@/components/studio/StudioControls';
import { LipSyncControls } from '@/components/studio/LipSyncControls';
import { LipSyncResult } from '@/components/studio/LipSyncResult';

interface LipSyncTabProps {
  state: LipSyncTabState;
  update: (updates: Partial<LipSyncTabState>) => void;
}

export function LipSyncTab({ state, update }: LipSyncTabProps): JSX.Element {
  const handleGenerate = useCallback(() => {
    if (!state.portraitImage || !state.audioFile) return;
    const resultUrl = 'https://placehold.co/512x512/1a1a2e/8b5cf6?text=LipSync+Result';
    const newEntry = {
      portraitImage: state.portraitImage,
      audioName: state.audioName ?? 'audio',
      resultUrl,
      timestamp: Date.now(),
    };
    update({ resultUrl, history: [...state.history, newEntry] });
  }, [state, update]);

  return (
    <div className="lipsync-tab">
      <div className="tab-layout">
        {/* Left: Controls */}
        <div className="controls-col">
          <LipSyncControls
            portraitImage={state.portraitImage}
            onPortraitChange={(v) => update({ portraitImage: Array.isArray(v) ? v[0] ?? null : v })}
            audioFile={state.audioFile}
            audioName={state.audioName}
            audioDuration={state.audioDuration}
            onAudioChange={(audioFile, audioName, audioDuration) =>
              update({ audioFile, audioName, audioDuration })
            }
          />
          <GenerationButton
            onClick={handleGenerate}
            label="Generate LipSync"
            loading={false}
          />
        </div>

        {/* Right: Output */}
        <div className="output-col">
          <LipSyncResult resultUrl={state.resultUrl} />
          <div className="history-section">
            <h3 className="section-title">History</h3>
            <div className="history-list">
              {state.history.length === 0 ? (
                <div className="history-empty">No history yet</div>
              ) : (
                state.history.slice().reverse().map((item, i) => (
                  <div key={i} className="history-item">
                    <img
                      src={item.portraitImage}
                      alt={`History ${i}`}
                      className="history-thumb"
                    />
                    <div className="history-info">
                      <span className="history-audio">{item.audioName}</span>
                      <span className="history-time">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .lipsync-tab { height: 100%; }
        .tab-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          align-items: start;
        }
        .controls-col { display: flex; flex-direction: column; gap: 16px; }
        .output-col { display: flex; flex-direction: column; gap: 16px; }
        .section-title {
          font-size: 0.72rem;
          font-weight: 600;
          color: #6b6b78;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 8px 0;
        }
        .history-list { display: flex; flex-direction: column; gap: 6px; }
        .history-empty {
          padding: 16px;
          text-align: center;
          color: #444;
          font-size: 0.75rem;
          border: 1px dashed #2a2a2e;
          border-radius: 6px;
        }
        .history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
        }
        .history-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .history-info { display: flex; flex-direction: column; gap: 2px; }
        .history-audio { font-size: 0.72rem; color: #aaa; }
        .history-time { font-size: 0.65rem; color: #555; }
      `}</style>
    </div>
  );
}
