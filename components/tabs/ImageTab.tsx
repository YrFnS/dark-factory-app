/**
 * ImageTab — text-to-image and image-to-video studio.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageTabState } from '@/store/useStudioStore';
import { useStudioStore } from '@/store/useStudioStore';
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const modelInputs = getModelInputs(state.model);
  const { generate, loading } = useGenerate();
  const store = useStudioStore();
  const resultUrlRef = useRef(state.resultUrl);
  resultUrlRef.current = state.resultUrl;

  const handleGenerate = useCallback(async () => {
    if (!state.prompt || !state.model) return;
    try {
      const result = await generate({
        prompt: state.prompt,
        model: state.model,
        ...(state.seed !== null ? { seed: state.seed } : {}),
        ...(state.referenceImage ? { referenceImage: state.referenceImage } : {}),
        ...(state.aspectRatio ? { aspectRatio: state.aspectRatio } : {}),
        ...(state.width ? { width: state.width } : {}),
        ...(state.height ? { height: state.height } : {}),
        ...(state.quality ? { quality: state.quality } : {}),
        ...(state.steps !== undefined ? { steps: state.steps } : {}),
        ...(state.guidance !== undefined ? { guidance: state.guidance } : {}),
      });
      const url = result?.data?.url;
      if (url) handleGenerateSuccess(url);
    } catch {
      // error handled by parent / toast
    }
  }, [generate, state.prompt, state.model, state.seed, state.referenceImage, state.aspectRatio, state.width, state.height, state.quality, state.steps, state.guidance, handleGenerateSuccess]);

  const handleDownload = useCallback(() => {
    const resultUrl = resultUrlRef.current;
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `generation-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Register shortcuts for this tab
  useEffect(() => {
    store.registerShortcut('image', 'generate', handleGenerate);
    store.registerShortcut('image', 'save', handleDownload);
    return () => {
      store.registerShortcut('image', 'generate', null);
      store.registerShortcut('image', 'save', null);
    };
  }, [store, handleGenerate, handleDownload]);

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
            {...(modelInputs !== undefined ? { modelInputs } : {})}
            {...(state.aspectRatio !== undefined ? { aspectRatio: state.aspectRatio } : {})}
            onAspectRatioChange={(aspectRatio) => update({ aspectRatio })}
            {...(state.width !== undefined ? { width: state.width } : {})}
            onWidthChange={(width) => update({ width })}
            {...(state.height !== undefined ? { height: state.height } : {})}
            onHeightChange={(height) => update({ height })}
            {...(state.quality !== undefined ? { quality: state.quality } : {})}
            onQualityChange={(quality) => update({ quality })}
            {...(state.steps !== undefined ? { steps: state.steps } : {})}
            onStepsChange={(steps) => update({ steps })}
            {...(state.guidance !== undefined ? { guidance: state.guidance } : {})}
            onGuidanceChange={(guidance) => update({ guidance })}
          />
          <GenerationButton
            onClick={handleGenerate}
            loading={loading}
            label="Generate Image"
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
          {/* Desktop: History sidebar */}
          <div className="hidden lg:block">
            <h3 className="section-title">History</h3>
            <HistoryPanel
              history={state.history}
              onSelect={(item) => update({ prompt: item.prompt, resultUrl: item.resultUrl })}
            />
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
            onSelect={(item) => {
              update({ prompt: item.prompt, resultUrl: item.resultUrl });
              setHistoryOpen(false);
            }}
          />
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
