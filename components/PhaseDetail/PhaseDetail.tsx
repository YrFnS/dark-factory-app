'use client';

import { usePipeline } from '@/context/PipelineContext';
import type { PhaseStatus } from '@/types/pipeline';

const PHASE_NAMES: Record<number, string> = {
  0: 'Init',
  1: 'Core Orchestrator',
  2: 'Dashboard UI',
  3: 'Agent Integration',
  4: 'Polish & Hardening',
  5: 'Finalize',
};

// Hardcoded goals per phase from SPEC.md
const PHASE_GOALS: Record<number, string[]> = {
  0: [
    'Create project structure',
    'Write SPEC.md',
    'Write rules.md',
    'Init git repo',
    'Create state.json with phase 0 complete',
  ],
  1: [
    'Implement orchestrator.ts (phase state machine)',
    'Implement state-store.ts (read/write state.json)',
    'Implement log-writer.ts',
    'Implement scripts/plan-agent.sh, implement-agent.sh, test-agent.sh',
    'Implement pipeline/state.json initial state',
  ],
  2: [
    'Implement all React components',
    'Implement Next.js pages and API routes',
    'Implement SSE log stream endpoint',
    'Wire up frontend to state.json',
  ],
  3: [
    'Implement agent-spawner.ts',
    'Connect agents to orchestrator',
    'Implement live log streaming to dashboard',
    'Implement quality gate execution',
  ],
  4: [
    'Error handling, edge cases',
    'Timeout and retry logic',
    'Override safety checks',
    'UI polish',
  ],
  5: [
    'Self-audit: does the app pass its own quality gates?',
    'Documentation',
    'Git branch merge to main',
    'Tag v1.0.0',
  ],
};

// Hardcoded file manifest per phase
const PHASE_FILES: Record<number, string[]> = {
  0: ['SPEC.md', 'rules.md', 'package.json', 'tsconfig.json', '.gitignore'],
  1: ['lib/orchestrator.ts', 'lib/state-store.ts', 'lib/log-writer.ts', 'scripts/*.sh'],
  2: ['app/page.tsx', 'app/layout.tsx', 'app/api/state/route.ts', 'components/**/*.tsx'],
  3: ['lib/agent-spawner.ts', 'app/api/phase/route.ts'],
  4: ['lib/error-handler.ts', 'lib/timeout.ts'],
  5: ['audit/report.md', 'CHANGELOG.md'],
};

function formatTimestamp(isoString?: string): string {
  if (!isoString) return 'Not started';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

function StatusBadge({ status }: { status: PhaseStatus }): JSX.Element {
  const statusConfig: Record<PhaseStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: '#8b8b94', bgColor: 'rgba(139, 139, 148, 0.1)' },
    'in-progress': { label: 'In Progress', color: '#d9ff00', bgColor: 'rgba(217, 255, 0, 0.1)' },
    complete: { label: 'Complete', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
    blocked: { label: 'Blocked', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  };

  const config = statusConfig[status];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {config.label}
    </span>
  );
}

interface PhaseDetailProps {
  phaseNumber: number;
}

/**
 * PhaseDetail shows information about the current or selected phase.
 * Displays phase info, goals, files, and acceptance criteria.
 */
export function PhaseDetail({ phaseNumber }: PhaseDetailProps): JSX.Element {
  const { state } = usePipeline();

  if (!state) {
    return (
      <div className="phase-detail">
        <div className="phase-detail-loading">Loading phase information...</div>
      </div>
    );
  }

  const phase = state.phases[phaseNumber];
  const phaseName = PHASE_NAMES[phaseNumber] || `Phase ${phaseNumber}`;
  const goals = PHASE_GOALS[phaseNumber] || [];
  const files = PHASE_FILES[phaseNumber] || [];

  return (
    <div className="phase-detail">
      {/* Header */}
      <div className="phase-detail-header">
        <div className="phase-detail-title-row">
          <h2 className="phase-detail-title">
            {phaseName}
          </h2>
          <StatusBadge status={phase?.status ?? 'pending'} />
        </div>
        <p className="phase-detail-subtitle">
          Phase {phaseNumber} of 5
        </p>
      </div>

      {/* Metadata */}
      <div className="phase-detail-meta">
        <div className="phase-detail-meta-item">
          <span className="phase-detail-meta-label">Started</span>
          <span className="phase-detail-meta-value">
            {formatTimestamp(phase?.startedAt)}
          </span>
        </div>
        <div className="phase-detail-meta-item">
          <span className="phase-detail-meta-label">Iteration</span>
          <span className="phase-detail-meta-value">
            {phase?.iteration ?? 0}
          </span>
        </div>
        {phase?.error && (
          <div className="phase-detail-error">
            <span className="phase-detail-meta-label">Error</span>
            <span className="phase-detail-meta-value phase-detail-error-text">
              {phase.error}
            </span>
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="phase-detail-section">
        <h3 className="phase-detail-section-title">Goals</h3>
        <ul className="phase-detail-goals">
          {goals.map((goal, index) => (
            <li key={index} className="phase-detail-goal">
              <span className="phase-detail-goal-marker">○</span>
              <span className="phase-detail-goal-text">{goal}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Files */}
      <div className="phase-detail-section">
        <h3 className="phase-detail-section-title">Files</h3>
        <div className="phase-detail-files">
          {files.map((file, index) => (
            <span key={index} className="phase-detail-file">
              {file}
            </span>
          ))}
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="phase-detail-section">
        <h3 className="phase-detail-section-title">Acceptance Criteria</h3>
        <div className="phase-detail-criteria">
          {goals.map((_, index) => (
            <label key={index} className="phase-detail-criterion">
              <input type="checkbox" disabled />
              <span className="phase-detail-criterion-text">
                Acceptance criterion {index + 1}
              </span>
            </label>
          ))}
        </div>
      </div>

      <style jsx>{`
        .phase-detail {
          padding: 24px;
          background: #161618;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
        }

        .phase-detail-loading {
          text-align: center;
          padding: 48px;
          color: #8b8b94;
        }

        .phase-detail-header {
          margin-bottom: 24px;
        }

        .phase-detail-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .phase-detail-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e8e8ec;
          margin: 0;
        }

        .phase-detail-subtitle {
          font-size: 0.875rem;
          color: #8b8b94;
          margin: 0;
        }

        .phase-detail-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          padding: 16px;
          background: #1e1e21;
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .phase-detail-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .phase-detail-meta-label {
          font-size: 0.75rem;
          color: #8b8b94;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .phase-detail-meta-value {
          font-size: 0.875rem;
          color: #e8e8ec;
          font-family: 'JetBrains Mono', monospace;
        }

        .phase-detail-error {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .phase-detail-error-text {
          color: #ef4444;
        }

        .phase-detail-section {
          margin-bottom: 24px;
        }

        .phase-detail-section:last-child {
          margin-bottom: 0;
        }

        .phase-detail-section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e8e8ec;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .phase-detail-goals {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .phase-detail-goal {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #2a2a2e;
        }

        .phase-detail-goal:last-child {
          border-bottom: none;
        }

        .phase-detail-goal-marker {
          color: #f59e0b;
          font-size: 0.75rem;
          margin-top: 2px;
        }

        .phase-detail-goal-text {
          font-size: 0.875rem;
          color: #c0c0c8;
          line-height: 1.5;
        }

        .phase-detail-files {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .phase-detail-file {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #8b8b94;
          background: #1e1e21;
          padding: 4px 8px;
          border-radius: 2px;
          border: 1px solid #2a2a2e;
        }

        .phase-detail-criteria {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .phase-detail-criterion {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: not-allowed;
        }

        .phase-detail-criterion input[type='checkbox'] {
          width: 16px;
          height: 16px;
          accent-color: #f59e0b;
        }

        .phase-detail-criterion-text {
          font-size: 0.875rem;
          color: #8b8b94;
        }
      `}</style>
    </div>
  );
}
