/**
 * VideoTab — text-to-video and image-to-video studio with VideoControls.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoTabState } from '@/store/useStudioStore';
import { useStudioStore } from '@/store/useStudioStore';
import { PromptInput, ModelSelector, GenerationButton } from '@/components/studio/StudioControls';
import { ResultPanel } from '@/components/studio/ResultPanel';
import { HistoryPanel } from '@/components/studio/HistoryPanel';
import { VideoControls } from '@/components/studio/VideoControls';
import { getVideoModelOptions } from '@/lib/model-options';
import { saveGeneration } from '@/lib/storage';

const MODEL_OPTIONS = getVideoModelOptions();

interface VideoTabProps {
  state: VideoTabState;
  update: (updates: Partial<VideoTabState>) => void;
}

export function VideoTab({ state, update }: VideoTabProps): React.ReactElement {
  const [historyOpen, setHistoryOpen] = useState(false);
  const store = useStudioStore();
  const resultUrlRef = useRef(state.resultUrl);
  resultUrlRef.current = state.resultUrl;

  const handleGenerate = useCallback(() => {
    const resultUrl = 'https://placehold.co/512x512/1a1a2e/ef4444?text=Video+Result';
    const newEntry = {
      prompt: state.prompt,
      resultUrl,
      timestamp: Date.now(),
    };
    update({
      resultUrl,
      history: [...state.history, newEntry],
    });
    saveGeneration({
      model: state.model,
      provider: state.model.split('-')[0] ?? 'unknown',
      prompt: state.prompt,
      params: { duration: state.duration, startFrame: state.startFrame, loop: state.loop },
      resultUrl,
    });
  }, [state.prompt, state.model, state.duration, state.startFrame, state.loop, state.history, update]);

  const handleDownload = useCallback(() => {
    const resultUrl = resultUrlRef.current;
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `generation-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Register shortcuts for this tab
  useEffect(() => {
    store.registerShortcut('video', 'generate', handleGenerate);
    store.registerShortcut('video', 'save', handleDownload);
    return () => {
      store.registerShortcut('video', 'generate', null);
      store.registerShortcut('video', 'save', null);
    };
  }, [store, handleGenerate, handleDownload]);

  return (
    <div className="video-tab">
      <div className="tab-layout">
        {/* Left: Controls */}
        <div className="controls-col">
          <PromptInput
            label="Prompt"
            value={state.prompt}
            onChange={(prompt) => update({ prompt })}
          />
          <ModelSelector
            label="Model"
            value={state.model}
            onChange={(model) => update({ model })}
            options={MODEL_OPTIONS}
          />
          <VideoControls
            duration={state.duration}
            onDurationChange={(duration) => update({ duration })}
            startFrame={state.startFrame}
            onStartFrameChange={(startFrame) => update({ startFrame })}
            loop={state.loop}
            onLoopChange={(loop) => update({ loop })}
          />
          <GenerationButton onClick={handleGenerate} label="Generate Video" />
        </div>

        {/* Right: Output */}
        <div className="output-col">
          <ResultPanel resultUrl={state.resultUrl} type="video" />
          {/* Desktop: History sidebar */}
          <div className="hidden lg:block">
            <h3 className="section-title">History</h3>
            <HistoryPanel history={state.history} />
          </div>
        </div>
      </div>

      {/* Mobile: History toggle FAB */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 lg:hidden history-fab"
        onClick={() => setHistoryOpen(true)}
        aria-label="Open history"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      </button>

      {/* Mobile: History drawer backdrop */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      {/* Mobile: History drawer */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden history-drawer ${historyOpen ? 'open' : ''}`}>
        <div className="drawer-handle" onClick={() => setHistoryOpen(false)}>
          <div className="handle-bar" />
        </div>
        <div className="drawer-content">
          <h3 className="section-title">History</h3>
          <HistoryPanel
            history={state.history}
            onSelect={() => setHistoryOpen(false)}
          />
        </div>
      </div>

      <style jsx>{`
        .video-tab { height: 100%; }
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
        :global(.history-fab) {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #161618;
          border: 1px solid #2a2a2e;
          color: #d9ff00;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          transition: border-color 0.15s, background 0.15s;
        }
        :global(.history-fab:hover) {
          border-color: #d9ff00;
          background: #1a1a1f;
        }
        :global(.history-drawer) {
          background: #0a0a0c;
          border-top: 1px solid #2a2a2e;
          border-radius: 16px 16px 0 0;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }
        :global(.history-drawer.open) {
          max-height: 60vh;
        }
        :global(.drawer-handle) {
          display: flex;
          justify-content: center;
          padding: 12px;
          cursor: pointer;
        }
        :global(.handle-bar) {
          width: 40px;
          height: 4px;
          background: #2a2a2e;
          border-radius: 2px;
        }
        :global(.drawer-content) {
          padding: 0 16px 24px;
          max-height: calc(60vh - 40px);
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
