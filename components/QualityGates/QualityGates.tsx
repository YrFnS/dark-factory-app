'use client';

import { usePipeline } from '@/context/PipelineContext';
import { GateBadge } from '@/components/GateBadge';
import type { GateResult } from '@/types/pipeline';

interface QualityGatesProps {
  phaseNumber: number;
}

/**
 * QualityGates displays a horizontal row of 3 GateBadge components
 * for the current phase's lint, types, and tests gates.
 *
 * Updated in Phase 3 to reflect live gate execution status.
 * Gate badges transition through: pending → running → pass/fail
 * with error counts and last-run timestamps updated in real-time.
 */
export function QualityGates({ phaseNumber }: QualityGatesProps): JSX.Element {
  const { state } = usePipeline();

  if (!state) {
    return (
      <div className="quality-gates">
        <div className="quality-gates-loading">Loading gates...</div>
      </div>
    );
  }

  const phase = state.phases[phaseNumber];

  if (!phase) {
    return (
      <div className="quality-gates">
        <div className="quality-gates-loading">Phase not found...</div>
      </div>
    );
  }

  // Determine if any gate is currently running
  const anyRunning =
    phase.gates.lint.status === 'running' ||
    phase.gates.types.status === 'running' ||
    phase.gates.tests.status === 'running';

  return (
    <div className="quality-gates">
      <div className="quality-gates-header">
        <h3 className="quality-gates-title">Quality Gates</h3>
        {anyRunning && (
          <span className="quality-gates-running-indicator" aria-live="polite">
            <span className="pulse-dot" />
            Running
          </span>
        )}
      </div>

      <div className="quality-gates-badges">
        <GateBadge gate={phase.gates.lint} label="Lint" type="lint" />
        <GateBadge gate={phase.gates.types} label="Types" type="types" />
        <GateBadge gate={phase.gates.tests} label="Tests" type="tests" />
      </div>

      <div className="quality-gates-timestamps">
        <Timestamp label="Lint" gate={phase.gates.lint} />
        <Timestamp label="Types" gate={phase.gates.types} />
        <Timestamp label="Tests" gate={phase.gates.tests} />
      </div>

      <style jsx>{`
        .quality-gates {
          background: #161618;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          padding: 16px 24px;
        }
        .quality-gates-loading {
          text-align: center;
          padding: 16px;
          color: #8b8b94;
          font-size: 0.875rem;
        }
        .quality-gates-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .quality-gates-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #8b8b94;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .quality-gates-running-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          color: #60a5fa;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pulse-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d9ff00;
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .quality-gates-badges {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .quality-gates-timestamps {
          display: flex;
          gap: 24px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #1e1e22;
        }
      `}</style>
    </div>
  );
}

function Timestamp({ label, gate }: { label: string; gate: GateResult }): JSX.Element {
  const lastRun = gate.lastRun ? new Date(gate.lastRun).toLocaleTimeString() : '—';
  return (
    <div className="timestamp">
      <span className="timestamp-label">{label}</span>
      <span className="timestamp-value">{lastRun}</span>
      {gate.errorCount !== undefined && gate.errorCount > 0 && (
        <span className="timestamp-errors">{gate.errorCount} errors</span>
      )}
      <style jsx>{`
        .timestamp { display: flex; flex-direction: column; gap: 2px; }
        .timestamp-label { font-size: 0.6rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
        .timestamp-value { font-size: 0.65rem; color: #777; font-variant-numeric: tabular-nums; }
        .timestamp-errors { font-size: 0.6rem; color: #f87171; }
      `}</style>
    </div>
  );
}
