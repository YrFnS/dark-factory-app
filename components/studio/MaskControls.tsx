'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface MaskControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushHardness: number;
  onBrushHardnessChange: (hardness: number) => void;
  onClearMask: () => void;
  onUndo: () => void;
  canUndo?: boolean;
}

export function MaskControls({
  brushSize,
  onBrushSizeChange,
  brushHardness,
  onBrushHardnessChange,
  onClearMask,
  onUndo,
  canUndo = false,
}: MaskControlsProps): React.ReactElement {
  return (
    <div className="mask-controls">
      {/* Brush size */}
      <div className="control-row">
        <label className="control-label">
          <span className="label-text">Brush Size</span>
          <span className="label-value">{brushSize}px</span>
        </label>
        <input
          type="range"
          min={5}
          max={100}
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="slider"
        />
      </div>

      {/* Brush hardness */}
      <div className="control-row">
        <label className="control-label">
          <span className="label-text">Hardness</span>
          <span className="label-value">{Math.round(brushHardness * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={brushHardness * 100}
          onChange={(e) => onBrushHardnessChange(Number(e.target.value) / 100)}
          className="slider"
        />
      </div>

      {/* Actions */}
      <div className="action-row">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
          </svg>
          Undo
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearMask}
          title="Clear entire mask"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
          Clear
        </Button>
      </div>

      {/* Mask color indicator */}
      <div className="mask-info">
        <span
          className="mask-swatch"
          style={{
            background: 'rgba(255, 0, 0, 0.4)',
            border: '1px solid rgba(255, 0, 0, 0.6)',
          }}
        />
        <span className="mask-label">Mask overlay</span>
      </div>

      <style jsx>{`
        .mask-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0.5rem 0;
        }

        .control-row {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .control-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .label-text {
          font-size: 12px;
          font-weight: 500;
          color: #a1a1aa;
        }

        .label-value {
          font-size: 11px;
          color: #d9ff00;
          font-variant-numeric: tabular-nums;
        }

        .slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #d9ff00;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px rgba(217, 255, 0, 0.4);
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #d9ff00;
          cursor: pointer;
          border: none;
        }

        .action-row {
          display: flex;
          gap: 0.5rem;
        }

        .mask-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
        }

        .mask-swatch {
          width: 20px;
          height: 14px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .mask-label {
          font-size: 11px;
          color: #52525b;
        }
      `}</style>
    </div>
  );
}
