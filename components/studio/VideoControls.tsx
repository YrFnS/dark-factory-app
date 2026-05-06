/**
 * VideoControls — duration selector, start-frame, and loop toggle for VideoTab.
 */

'use client';

interface VideoControlsProps {
  duration: 5 | 10 | 15 | 30;
  onDurationChange: (d: 5 | 10 | 15 | 30) => void;
  startFrame: number;
  onStartFrameChange: (n: number) => void;
  loop: boolean;
  onLoopChange: (l: boolean) => void;
}

export function VideoControls({
  duration,
  onDurationChange,
  startFrame,
  onStartFrameChange,
  loop,
  onLoopChange,
}: VideoControlsProps): React.ReactElement {
  const DURATIONS: Array<5 | 10 | 15 | 30> = [5, 10, 15, 30];

  return (
    <div className="video-controls">
      {/* Duration */}
      <div className="control-group">
        <label className="control-label">Duration</label>
        <div className="duration-btns">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`dur-btn ${duration === d ? 'dur-btn--active' : ''}`}
              onClick={() => onDurationChange(d)}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Start Frame */}
      <div className="control-group">
        <label className="control-label">Start Frame</label>
        <div className="frame-row">
          <input
            type="range"
            min={0}
            max={30}
            value={startFrame}
            onChange={(e) => onStartFrameChange(parseInt(e.target.value, 10))}
            className="frame-slider"
          />
          <input
            type="number"
            min={0}
            max={9999}
            value={startFrame}
            onChange={(e) => onStartFrameChange(parseInt(e.target.value, 10) || 0)}
            className="frame-input"
          />
        </div>
      </div>

      {/* Loop Toggle */}
      <div className="control-group">
        <label className="control-label">Loop</label>
        <button
          type="button"
          role="switch"
          aria-checked={loop}
          className={`loop-toggle ${loop ? 'loop-toggle--on' : ''}`}
          onClick={() => onLoopChange(!loop)}
        >
          <span className="loop-thumb" />
        </button>
      </div>

      <style jsx>{`
        .video-controls {
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 8px;
          padding: 16px;
        }
        .control-group { display: flex; flex-direction: column; gap: 6px; }
        .control-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b6b78;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .duration-btns { display: flex; gap: 6px; }
        .dur-btn {
          flex: 1;
          padding: 6px 0;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          background: #0d0d0f;
          color: #888;
          font-size: 0.75rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .dur-btn:hover { border-color: #d9ff00; color: #ccc; }
        .dur-btn--active {
          border-color: #d9ff00;
          background: rgba(217,255,0,0.15);
          color: #d9ff00;
        }
        .frame-row { display: flex; align-items: center; gap: 10px; }
        .frame-slider { flex: 1; accent-color: #d9ff00; cursor: pointer; }
        .frame-input {
          width: 60px;
          background: #0d0d0f;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.75rem;
          padding: 4px 8px;
          font-family: inherit;
          text-align: center;
        }
        .frame-input:focus { outline: none; border-color: #d9ff00; }
        .loop-toggle {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          border: 1px solid #2a2a2e;
          background: #0d0d0f;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
          padding: 0;
          font-family: inherit;
        }
        .loop-toggle--on { background: rgba(217,255,0,0.3); border-color: #d9ff00; }
        .loop-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #555;
          transition: transform 0.2s, background 0.2s;
        }
        .loop-toggle--on .loop-thumb { transform: translateX(20px); background: #d9ff00; }
      `}</style>
    </div>
  );
}
