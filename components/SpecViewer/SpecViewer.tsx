'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PHASE_NAMES: Record<number, string> = {
  0: 'Init',
  1: 'Core Orchestrator',
  2: 'Dashboard UI',
  3: 'Agent Integration',
  4: 'Polish & Hardening',
  5: 'Finalize',
};

interface SpecViewerProps {
  phaseNumber: number;
}

/**
 * SpecViewer component that displays markdown content (phase spec).
 * Uses react-markdown with remark-gfm for GitHub-flavored markdown.
 * Shows sticky header with phase name and a previous phases accordion.
 */
export default function SpecViewer({ phaseNumber }: SpecViewerProps): JSX.Element {
  const [specContent, setSpecContent] = useState<string>('');
  const [previousPhaseContent, setPreviousPhaseContent] = useState<Record<number, string>>({});
  const [selectedPreviousPhase, setSelectedPreviousPhase] = useState<number | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPhaseName = PHASE_NAMES[phaseNumber] || `Phase ${phaseNumber}`;

  // Fetch current phase spec
  useEffect(() => {
    const fetchCurrentSpec = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/specs/in-progress/PHASE-${phaseNumber}.md`);
        if (!response.ok) {
          throw new Error('Spec not found');
        }
        const text = await response.text();
        setSpecContent(text);
      } catch {
        setError('Spec not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentSpec();
  }, [phaseNumber]);

  // Fetch previous phase specs when accordion is opened
  useEffect(() => {
    if (!isAccordionOpen) return;

    const fetchPreviousSpecs = async (): Promise<void> => {
      const specs: Record<number, string> = {};
      for (let i = 0; i < phaseNumber; i++) {
        try {
          const response = await fetch(`/specs/in-progress/PHASE-${i}.md`);
          if (response.ok) {
            specs[i] = await response.text();
          }
        } catch {
          // Ignore missing specs
        }
      }
      setPreviousPhaseContent(specs);
    };

    fetchPreviousSpecs();
  }, [isAccordionOpen, phaseNumber]);

  const displayedContent =
    selectedPreviousPhase !== null
      ? previousPhaseContent[selectedPreviousPhase] || 'Spec not found'
      : specContent;

  const displayedPhaseName =
    selectedPreviousPhase !== null
      ? `Phase ${selectedPreviousPhase} — ${PHASE_NAMES[selectedPreviousPhase] || ''}`
      : `Phase ${phaseNumber} — ${currentPhaseName}`;

  if (isLoading) {
    return (
      <div className="spec-viewer">
        <div className="spec-viewer-sticky-header">
          <h1 className="spec-viewer-title">Loading...</h1>
        </div>
        <div className="spec-viewer-content">Loading spec...</div>
      </div>
    );
  }

  return (
    <div className="spec-viewer">
      {/* Sticky Header */}
      <div className="spec-viewer-sticky-header">
        <h1 className="spec-viewer-title">{displayedPhaseName}</h1>
        {selectedPreviousPhase !== null && (
          <button
            className="spec-viewer-back-button"
            onClick={() => setSelectedPreviousPhase(null)}
          >
            ← Back to Current Phase
          </button>
        )}
      </div>

      {/* Previous Phase Specs Accordion */}
      {phaseNumber > 0 && selectedPreviousPhase === null && (
        <div className="spec-viewer-accordion">
          <button
            className="spec-viewer-accordion-toggle"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          >
            Previous Phase Specs ({phaseNumber})
            <span className={`spec-viewer-accordion-arrow ${isAccordionOpen ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          {isAccordionOpen && (
            <div className="spec-viewer-accordion-content">
              {Object.keys(previousPhaseContent).length === 0 &&
              phaseNumber > 0 ? (
                <div className="spec-viewer-accordion-loading">
                  {Array.from({ length: phaseNumber }, (_, i) => (
                    <button
                      key={i}
                      className="spec-viewer-accordion-item spec-viewer-accordion-item-disabled"
                      disabled
                    >
                      Phase {i} — {PHASE_NAMES[i] || 'Unknown'}
                    </button>
                  ))}
                </div>
              ) : (
                Object.entries(previousPhaseContent).map(([phase, _content]) => {
                  const phaseNum = parseInt(phase, 10);
                  return (
                    <button
                      key={phaseNum}
                      className="spec-viewer-accordion-item"
                      onClick={() => setSelectedPreviousPhase(phaseNum)}
                    >
                      Phase {phaseNum} — {PHASE_NAMES[phaseNum] || 'Unknown'}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="spec-viewer-content">
        {error ? (
          <div className="spec-viewer-error">{error}</div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .spec-viewer {
          height: 100%;
          overflow-y: auto;
          background: #0a0a0f;
          color: #e0e0e0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .spec-viewer-sticky-header {
          position: sticky;
          top: 0;
          background: #12121a;
          border-bottom: 1px solid #2a2a3a;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          z-index: 10;
        }

        .spec-viewer-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .spec-viewer-back-button {
          background: #2a2a3a;
          border: 1px solid #3a3a4a;
          color: #e0e0e0;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.2s;
        }

        .spec-viewer-back-button:hover {
          background: #3a3a4a;
        }

        .spec-viewer-accordion {
          border-bottom: 1px solid #2a2a3a;
        }

        .spec-viewer-accordion-toggle {
          width: 100%;
          background: #12121a;
          border: none;
          color: #a0a0b0;
          padding: 12px 24px;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.2s;
        }

        .spec-viewer-accordion-toggle:hover {
          background: #1a1a24;
        }

        .spec-viewer-accordion-arrow {
          font-size: 0.75rem;
          transition: transform 0.2s;
        }

        .spec-viewer-accordion-arrow.open {
          transform: rotate(180deg);
        }

        .spec-viewer-accordion-content {
          background: #0e0e14;
          padding: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .spec-viewer-accordion-item {
          background: #1a1a24;
          border: 1px solid #2a2a3a;
          color: #c0c0d0;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }

        .spec-viewer-accordion-item:hover {
          background: #2a2a3a;
          color: #ffffff;
        }

        .spec-viewer-accordion-item-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spec-viewer-accordion-loading {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .spec-viewer-content {
          padding: 24px;
          line-height: 1.7;
        }

        .spec-viewer-content :global(h1) {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 24px 0;
          border-bottom: 1px solid #2a2a3a;
          padding-bottom: 12px;
        }

        .spec-viewer-content :global(h2) {
          font-size: 1.375rem;
          font-weight: 600;
          color: #e8e8f0;
          margin: 32px 0 16px 0;
        }

        .spec-viewer-content :global(h3) {
          font-size: 1.125rem;
          font-weight: 600;
          color: #e0e0e8;
          margin: 24px 0 12px 0;
        }

        .spec-viewer-content :global(p) {
          margin: 0 0 16px 0;
          color: #c0c0c8;
        }

        .spec-viewer-content :global(ul),
        .spec-viewer-content :global(ol) {
          margin: 0 0 16px 0;
          padding-left: 24px;
          color: #c0c0c8;
        }

        .spec-viewer-content :global(li) {
          margin-bottom: 8px;
        }

        .spec-viewer-content :global(code) {
          font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
          background: #1a1a24;
          color: #e0e0ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.875em;
        }

        .spec-viewer-content :global(pre) {
          background: #0d0d12;
          border: 1px solid #2a2a3a;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 0 0 16px 0;
        }

        .spec-viewer-content :global(pre code) {
          background: none;
          padding: 0;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .spec-viewer-content :global(blockquote) {
          margin: 0 0 16px 0;
          padding: 12px 16px;
          border-left: 3px solid #4a4a6a;
          background: #141420;
          color: #b0b0c0;
        }

        .spec-viewer-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 16px 0;
          font-size: 0.875rem;
        }

        .spec-viewer-content :global(th),
        .spec-viewer-content :global(td) {
          border: 1px solid #2a2a3a;
          padding: 10px 14px;
          text-align: left;
        }

        .spec-viewer-content :global(th) {
          background: #141420;
          font-weight: 600;
          color: #e0e0f0;
        }

        .spec-viewer-content :global(td) {
          color: #c0c0c8;
        }

        .spec-viewer-content :global(hr) {
          border: none;
          border-top: 1px solid #2a2a3a;
          margin: 24px 0;
        }

        .spec-viewer-error {
          color: #ff6b6b;
          text-align: center;
          padding: 48px;
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  );
}
