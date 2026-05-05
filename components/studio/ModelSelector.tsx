/**
 * ModelSelector — searchable dropdown with provider badge.
 * Grouped by provider with colored dot indicators.
 */

import { useState } from 'react';

export interface ModelSelectorOption {
  value: string;
  label: string;
  providerColor?: string;
}

interface ModelSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ModelSelectorOption[];
}

export function ModelSelector({
  label,
  value,
  onChange,
  options,
}: ModelSelectorProps): JSX.Element {
  const [search, setSearch] = useState('');

  const selected = options.find((o) => o.value === value);
  const selectedColor = selected?.providerColor;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="model-selector">
      {label && <label className="field-label">{label}</label>}
      <input
        type="text"
        className="model-search"
        placeholder="Search models..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="model-select-wrapper">
        {selectedColor && (
          <span className="provider-dot" style={{ background: selectedColor }} />
        )}
        <select
          className="model-select"
          value={value}
          onChange={(e) => { onChange(e.target.value); setSearch(''); }}
        >
          {filtered.length === 0 ? (
            <option value="">No models found</option>
          ) : (
            filtered.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </select>
      </div>
      <style jsx>{`
        .model-selector { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .model-search {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 6px 10px;
          font-family: inherit;
        }
        .model-search:focus { outline: none; border-color: #d9ff00; }
        .model-search::placeholder { color: #444; }
        .model-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .provider-dot {
          position: absolute;
          left: 10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
        }
        .model-select {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          color: #e2e2e8;
          font-size: 0.8rem;
          padding: 8px 12px 8px 26px;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
        }
        .model-select:focus { outline: none; border-color: #d9ff00; }
      `}</style>
    </div>
  );
}
