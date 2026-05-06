// Stub studio UI components used by tabs.
// SmartControls extracted to components/studio/SmartControls.tsx

// ===== PromptInput =====
interface PromptInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function PromptInput({
  label,
  value,
  onChange,
  placeholder = 'Describe what you want to generate...',
  rows = 4,
}: PromptInputProps): JSX.Element {
  return (
    <div className="prompt-input">
      {label && <label className="field-label">{label}</label>}
      <textarea
        className="prompt-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      <style jsx>{`
        .prompt-input { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 0.7rem; font-weight: 600; color: #6b6b78; text-transform: uppercase; letter-spacing: 0.08em; }
        .prompt-textarea {
          background: #161618;
          border: 1px solid #2a2a2e;
          border-radius: 6px;
          color: #e2e2e8;
          font-size: 0.85rem;
          padding: 12px;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          transition: border-color 0.2s;
        }
        .prompt-textarea:focus {
          outline: none;
          border-color: #d9ff00;
        }
        .prompt-textarea::placeholder { color: #444; }
      `}</style>
    </div>
  );
}

// ===== ModelSelector =====
export { ModelSelector } from './ModelSelector';

// ===== ReferencePicker =====
export { ReferencePicker } from './ReferencePicker';

// ===== StylePresets =====
export { StylePresets } from './StylePresets';

// ===== SmartControls =====
// Dynamic controls based on selected model's inputs — imported from separate file
export { SmartControls } from './SmartControls';

// ===== GenerationButton =====
export { GenerationButton, useGenerate } from './GenerationButton';

