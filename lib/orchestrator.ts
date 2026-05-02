import type { Phase } from './types';
import * as StateStore from './state-store';
import { LogWriter } from './log-writer';

/**
 * Phase state machine that manages pipeline phase transitions.
 * All state changes are persisted through the StateStore.
 * All public methods have try/catch error boundaries for resilience.
 */
export class Orchestrator {
  /** StateStore module for reading and writing pipeline state */
  private readonly stateStore: typeof StateStore;

  /** LogWriter instance for structured logging */
  private readonly logWriter: LogWriter;

  /**
   * Creates a new Orchestrator instance.
   * @param stateStore - StateStore module for pipeline state persistence
   * @param logWriter - LogWriter instance for logging operations
   */
  constructor(stateStore: typeof StateStore, logWriter: LogWriter) {
    this.stateStore = stateStore;
    this.logWriter = logWriter;
  }

  /**
   * Advances to the next phase if the current phase status is 'complete'.
   * Logs and no-ops if the current phase is not complete.
   */
  public advancePhase(): void {
    try {
      const state = this.stateStore.loadState();
      const currentPhase = state.currentPhase;
      const phaseKey = String(currentPhase);
      const currentPhaseData = state.phases[phaseKey];

      if (!currentPhaseData) {
        this.logWriter.warn(`advancePhase: Phase ${currentPhase} not found in state`);
        return;
      }

      if (currentPhaseData.status !== 'complete') {
        this.logWriter.info(
          `advancePhase: Phase ${currentPhase} status is '${currentPhaseData.status}', not advancing`
        );
        return;
      }

      const newPhase = this.stateStore.advancePhase();
      this.logWriter.info(`advancePhase: Successfully advanced from phase ${currentPhase} to ${newPhase}`);
    } catch (err) {
      this.logWriter.error(`advancePhase: Failed to advance phase - ${(err as Error).message}`);
      this.logWriter.error(`advancePhase: Stack trace: ${(err as Error).stack ?? 'no stack'}`);
      throw err;
    }
  }

  /**
   * Retries the current phase by incrementing the iteration counter
   * and resetting all gates to 'pending'.
   */
  public retryPhase(): void {
    try {
      const state = this.stateStore.loadState();
      const currentPhase = state.currentPhase;
      const phaseKey = String(currentPhase);
      const currentPhaseData = state.phases[phaseKey];

      if (!currentPhaseData) {
        this.logWriter.warn(`retryPhase: Phase ${currentPhase} not found in state`);
        return;
      }

      const newIteration = currentPhaseData.iteration + 1;

      this.stateStore.updatePhase(currentPhase, {
        iteration: newIteration,
        gates: {
          lint: { status: 'pending' },
          types: { status: 'pending' },
          tests: { status: 'pending' },
        },
      });

      this.logWriter.info(
        `retryPhase: Phase ${currentPhase} iteration reset to ${newIteration}, gates reset to pending`
      );
    } catch (err) {
      this.logWriter.error(`retryPhase: Failed to retry phase - ${(err as Error).message}`);
      this.logWriter.error(`retryPhase: Stack trace: ${(err as Error).stack ?? 'no stack'}`);
      throw err;
    }
  }

  /**
   * Resets the entire pipeline: all phases set to 'pending', currentPhase to 0.
   */
  public resetPipeline(): void {
    try {
      const state = this.stateStore.loadState();

      for (const phaseKey of Object.keys(state.phases)) {
        const phaseNum = Number(phaseKey);
        this.stateStore.updatePhase(phaseNum, {
          status: 'pending',
          iteration: 0,
          gates: {
            lint: { status: 'pending' },
            types: { status: 'pending' },
            tests: { status: 'pending' },
          },
        });
      }

      state.currentPhase = 0;
      this.stateStore.saveState(state);

      this.logWriter.info('resetPipeline: All phases reset to pending, currentPhase set to 0');
    } catch (err) {
      this.logWriter.error(`resetPipeline: Failed to reset pipeline - ${(err as Error).message}`);
      this.logWriter.error(`resetPipeline: Stack trace: ${(err as Error).stack ?? 'no stack'}`);
      throw err;
    }
  }

  /**
   * Determines whether the current phase is blocked.
   * @returns true if the current phase status is 'blocked', false otherwise
   */
  public isBlocked(): boolean {
    try {
      const state = this.stateStore.loadState();
      const phaseKey = String(state.currentPhase);
      const currentPhaseData = state.phases[phaseKey];

      if (!currentPhaseData) {
        return false;
      }

      return currentPhaseData.status === 'blocked';
    } catch (err) {
      this.logWriter.error(`isBlocked: Failed to check blocked status - ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Checks whether all three gates (lint, types, tests) for a given phase are 'pass'.
   * @param phase - The phase number to check
   * @returns true if all gates are 'pass', false otherwise
   */
  public areGatesPassing(phase: number): boolean {
    try {
      const state = this.stateStore.loadState();
      const phaseKey = String(phase);
      const phaseData = state.phases[phaseKey];

      if (!phaseData) {
        this.logWriter.warn(`areGatesPassing: Phase ${phase} not found in state`);
        return false;
      }

      const gates = phaseData.gates;
      return (
        gates.lint.status === 'pass' &&
        gates.types.status === 'pass' &&
        gates.tests.status === 'pass'
      );
    } catch (err) {
      this.logWriter.error(`areGatesPassing: Failed to check gates - ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Marks phases with no activity for longer than maxAgeMs as 'blocked'.
   * Activity is determined by the lastRun timestamp on each gate.
   * @param maxAgeMs - Maximum age in milliseconds before a phase is considered stale
   */
  public checkStalePhase(maxAgeMs: number): void {
    try {
      const state = this.stateStore.loadState();
      const now = Date.now();

      for (const phaseKey of Object.keys(state.phases)) {
        const phaseNum = Number(phaseKey);
        const phaseData = state.phases[phaseKey]!;

        if (phaseData.status === 'pending' || phaseData.status === 'blocked') {
          continue;
        }

        const lastActivity = this.getLastActivityTime(phaseData!);
        if (lastActivity === null) {
          continue;
        }

        const age = now - lastActivity;
        if (age > maxAgeMs) {
          this.stateStore.setPhaseStatus(phaseNum, 'blocked');
          this.logWriter.warn(
            `checkStalePhase: Phase ${phaseNum} marked as blocked (age: ${age}ms > maxAgeMs: ${maxAgeMs})`
          );
        }
      }
    } catch (err) {
      this.logWriter.error(`checkStalePhase: Failed to check stale phases - ${(err as Error).message}`);
    }
  }

  /**
   * Validates the schedule from state.json and warns if nextCronRun is stale
   * or if system time appears significantly off.
   */
  public validateSchedule(): void {
    try {
      const state = this.stateStore.loadState();
      const { lastCronRun, nextCronRun } = state;

      if (nextCronRun) {
        const nextRunTime = new Date(nextCronRun).getTime();
        const now = Date.now();

        if (!isNaN(nextRunTime)) {
          const fiveHoursMs = 5 * 60 * 60 * 1000;
          const overdueBy = now - nextRunTime;

          if (overdueBy > fiveHoursMs) {
            this.logWriter.warn(
              `validateSchedule: nextCronRun is stale — overdue by ${Math.round(overdueBy / 60000)} minutes`
            );
          }
        }
      }

      if (lastCronRun) {
        const lastRunTime = new Date(lastCronRun).getTime();
        const now = Date.now();

        if (!isNaN(lastRunTime)) {
          // If last run is in the future by more than 5 minutes, system clock may be off
          const futureDrift = lastRunTime - now;
          if (futureDrift > 5 * 60 * 1000) {
            this.logWriter.warn(
              `validateSchedule: lastCronRun is ${Math.round(futureDrift / 60000)} minutes in the future — NTP sync recommended`
            );
          }
        }
      }
    } catch (err) {
      this.logWriter.error(`validateSchedule: Failed to validate schedule - ${(err as Error).message}`);
    }
  }

  /**
   * Extracts the most recent activity timestamp from a phase's gates.
   * @param phase - The phase data to inspect
   * @returns The timestamp in ms of the most recent gate activity, or null if no gates have run
   */
  private getLastActivityTime(phase: Phase): number | null {
    let latest: number | null = null;

    for (const gate of Object.values(phase.gates) as Array<{ lastRun?: string }>) {
      if (gate.lastRun) {
        const timestamp = new Date(gate.lastRun).getTime();
        if (!isNaN(timestamp)) {
          if (latest === null || timestamp > latest) {
            latest = timestamp;
          }
        }
      }
    }

    return latest;
  }
}
