/**
 * ImageTab — text-to-image and image-to-image studio.
 */

'use client';

import { useCallback, useState } from 'react';
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
import { getImageModelOptions, getModelInputs } from '@/lib/model-options';

const MODEL_OPTIONS = getImageModelOptions();

interface ImageTabProps {
  state: ImageTabState;
  update: (updates: Partial<ImageTabState>) => void;
}

export function ImageTab({ state, update }: ImageTabProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const modelInputs = getModelInputs(state.model);

  const handleGenerate = useCallback(async () => {
    if (!state.prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          model: state.model,
          prompt: state.prompt,
          seed: state.seed,
          referenceImage: state.referenceImage,
          // Pass through model-specific inputs
          aspectRatio: state.aspectRatio,
          width: state.width,
          height: state.height,
          quality: state.quality,
          steps: state.steps,
          guidance: state.guidance,
        }),
      });
      const data = await res.json();
      const resultUrl = data?.url ?? null;
      const newEntry = {
        prompt: state.prompt,
        resultUrl: resultUrl ?? 'https://placehold.co/512x512/1a1a2e/d9ff00?text=Generation+Pending',
        timestamp: Date.now(),
      };
      update({
        resultUrl: resultUrl ?? state.resultUrl,
        history: [...state.history, newEntry],
      });
    } catch {
      // On error, keep previous result visible
      update({
        resultUrl: 'https://placehold.co/512x512/1a1a2e/ef4444?text=Error',
      });
    } finally {
      setLoading(false);
    }
  }, [state.prompt, state.model, state.seed, state.referenceImage,
      state.aspectRatio, state.width, state.height, state.quality,
      state.steps, state.guidance, state.resultUrl, state.history, update]);

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
            onPromptAppend={(mod) => update({ prompt: state.prompt + mod })}
          />
          <SmartControls
            seed={state.seed}
            onSeedChange={(seed) => update({ seed })}
            modelInputs={modelInputs}
            aspectRatio={state.aspectRatio}
            onAspectRatioChange={(aspectRatio) => update({ aspectRatio })}
            width={state.width}
            onWidthChange={(width) => update({ width })}
            height={state.height}
            onHeightChange={(height) => update({ height })}
            quality={state.quality}
            onQualityChange={(quality) => update({ quality })}
            steps={state.steps}
            onStepsChange={(steps) => update({ steps })}
            guidance={state.guidance}
            onGuidanceChange={(guidance) => update({ guidance })}
          />
          <GenerationButton onClick={handleGenerate} loading={loading} label="Generate Image" />
        </div>

        {/* Right: Output */}
        <div className="output-col">
          <ResultPanel resultUrl={state.resultUrl} type="image" />
          <div className="history-section">
            <h3 className="section-title">History</h3>
            <HistoryPanel
              history={state.history}
              onSelect={(item) => update({ prompt: item.prompt, resultUrl: item.resultUrl })}
            />
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
