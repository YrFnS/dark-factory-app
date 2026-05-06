/**
 * StylePresets — horizontal scroll of preset style cards.
 * Clicking a card appends a modifier suffix to the current prompt.
 */

import React from 'react';

interface StyleOption {
  value: string;
  label: string;
  icon: string;
  modifier: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { value: 'none', label: 'None', icon: '—', modifier: '' },
  { value: 'photorealistic', label: 'Photorealistic', icon: '📸', modifier: ', photorealistic, high detail, 8k resolution' },
  { value: 'anime', label: 'Anime', icon: '🎨', modifier: ', anime style, vibrant colors' },
  { value: 'oil-painting', label: 'Oil Painting', icon: '🖼️', modifier: ', oil painting, canvas texture' },
  { value: 'cinematic', label: 'Cinematic', icon: '🎬', modifier: ', cinematic lighting, film still' },
  { value: 'abstract', label: 'Abstract', icon: '🔷', modifier: ', abstract art, geometric shapes' },
  { value: 'noir', label: 'Film Noir', icon: '🌑', modifier: ', film noir, black and white, high contrast' },
  { value: 'watercolor', label: 'Watercolor', icon: '💧', modifier: ', watercolor painting, soft edges' },
  { value: '3d-render', label: '3D Render', icon: '🎮', modifier: ', 3D render, octane render, detailed' },
];

interface StylePresetsProps {
  /** Currently selected preset value */
  value: string;
  /** Called when a preset is selected */
  onChange: (value: string) => void;
  /**
   * Called with the modifier suffix string when a preset with a modifier is clicked.
   */
  onModifierAppend: (modifier: string) => void;
}

export function StylePresets({ value, onChange, onModifierAppend }: StylePresetsProps): React.ReactElement {
  const handleClick = (opt: StyleOption) => {
    onChange(opt.value);
    if (opt.modifier) {
      onModifierAppend(opt.modifier);
    }
  };

  return (
    <div className="style-presets">
      <label className="field-label">Style Preset</label>
      <div className="preset-scroll">
        <div className="preset-track">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`preset-card ${value === opt.value ? 'preset-card--active' : ''}`}
              onClick={() => handleClick(opt)}
            >
              <span className="preset-icon">{opt.icon}</span>
              <span className="preset-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .style-presets {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b6b78;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .preset-scroll {
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -ms-overflow-style: none;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .preset-scroll::-webkit-scrollbar {
          display: none;
        }
        .preset-track {
          display: flex;
          gap: 8px;
          width: max-content;
        }
        .preset-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          min-width: 80px;
          border-radius: 10px;
          border: 1px solid #2a2a2e;
          background: #141414;
          color: #888;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          scroll-snap-align: start;
        }
        .preset-card:hover {
          border-color: #d9ff00;
          color: #ccc;
          background: #1a1a1a;
        }
        .preset-card--active {
          border-color: #d9ff00;
          background: rgba(217, 255, 0, 0.1);
          color: #d9ff00;
        }
        .preset-icon {
          font-size: 1.2rem;
          line-height: 1;
        }
        .preset-label {
          white-space: nowrap;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
