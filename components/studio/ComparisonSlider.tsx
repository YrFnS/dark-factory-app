'use client';

/**
 * ComparisonSlider — a before/after draggable image slider.
 * Reveals more or less of the "after" image as the user drags the
 * vertical divider left and right.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ComparisonSlider({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: ComparisonSliderProps): JSX.Element {
  // Position as a percentage (0–100), starting at center
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // --- Mouse drag ---

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setPosition(pct);
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // --- Touch drag ---

  const handleTouchStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0]!.clientX - rect.left;
      const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setPosition(pct);
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // --- Keyboard ---

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const STEP = 2;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - STEP));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + STEP));
    }
  }, []);

  // Attach global mouse/touch listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Clip-path: reveal the left portion of the after image
  const clipPath = `inset(0 ${100 - position}% 0 0)`;

  return (
    <div
      ref={containerRef}
      className="comparison-slider"
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Base layer: "after" image, clipped from the right */}
      <div className="layer layer-after">
        <img src={afterUrl} alt="After" className="image" />
        {afterLabel && (
          <span className="label label-after">{afterLabel}</span>
        )}
      </div>

      {/* Overlay layer: "before" image, revealed from the left */}
      <div
        className="layer layer-before"
        style={{ clipPath, width: `${position}%` }}
      >
        <img src={beforeUrl} alt="Before" className="image" />
        {beforeLabel && (
          <span className="label label-before">{beforeLabel}</span>
        )}
      </div>

      {/* Draggable divider */}
      <div
        className="divider"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="divider-line" />
        <div className="divider-handle" aria-hidden="true">
          {/* Grip handle icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9"  cy="5"  r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="5"  r="1.2" fill="currentColor" stroke="none" />
            <circle cx="9"  cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="9"  cy="19" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="19" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        .comparison-slider {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 10px;
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: ew-resize;
          user-select: none;
          outline: none;
        }

        .comparison-slider:focus-visible {
          outline: 2px solid #d9ff00;
          outline-offset: 2px;
        }

        .layer {
          position: absolute;
          inset: 0;
        }

        .layer-after {
          /* full container */
        }

        .layer-before {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          overflow: hidden;
          transition: none;
        }

        .image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }

        .label {
          position: absolute;
          bottom: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #e0e0e0;
          background: rgba(5, 5, 5, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          pointer-events: none;
        }

        .label-before {
          left: 12px;
        }

        .label-after {
          right: 12px;
        }

        .divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          transform: translateX(-50%);
          cursor: ew-resize;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .divider-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
        }

        .divider-handle {
          position: relative;
          z-index: 1;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(20, 20, 20, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d9ff00;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
          transition: transform 0.1s ease, background 0.15s ease;
        }

        .divider:hover .divider-handle,
        .comparison-slider:focus-visible .divider-handle {
          transform: scale(1.1);
          background: rgba(30, 30, 30, 0.95);
        }

        .comparison-slider:focus-visible .divider-handle {
          border-color: #d9ff00;
        }
      `}</style>
    </div>
  );
}
