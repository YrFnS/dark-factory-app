import * as fs from 'fs';
import * as path from 'path';
import { PipelineState, Phase, GateResult, PhaseStatus } from './types';

const STATE_FILE_PATH = path.join(__dirname, '..', 'pipeline', 'state.json');

let cachedState: PipelineState | null = null;

function readStateFile(): PipelineState {
  if (!fs.existsSync(STATE_FILE_PATH)) {
    throw new Error(`State file not found: ${STATE_FILE_PATH}`);
  }

  const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
  const parsed = JSON.parse(content);

  if (!isPipelineState(parsed)) {
    throw new Error('Invalid state file: malformed PipelineState');
  }

  return parsed;
}

function isPipelineState(value: unknown): value is PipelineState {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === 'string' &&
    typeof obj.currentPhase === 'number' &&
    typeof obj.phases === 'object' &&
    obj.phases !== null &&
    Array.isArray(obj.lastCronRun) === false &&
    Array.isArray(obj.nextCronRun) === false
  );
}

export function loadState(): PipelineState {
  cachedState = readStateFile();
  return cachedState;
}

export function saveState(state: PipelineState): void {
  const tempPath = `${STATE_FILE_PATH}.tmp`;
  const jsonContent = JSON.stringify(state, null, 2);

  fs.writeFileSync(tempPath, jsonContent, 'utf-8');

  try {
    fs.renameSync(tempPath, STATE_FILE_PATH);
  } catch (err) {
    fs.unlinkSync(tempPath);
    throw new Error(`Failed to write state file: ${(err as Error).message}`);
  }

  cachedState = state;
}

export function updatePhase(phase: number, updates: Partial<Phase>): void {
  const state = cachedState ?? loadState();
  const phaseKey = String(phase);

  if (!state.phases[phaseKey]) {
    throw new Error(`Phase ${phase} does not exist`);
  }

  state.phases[phaseKey] = {
    ...state.phases[phaseKey],
    ...updates,
  };

  saveState(state);
}

export function updateGate(
  phase: number,
  gate: 'lint' | 'types' | 'tests',
  result: GateResult
): void {
  const state = cachedState ?? loadState();
  const phaseKey = String(phase);

  if (!state.phases[phaseKey]) {
    throw new Error(`Phase ${phase} does not exist`);
  }

  state.phases[phaseKey].gates[gate] = result;
  saveState(state);
}

export function advancePhase(): number {
  const state = cachedState ?? loadState();
  const newPhase = state.currentPhase + 1;
  const newPhaseKey = String(newPhase);

  if (!state.phases[newPhaseKey]) {
    throw new Error(`Phase ${newPhase} does not exist`);
  }

  state.currentPhase = newPhase;
  saveState(state);

  return newPhase;
}

export function getCurrentPhase(): number {
  const state = cachedState ?? loadState();
  return state.currentPhase;
}

export function getPhaseStatus(phase: number): PhaseStatus {
  const state = cachedState ?? loadState();
  const phaseKey = String(phase);

  if (!state.phases[phaseKey]) {
    throw new Error(`Phase ${phase} does not exist`);
  }

  return state.phases[phaseKey].status;
}

export function setPhaseStatus(phase: number, status: PhaseStatus): void {
  const state = cachedState ?? loadState();
  const phaseKey = String(phase);

  if (!state.phases[phaseKey]) {
    throw new Error(`Phase ${phase} does not exist`);
  }

  state.phases[phaseKey].status = status;
  saveState(state);
}
