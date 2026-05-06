'use client';

import type { ModelInputs } from '@/lib/models';

interface SmartControlsProps {
  seed: number | null;
  onSeedChange: (seed: number | null) => void;
  steps?: number;
  onStepsChange?: (steps: number) => void;
  guidance?: number;
  onGuidanceChange?: (guidance: number) => void;
  aspectRatio?: string;
  onAspectRatioChange?: (ratio: string) => void;
  width?: number;
  onWidthChange?: (w: number) => void;
  height?: number;
  onHeightChange?: (h: number) => void;
  quality?: string;
  onQualityChange?: (q: string) => void;
  modelInputs?: ModelInputs;
}

export function SmartControls({
  seed,
  onSeedChange,
  steps,
  onStepsChange,
  guidance,
  onGuidanceChange,
  aspectRatio,
  onAspectRatioChange,
  width,
  onWidthChange,
  height,
  onHeightChange,
  quality,
  onQualityChange,
  modelInputs,
}: SmartControlsProps): React.ReactElement {
  const handleSeedInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onSeedChange(v === '' ? null : parseInt(v, 10));
  };

  const effectiveSteps = steps ?? modelInputs?.steps?.default ?? 30;
  const effectiveGuidance = guidance ?? modelInputs?.guidance?.default ?? 7.5;

  return (
    <div className="smart-controls">
      {/* Seed */}
      <div className="control-row">
        <label className="field-label">Seed</label>
        <input
          type="number"
          className="control-input"
          value={seed ?? ''}
          onChange={handleSeedInput}
          placeholder="Random"
        />
        <button type="button" className="random-btn" onClick={() => onSeedChange(Math.floor(Math.random() * 999999))}>
          Random
        </button>
      </div>

      {/* Aspect ratio buttons */}
      {modelInputs?.aspectRatios && onAspectRatioChange && (
        <div className="control-row">
          <label className="field-label">Ratio</label>
          <div className="ratio-buttons">
            {modelInputs.aspectRatios.map((r) => (
              <button
                key={r}
                type="button"
                className={`ratio-btn ${aspectRatio === r ? 'ratio-btn--active' : ''}`}
                onClick={() => onAspectRatioChange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Width / Height */}
      {!modelInputs?.aspectRatios && modelInputs?.width && modelInputs?.height && (
        <div className="control-row">
          <label className="field-label">Size</label>
          <input
            type="number"
            className="control-input small"
            value={width ?? modelInputs.width}
            onChange={(e) => onWidthChange?.(parseInt(e.target.value, 10))}
            min={128}
            max={2048}
          />
          <span className="field-label" style={{ minWidth: 'auto' }}>×</span>
          <input
            type="number"
            className="control-input small"
            value={height ?? modelInputs.height}
            onChange={(e) => onHeightChange?.(parseInt(e.target.value, 10))}
            min={128}
            max={2048}
          />
        </div>
      )}

      {/* Quality dropdown */}
      {modelInputs?.quality && onQualityChange && (
        <div className="control-row">
          <label className="field-label">Quality</label>
          <select
            className="control-select"
            value={quality ?? modelInputs.quality[0]}
            onChange={(e) => onQualityChange(e.target.value)}
          >
            {modelInputs.quality.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      )}

      {/* Steps slider */}
      {(modelInputs?.steps || onStepsChange) && (
        <div className="control-row">
          <label className="field-label">Steps</label>
          <input
            type="range"
            min={modelInputs?.steps?.min ?? 1}
            max={modelInputs?.steps?.max ?? 100}
            step={1}
            value={effectiveSteps}
            onChange={(e) => onStepsChange?.(parseInt(e.target.value, 10))}
            className="control-slider"
          />
          <span className="control-value">{effectiveSteps}</span>
        </div>
      )}

      {/* Guidance slider */}
      {(modelInputs?.guidance || onGuidanceChange) && (
        <div className="control-row">
          <label className="field-label">Guidance</label>
          <input
            type="range"
            min={modelInputs?.guidance?.min ?? 1}
            max={modelInputs?.guidance?.max ?? 20}
            step={0.5}
            value={effectiveGuidance}
            onChange={(e) => onGuidanceChange?.(parseFloat(e.target.value))}
            className="control-slider"
          />
          <span className="control-value">{effectiveGuidance}</span>
        </div>
      )}

      <style jsx>{`
        .smart-controls { display: flex; flex-direction: column; gap: 10px; }
        .control-row { display: flex; align-items: center; gap: 10px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; min-width: 60px; }
        .control-input {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 5px 8px;
          width: 100px;
          font-family: inherit;
        }
        .control-input.small { width: 70px; }
        .control-input:focus { outline: none; border-color: #d9ff00; }
        .control-select {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 5px 8px;
          cursor: pointer;
          font-family: inherit;
        }
        .control-select:focus { outline: none; border-color: #d9ff00; }
        .random-btn {
          font-size: 0.7rem;
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          background: transparent;
          color: #888;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .random-btn:hover { border-color: #d9ff00; color: #d9ff00; }
        .control-slider { flex: 1; accent-color: #d9ff00; cursor: pointer; }
        .control-value { font-size: 0.75rem; color: #888; min-width: 30px; text-align: right; }
        .ratio-buttons { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
        .ratio-btn {
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          background: #161618;
          color: #888;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .ratio-btn:hover { border-color: #d9ff00; color: #ccc; }
        .ratio-btn--active { border-color: #d9ff00; background: rgba(217,255,0,0.12); color: #d9ff00; }
      `}</style>
    </div>
  );
}
