/**
 * CinemaTab — cinema-grade image generation with camera controls.
 */

'use client';

import { useCallback } from 'react';
import type { CinemaTabState } from '@/store/useStudioStore';
import {
  PromptInput,
  ModelSelector,
  GenerationButton,
  ResultPanel,
  HistoryPanel,
} from '@/components/studio/StudioControls';
import { CinemaCameraControls } from '@/components/studio/CinemaCameraControls';
import { translateCinemaSettings } from '@/components/studio/CinemaCameraControls';

const MODEL_OPTIONS = [
  { value: 'sdxl-cinema', label: 'SDXL Cinema' },
  { value: 'sdxl', label: 'SDXL 1.0' },
  { value: 'playground-cinema', label: 'Playground Cinema' },
];

interface CinemaTabProps {
  state: CinemaTabState;
  update: (updates: Partial<CinemaTabState>) => void;
}

export function CinemaTab({ state, update }: CinemaTabProps): JSX.Element {
  const handleGenerate = useCallback(() => {
    // Inject camera settings suffix into the prompt
    const suffix = translateCinemaSettings(
      state.lensType,
      state.focalLength,
      state.aperture,
      state.cameraBody
    );
    const fullPrompt = state.prompt + suffix;
    const resultUrl = 'https://placehold.co/512x512/1a1a2e/f59e0b?text=Cinema+Frame';
    const newEntry = {
      prompt: fullPrompt,
      resultUrl,
      timestamp: Date.now(),
    };
    update({ resultUrl, history: [...state.history, newEntry] });
  }, [state, update]);

  return (
    <div className="cinema-tab">
      <div className="tab-layout">
        {/* Left: Controls */}
        <div className="controls-col">
          <PromptInput
            label="Scene Description"
            value={state.prompt}
            onChange={(prompt) => update({ prompt })}
          />
          <ModelSelector
            label="Model"
            value={state.model}
            onChange={(model) => update({ model })}
            options={MODEL_OPTIONS}
          />
          <CinemaCameraControls
            lensType={state.lensType}
            onLensTypeChange={(lensType) => update({ lensType })}
            focalLength={state.focalLength}
            onFocalLengthChange={(focalLength) => update({ focalLength })}
            aperture={state.aperture}
            onApertureChange={(aperture) => update({ aperture })}
            cameraBody={state.cameraBody}
            onCameraBodyChange={(cameraBody) => update({ cameraBody })}
          />
          <GenerationButton onClick={handleGenerate} label="Generate Cinema Frame" />
        </div>

        {/* Right: Output */}
        <div className="output-col">
          <ResultPanel resultUrl={state.resultUrl} type="image" />
          <div className="history-section">
            <h3 className="section-title">History</h3>
            <HistoryPanel history={state.history} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .cinema-tab { height: 100%; }
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
