/**
 * Status of a gate within a phase (e.g., lint, types, tests).
 * - 'pending': Gate has not started
 * - 'pass': Gate passed successfully
 * - 'fail': Gate failed
 * - 'running': Gate is currently executing
 */
export type GateStatus = 'pending' | 'pass' | 'fail' | 'running';

/**
 * Status of a pipeline phase.
 * - 'pending': Phase has not started
 * - 'in-progress': Phase is currently executing
 * - 'complete': Phase finished successfully
 * - 'blocked': Phase is blocked by a previous phase failure
 */
export type PhaseStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';

/**
 * Result of a single gate execution (lint, types, or tests).
 */
export interface GateResult {
  /** Current status of the gate */
  status: GateStatus;
  /** ISO 8601 timestamp of the last gate execution */
  lastRun?: string;
  /** Number of errors detected in the last run */
  errorCount?: number;
  /** File path to the gate's report output */
  reportPath?: string;
}

/**
 * A single phase in the pipeline, containing multiple gate results.
 */
export interface Phase {
  /** Current status of the phase */
  status: PhaseStatus;
  /** ISO 8601 timestamp when the phase started */
  startedAt: string | null;
  /** ISO 8601 timestamp when the phase completed */
  completedAt: string | null;
  /** Error message if the phase failed */
  error: string | null;
  /** Current iteration count for this phase */
  iteration: number;
  /** Results of each gate (lint, types, tests) */
  gates: {
    lint: GateResult;
    types: GateResult;
    tests: GateResult;
  };
}

/**
 * Represents the full state of the CI/CD pipeline.
 */
export interface PipelineState {
  /** Semantic version of the pipeline schema */
  version: string;
  /** Index of the currently executing phase */
  currentPhase: number;
  /** Map of phase index to phase data */
  phases: { [phase: string]: Phase };
  /** ISO 8601 timestamp of the last cron-triggered run, or null */
  lastCronRun: string | null;
  /** ISO 8601 timestamp of the next scheduled cron run, or null */
  nextCronRun: string | null;
}
