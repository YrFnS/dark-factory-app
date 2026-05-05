/**
 * VideoTab — text-to-video and image-to-video studio with VideoControls.
 */

'use client';

import { useCallback } from 'react';
import type { VideoTabState } from '@/store/useStudioStore';
import {
  PromptInput,
  ModelSelector,
  GenerationButton,
  ResultPanel,
  HistoryPanel,
} from '@/components/studio/StudioControls';
import { VideoControls } from '@/components/studio/VideoControls';
import { getVideoModelOptions } from '@/lib/model-options';

const MODEL_OPTIONS = getVideoModelOptions();

interface VideoTabProps {
  state: VideoTabState;
  update: (updates: Partial<VideoTabState>) => void;
}

export function VideoTab({ state, update }: VideoTabProps): JSX.Element {
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
  }, [state.prompt, state.history, update]);

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
          <div className="history-section">
            <h3 className="section-title">History</h3>
            <HistoryPanel history={state.history} />
          </div>
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
        .history-section { margin-top: 8px; }
      `}</style>
    </div>
  );
}
