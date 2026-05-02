/**
 * ImageTab — text-to-image and image-to-image studio.
 */

'use client';

import { useCallback } from 'react';
import type { ImageTabState } from '@/store/useStudioStore';
import {
  PromptInput,
  ModelSelector,
  ReferencePicker,
  StylePresets,
  SmartControls,
  GenerationButton,
  ResultPanel,
  HistoryPanel,
} from '@/components/studio/StudioControls';

const MODEL_OPTIONS = [
  { value: 'sdxl', label: 'SDXL 1.0' },
  { value: 'sd15', label: 'Stable Diffusion 1.5' },
  { value: 'sdxl-turbo', label: 'SDXL Turbo' },
  { value: 'playground-v2', label: 'Playground v2' },
];

interface ImageTabProps {
  state: ImageTabState;
  update: (updates: Partial<ImageTabState>) => void;
}

export function ImageTab({ state, update }: ImageTabProps): JSX.Element {
  const handleGenerate = useCallback(() => {
    // Stub: simulate a generated result
    // Real: call image generation API
    const resultUrl = 'https://placehold.co/512x512/1a1a2e/3b82f6?text=Generated';
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
    <div className="image-tab">
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
          <ReferencePicker
            label="Reference Image (optional)"
            value={state.referenceImage}
            onChange={(v) => update({ referenceImage: Array.isArray(v) ? v[0] ?? null : v })}
          />
          <StylePresets
            label="Style Preset"
            value={state.stylePreset}
            onChange={(stylePreset) => update({ stylePreset })}
          />
          <SmartControls
            seed={state.seed}
            onSeedChange={(seed) => update({ seed })}
          />
          <GenerationButton onClick={handleGenerate} label="Generate Image" />
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
        .image-tab { height: 100%; }
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
