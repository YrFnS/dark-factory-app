import type { PhaseStatus } from '@/types/pipeline';

interface PhaseNodeProps {
  phaseNumber: number;
  phaseName: string;
  status: PhaseStatus;
  timestamp: string | undefined;
  isCurrent: boolean;
  onSelect: (phaseNumber: number) => void;
}

const PHASE_NAMES: Record<number, string> = {
  0: 'Init',
  1: 'Core Orchestrator',
  2: 'Dashboard UI',
  3: 'Agent Integration',
  4: 'Polish & Hardening',
  5: 'Finalize',
};

function StatusIcon({ status }: { status: PhaseStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="phase-status-icon phase-status-icon--pending" aria-label="Pending">
          ○
        </span>
      );
    case 'in-progress':
      return (
        <span className="phase-status-icon phase-status-icon--in-progress" aria-label="In Progress">
          ●
        </span>
      );
    case 'complete':
      return (
        <span className="phase-status-icon phase-status-icon--complete" aria-label="Complete">
          ✓
        </span>
      );
    case 'blocked':
      return (
        <span className="phase-status-icon phase-status-icon--blocked" aria-label="Blocked">
          ✕
        </span>
      );
  }
}

export function PhaseNode({
  phaseNumber,
  status,
  timestamp,
  isCurrent,
  onSelect,
}: PhaseNodeProps): React.ReactElement {
  const phaseName = PHASE_NAMES[phaseNumber] ?? `Phase ${phaseNumber}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(phaseNumber)}
      className={`phase-node ${isCurrent ? 'phase-node--current' : ''} phase-node--${status}`}
      aria-current={isCurrent ? 'step' : undefined}
    >
      <div className="phase-node__indicator">
        <StatusIcon status={status} />
      </div>
      <div className="phase-node__content">
        <div className="phase-node__header">
          <span className="phase-node__number">Phase {phaseNumber}</span>
          <span className="phase-node__name">{phaseName}</span>
        </div>
        {timestamp && (
          <div className="phase-node__timestamp">{timestamp}</div>
        )}
      </div>
    </button>
  );
}
