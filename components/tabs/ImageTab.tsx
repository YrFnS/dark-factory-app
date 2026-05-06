/**
 * ImageTab — text-to-image and image-to-image studio.
 */

'use client';

import { useCallback } from 'react';
import type { ImageTabState } from '@/store/useStudioStore';
import { PromptInput, ReferencePicker, StylePresets, SmartControls, GenerationButton, useGenerate } from '@/components/studio/StudioControls';
import { ModelSelector } from '@/components/studio/ModelSelector';
import { ResultPanel } from '@/components/studio/ResultPanel';
import { HistoryPanel } from '@/components/studio/HistoryPanel';
import { getImageModelOptions, getModelInputs } from '@/lib/model-options';
import { saveGeneration } from '@/lib/storage';

const MODEL_OPTIONS = getImageModelOptions();

interface ImageTabProps {
  state: ImageTabState;
  update: (updates: Partial<ImageTabState>) => void;
}

export function ImageTab({ state, update }: ImageTabProps): JSX.Element {
  const modelInputs = getModelInputs(state.model);
  const { generate, loading } = useGenerate();

  const handleUseAsReference = useCallback((url: string) => {
    update({ referenceImage: url });
  }, [update]);

  const handleGenerateSuccess = useCallback((resultUrl: string) => {
    if (resultUrl && resultUrl.startsWith('http')) {
      saveGeneration({
        model: state.model,
        provider: state.model.split('-')[0] ?? 'unknown',
        prompt: state.prompt,
        params: { aspectRatio: state.aspectRatio, width: state.width, height: state.height, quality: state.quality, seed: state.seed },
        resultUrl,
      });
    }
  }, [state.model, state.prompt, state.aspectRatio, state.width, state.height, state.quality, state.seed]);

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
            value={state.stylePreset}
            onChange={(stylePreset) => update({ stylePreset })}
            onModifierAppend={(modifier) => update({ prompt: state.prompt + modifier })}
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
          <GenerationButton
            onGenerate={generate}
            loading={loading}
            label="Generate Image"
            onSuccess={(resultUrl) => handleGenerateSuccess(resultUrl)}
            prompt={state.prompt}
            model={state.model}
            seed={state.seed}
            referenceImage={state.referenceImage ?? undefined}
            aspectRatio={state.aspectRatio}
            width={state.width}
            height={state.height}
            quality={state.quality}
            steps={state.steps}
            guidance={state.guidance}
          />
        </div>

        {/* Right: Output */}
        <div className="output-col">
          <ResultPanel resultUrl={state.resultUrl} type="image" onUseAsReference={handleUseAsReference} />
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
