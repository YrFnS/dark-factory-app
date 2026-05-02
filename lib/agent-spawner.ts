/**
 * Agent Spawner — spawns Claude Code CLI as child processes for plan/implement/test agents.
 * Each agent runs in an isolated worktree directory and streams stdout/stderr to log files.
 * Supports configurable retries with exponential backoff on failure.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/** Result returned after an agent process completes. */
export interface AgentResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  attempts: number;
}

/** Agent type identifiers. */
export type AgentType = 'plan' | 'implement' | 'test';

/** Options for spawning an agent. */
export interface SpawnOptions {
  /** Timeout in milliseconds (default: 10 minutes). */
  timeoutMs?: number;
  /** Number of retry attempts on failure (default: 0, max: 3). */
  retries?: number;
  /** Base delay between retries in milliseconds (default: 2000). */
  retryDelayMs?: number;
  /** Callback invoked for each stdout/stderr line. */
  onLine?: (line: string, isStderr: boolean) => void;
}

/** Default timeout for agent execution (10 minutes). */
export const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

/** Maximum number of retry attempts. */
const MAX_RETRIES = 3;

/** Node.js binary path used to prefix all spawned processes. */
const NODE_PATH = '/home/lich/.hermes/node/bin/';

/**
 * Resolves the Claude Code CLI path by checking common installation locations.
 */
function resolveClauclCodePath(): string {
  const candidates = [
    path.join(process.env.HOME ?? '/root', '.local', 'bin', 'claude'),
    '/usr/local/bin/claude',
    '/usr/bin/claude',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback — trust PATH resolution
  return 'claude';
}

/**
 * Returns the worktree directory for a given agent type and phase.
 * e.g. pipeline/phase-3/work/plan/
 */
function getWorkDir(phase: number, agentType: AgentType): string {
  const workBase = path.resolve(__dirname, '..', '..', 'work', String(phase));
  return path.join(workBase, agentType);
}

/**
 * Returns the log file path for a given agent type and phase.
 * e.g. logs/plan.log
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getLogFilePath(agentType: AgentType, _phase: number): string {
  // Logs live at the repo root /logs/
  const logsDir = path.resolve(__dirname, '..', '..', '..', '..', 'logs');
  return path.join(logsDir, `${agentType}.log`);
}

/**
 * Ensures the given directory exists, creating it recursively if necessary.
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Truncates (or creates) a log file so it starts fresh for a new agent run.
 */
function resetLogFile(logPath: string): void {
  fs.writeFileSync(logPath, '', 'utf-8');
}

/**
 * Appends a line to the agent's log file.
 */
function appendLog(logPath: string, line: string): void {
  fs.appendFileSync(logPath, line + '\n', 'utf-8');
}

/**
 * Spawns a Claude Code agent of the given type for the specified phase.
 * Supports retry with exponential backoff on failure.
 *
 * @param agentType  - Which agent to run: 'plan', 'implement', or 'test'
 * @param phase      - Pipeline phase number
 * @param task       - Task instruction passed to the agent
 * @param options    - Spawn options including timeout, retries, and onLine callback
 * @returns Promise<AgentResult> with exitCode, stdout, stderr, duration, and attempts count
 */
export function spawnAgent(
  agentType: AgentType,
  phase: number,
  task: string,
  options: SpawnOptions = {}
): Promise<AgentResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 0,
    retryDelayMs = 2000,
    onLine,
  } = options;

  const maxAttempts = Math.min(retries + 1, MAX_RETRIES + 1);

  return spawnWithRetry(agentType, phase, task, timeoutMs, retryDelayMs, maxAttempts, onLine);
}

/**
 * Internal retry loop with exponential backoff.
 */
async function spawnWithRetry(
  agentType: AgentType,
  phase: number,
  task: string,
  timeoutMs: number,
  retryDelayMs: number,
  maxAttempts: number,
  onLine?: (line: string, isStderr: boolean) => void
): Promise<AgentResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await spawnAgentOnce(agentType, phase, task, timeoutMs, onLine);

      if (result.exitCode === 0) {
        return { ...result, attempts: attempt };
      }

      lastError = new Error(`Agent ${agentType} exited with code ${result.exitCode}`);

      if (attempt < maxAttempts) {
        const backoffMs = retryDelayMs * Math.pow(2, attempt - 1);
        const logPath = getLogFilePath(agentType, phase);
        appendLog(
          logPath,
          `[RETRY] Attempt ${attempt}/${maxAttempts} failed for ${agentType}, ` +
            `retrying in ${backoffMs}ms (exit code: ${result.exitCode})`
        );
        await sleep(backoffMs);
      }
    } catch (err) {
      lastError = err as Error;

      if (attempt < maxAttempts) {
        const backoffMs = retryDelayMs * Math.pow(2, attempt - 1);
        const logPath = getLogFilePath(agentType, phase);
        appendLog(
          logPath,
          `[RETRY] Attempt ${attempt}/${maxAttempts} failed for ${agentType}: ${lastError.message}, ` +
            `retrying in ${backoffMs}ms`
        );
        await sleep(backoffMs);
      }
    }
  }

  // All retries exhausted
  const logPath = getLogFilePath(agentType, phase);
  appendLog(
    logPath,
    `[FAIL] Agent ${agentType} failed after ${maxAttempts} attempts: ${lastError?.message}`
  );
  return {
    exitCode: 1,
    stdout: '',
    stderr: lastError?.message ?? 'Unknown error',
    duration: 0,
    attempts: maxAttempts,
  };
}

/**
 * Spawns the agent process once (no retry). Returns a promise that resolves
 * when the process exits.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function spawnAgentOnce(
  agentType: AgentType,
  _phase: number,
  task: string,
  timeoutMs: number,
  onLine?: (line: string, isStderr: boolean) => void
): Promise<AgentResult> {
  return new Promise((resolve, reject) => {
    const workDir = getWorkDir(_phase, agentType);
    const logPath = getLogFilePath(agentType, _phase);

    ensureDir(workDir);
    resetLogFile(logPath);

    const startTime = Date.now();

    // Build Claude Code arguments
    // --output-format json-streams gives per-line structured output
    const claudePath = resolveClauclCodePath();
    const args = [
      'code',
      '--output-format', 'json-streams',
      '--agent', agentType,
      '--task', task,
    ];

    const proc = spawn(claudePath, args, {
      cwd: workDir,
      env: {
        ...process.env,
        PATH: NODE_PATH + ':' + (process.env.PATH ?? ''),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    let timedOut = false;

    const timeoutHandle = setTimeout(() => {
      proc.kill('SIGTERM');
      timedOut = true;
      const elapsed = Date.now() - startTime;
      const msg = `Agent ${agentType} timed out after ${timeoutMs}ms (elapsed: ${elapsed}ms)`;
      appendLog(logPath, `[TIMEOUT] ${msg}`);
      reject(new Error(msg));
    }, timeoutMs);

    proc.stdout.on('data', (data: Buffer) => {
      const line = data.toString('utf-8').trim();
      if (line) {
        appendLog(logPath, line);
        stdout += line + '\n';
        onLine?.(line, false);
      }
    });

    proc.stderr.on('data', (data: Buffer) => {
      const line = data.toString('utf-8').trim();
      if (line) {
        appendLog(logPath, `[STDERR] ${line}`);
        stderr += line + '\n';
        onLine?.(line, true);
      }
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timeoutHandle);
      appendLog(logPath, `[ERROR] spawn error: ${err.message}`);
      reject(err);
    });

    proc.on('close', (code: number | null) => {
      // Don't resolve if we already timed out — the timeout's reject is already queued
      if (timedOut) {
        return;
      }
      clearTimeout(timeoutHandle);
      const duration = Date.now() - startTime;
      const exitCode = code ?? 1;
      appendLog(
        logPath,
        `[EXIT] Agent ${agentType} exited with code ${exitCode} after ${duration}ms`
      );
      resolve({
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        duration,
        attempts: 1,
      });
    });
  });
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
