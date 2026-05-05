'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export type CanvasTool = 'brush' | 'eraser';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CanvasToolbar({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onReset,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: CanvasToolbarProps): React.ReactElement {
  return (
    <div className="canvas-toolbar">
      {/* Tool selector */}
      <div className="tool-group">
        <button
          className={`tool-btn ${activeTool === 'brush' ? 'active' : ''}`}
          onClick={() => onToolChange('brush')}
          title="Brush (paint mask)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </button>

        <button
          className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
          onClick={() => onToolChange('eraser')}
          title="Eraser (remove mask)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L13.8 2.4a2 2 0 0 1 2.8 0L21 6.8a2 2 0 0 1 0 2.8L12 18" />
            <path d="M6.5 13.5L13 7" />
          </svg>
        </button>
      </div>

      <div className="divider" />

      {/* Zoom controls */}
      <div className="tool-group">
        <button
          className="tool-btn"
          onClick={onZoomOut}
          title="Zoom out (-)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>

        <button
          className="tool-btn"
          onClick={onFitToView}
          title="Fit to view"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>

        <button
          className="tool-btn"
          onClick={onZoomIn}
          title="Zoom in (+)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
      </div>

      <div className="divider" />

      {/* Undo/Redo */}
      <div className="tool-group">
        <button
          className="tool-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
          </svg>
        </button>

        <button
          className="tool-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
          </svg>
        </button>
      </div>

      <div className="divider" />

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={onReset} title="Reset canvas">
        Reset
      </Button>

      <style jsx>{`
        .canvas-toolbar {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.75rem;
          flex-wrap: wrap;
        }

        .tool-group {
          display: flex;
          align-items: center;
          gap: 0.125rem;
        }

        .tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          background: transparent;
          border: 1px solid transparent;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 150ms ease;
          padding: 0;
        }

        .tool-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .tool-btn.active {
          background: rgba(217, 255, 0, 0.1);
          color: #d9ff00;
          border-color: rgba(217, 255, 0, 0.3);
        }

        .tool-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .tool-btn:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(217, 255, 0, 0.3);
        }

        .divider {
          width: 1px;
          height: 1.25rem;
          background: rgba(255, 255, 255, 0.08);
          margin: 0 0.25rem;
        }
      `}</style>
    </div>
  );
}
