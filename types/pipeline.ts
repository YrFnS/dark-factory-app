/**
 * Pipeline State Type Definitions
 * Matches pipeline/state.json schema
 */

export type PhaseStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';
export type GateStatus = 'pending' | 'pass' | 'fail' | 'running';

export interface GateResult {
  status: GateStatus;
  lastRun?: string;
  errorCount?: number;
  reportPath?: string;
}

export interface PhaseState {
  status: PhaseStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  iteration: number;
  gates: {
    lint: GateResult;
    types: GateResult;
    tests: GateResult;
  };
}

export interface PipelineState {
  version: string;
  currentPhase: number;
  phases: {
    [phase: number]: PhaseState;
  };
  lastCronRun?: string;
  nextCronRun?: string;
}
