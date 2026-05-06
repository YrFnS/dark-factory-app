import type { PipelineState, PhaseStatus } from '@/types/pipeline';
import { PhaseNode } from './PhaseNode';

interface PhaseTimelineProps {
  pipelineState: PipelineState;
  onPhaseSelect: (phaseNumber: number) => void;
}

function formatTimestamp(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export function PhaseTimeline({
  pipelineState,
  onPhaseSelect,
}: PhaseTimelineProps): React.ReactElement {
  const { currentPhase, phases } = pipelineState;
  const phaseNumbers = [0, 1, 2, 3, 4, 5] as const;

  return (
    <div className="phase-timeline" role="list" aria-label="Pipeline phases">
      {phaseNumbers.map((phaseNumber) => {
        const phase = phases[phaseNumber];
        const status: PhaseStatus = phase?.status ?? 'pending';
        const timestamp = phase?.startedAt
          ? formatTimestamp(phase.startedAt)
          : phase?.completedAt
          ? formatTimestamp(phase.completedAt)
          : undefined;

        return (
          <PhaseNode
            key={phaseNumber}
            phaseNumber={phaseNumber}
            phaseName=""
            status={status}
            timestamp={timestamp}
            isCurrent={phaseNumber === currentPhase}
            onSelect={onPhaseSelect}
          />
        );
      })}
    </div>
  );
}
