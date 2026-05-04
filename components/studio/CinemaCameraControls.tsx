/**
 * CinemaCameraControls — lens type, focal length, aperture, and camera body
 * selectors. Each setting generates a descriptive prompt suffix.
 */

'use client';

import { translateCinemaSettings, getCinemaViewportLabel } from './cinema-utils';

// Re-export for consumers of CinemaCameraControls
export { translateCinemaSettings, getCinemaViewportLabel };

interface CinemaCameraControlsProps {
  lensType: 'Anamorphic' | 'Macro' | 'Cinema Prime' | 'Wide Angle' | 'Telephoto' | 'Fisheye';
  onLensTypeChange: (v: CinemaCameraControlsProps['lensType']) => void;
  focalLength: number;
  onFocalLengthChange: (v: number) => void;
  aperture: number;
  onApertureChange: (v: number) => void;
  cameraBody: '70mm Film' | '16mm Film' | 'Large Format Digital' | 'Mirrorless Full Frame';
  onCameraBodyChange: (v: CinemaCameraControlsProps['cameraBody']) => void;
}

const LENS_TYPES = ['Anamorphic', 'Macro', 'Cinema Prime', 'Wide Angle', 'Telephoto', 'Fisheye'] as const;
const CAMERA_BODIES = ['70mm Film', '16mm Film', 'Large Format Digital', 'Mirrorless Full Frame'] as const;

export function CinemaCameraControls({
  lensType,
  onLensTypeChange,
  focalLength,
  onFocalLengthChange,
  aperture,
  onApertureChange,
  cameraBody,
  onCameraBodyChange,
}: CinemaCameraControlsProps): JSX.Element {
  const promptSuffix = translateCinemaSettings(lensType, focalLength, aperture, cameraBody);
  const viewportLabel = getCinemaViewportLabel(lensType, focalLength, aperture, cameraBody);

  return (
    <div className="cinema-controls">
      {/* Viewport preview */}
      <div className="viewport-preview">
        <div className="viewport-frame">
          <div className="viewport-label">{viewportLabel}</div>
          <div className="viewport-inner">
            <div className="viewport-crosshair" />
          </div>
        </div>
        <div className="viewport-suffix">
          <span className="suffix-label">Prompt suffix:</span>
          <span className="suffix-text">{promptSuffix || '(no settings)'}</span>
        </div>
      </div>

      {/* Lens type */}
      <div className="control-group">
        <label className="control-label">Lens Type</label>
        <select
          className="control-select"
          value={lensType}
          onChange={(e) => onLensTypeChange(e.target.value as CinemaCameraControlsProps['lensType'])}
        >
          {LENS_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Focal length */}
      <div className="control-group">
        <label className="control-label">Focal Length — {focalLength}mm</label>
        <div className="slider-row">
          <span className="slider-min">8mm</span>
          <input
            type="range"
            min={8}
            max={200}
            value={focalLength}
            onChange={(e) => onFocalLengthChange(parseInt(e.target.value, 10))}
            className="control-slider"
          />
          <span className="slider-max">200mm</span>
        </div>
        <input
          type="number"
          min={8}
          max={200}
          value={focalLength}
          onChange={(e) => onFocalLengthChange(Math.min(200, Math.max(8, parseInt(e.target.value, 10) || 8)))}
          className="numeric-input"
        />
      </div>

      {/* Aperture */}
      <div className="control-group">
        <label className="control-label">Aperture — f/{aperture}</label>
        <div className="slider-row">
          <span className="slider-min">f/22</span>
          <input
            type="range"
            min={0.95}
            max={22}
            step={0.05}
            value={aperture}
            onChange={(e) => onApertureChange(parseFloat(e.target.value))}
            className="control-slider"
          />
          <span className="slider-max">f/0.95</span>
        </div>
      </div>

      {/* Camera body */}
      <div className="control-group">
        <label className="control-label">Camera Body</label>
        <select
          className="control-select"
          value={cameraBody}
          onChange={(e) => onCameraBodyChange(e.target.value as CinemaCameraControlsProps['cameraBody'])}
        >
          {CAMERA_BODIES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .cinema-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
        .control-select {
          background: #0d0d0f;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 8px 10px;
          cursor: pointer;
          font-family: inherit;
        }
        .control-select:focus { outline: none; border-color: #d9ff00; }
        .slider-row { display: flex; align-items: center; gap: 8px; }
        .control-slider { flex: 1; accent-color: #d9ff00; cursor: pointer; }
        .slider-min, .slider-max { font-size: 0.65rem; color: #555; min-width: 28px; }
        .slider-max { text-align: right; }
        .numeric-input {
          background: #0d0d0f;
          border: 1px solid #2a2a2e;
          border-radius: 4px;
          color: #e2e2e8;
          font-size: 0.75rem;
          padding: 4px 8px;
          width: 80px;
          font-family: inherit;
          text-align: center;
          margin-top: 4px;
        }
        .numeric-input:focus { outline: none; border-color: #d9ff00; }
        .viewport-preview {
          background: #0d0d0f;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          overflow: hidden;
        }
        .viewport-frame {
          aspect-ratio: 16/9;
          background: #111;
          position: relative;
          border-bottom: 1px solid #2a2a2e;
        }
        .viewport-inner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .viewport-crosshair {
          width: 40%;
          height: 40%;
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 2px;
          position: relative;
        }
        .viewport-crosshair::before,
        .viewport-crosshair::after {
          content: '';
          position: absolute;
          background: rgba(59,130,246,0.2);
        }
        .viewport-crosshair::before { top: 50%; left: 0; right: 0; height: 1px; }
        .viewport-crosshair::after { left: 50%; top: 0; bottom: 0; width: 1px; }
        .viewport-label {
          position: absolute;
          bottom: 6px;
          left: 8px;
          font-size: 0.6rem;
          color: rgba(59,130,246,0.7);
          letter-spacing: 0.06em;
          z-index: 1;
          background: rgba(0,0,0,0.5);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .viewport-suffix {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .suffix-label { font-size: 0.62rem; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
        .suffix-text { font-size: 0.7rem; color: #6b6b78; line-height: 1.4; }
      `}</style>
    </div>
  );
}
