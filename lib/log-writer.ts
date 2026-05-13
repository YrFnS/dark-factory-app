import * as fs from 'fs';
import * as path from 'path';

/** Reads the current phase number from the pipeline state file. */
function readPhaseFromState(statePath: string): number {
  try {
    const content: string = fs.readFileSync(statePath, 'utf-8');
    const state = JSON.parse(content) as { currentPhase: number };
    return state.currentPhase;
  } catch (err) {
    console.error(`[log-writer] Failed to read phase from state file ${statePath}:`, err);
    return 0;
  }
}

/**
 * Append-only logger that writes structured log entries to rolling files
 * organized by agent and pipeline phase.
 */
export class LogWriter {
  /** Full path to the log file. */
  private readonly logFilePath: string;

  /** Agent name used in log entry prefix. */
  private readonly agent: string;

  /** Current phase number used in log entry prefix. */
  private readonly phase: number;

  /** Whether debug-level logging is enabled via environment variable. */
  private readonly debugEnabled: boolean;

  /**
   * Creates a new LogWriter instance.
   * @param logDir - Directory where log files are stored (e.g., "logs").
   * @param agent - Identifier for the agent (e.g., "orchestrator").
   */
  constructor(logDir: string, agent: string) {
    this.agent = agent;
    this.debugEnabled = process.env.DEBUG === '1';

    // Resolve pipeline state relative to project root
    const projectRoot: string = path.resolve(process.cwd(), '..');
    const statePath: string = path.join(projectRoot, 'dark-factory-app', 'pipeline', 'state.json');
    this.phase = readPhaseFromState(statePath);

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logFilePath = path.join(logDir, `${agent}-${this.phase}.log`);
  }

  /**
   * Appends an info-level log entry.
   * @param message - The message to log.
   */
  public info(message: string): void {
    this.write('INFO', message);
  }

  /**
   * Appends a warn-level log entry.
   * @param message - The message to log.
   */
  public warn(message: string): void {
    this.write('WARN', message);
  }

  /**
   * Appends an error-level log entry.
   * @param message - The message to log.
   */
  public error(message: string): void {
    this.write('ERROR', message);
  }

  /**
   * Appends a debug-level log entry iff DEBUG=1 is set.
   * @param message - The message to log.
   */
  public debug(message: string): void {
    if (this.debugEnabled) {
      this.write('DEBUG', message);
    }
  }

  /**
   * Writes a formatted entry to the log file.
   * Format: [ISO8601] [AGENT] [PHASE-N] LEVEL: message
   */
  private write(level: string, message: string): void {
    const timestamp: string = new Date().toISOString();
    const entry: string = `[${timestamp}] [${this.agent}] [PHASE-${this.phase}] ${level}: ${message}\n`;
    fs.appendFileSync(this.logFilePath, entry);
  }
}
