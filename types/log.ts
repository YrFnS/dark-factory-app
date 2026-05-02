/**
 * Log Entry Type Definitions
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
export type AgentType = 'orchestrator' | 'plan' | 'implement' | 'test';

export interface LogEntry {
  timestamp: string;
  agent: AgentType;
  phase: string;
  level: LogLevel;
  message: string;
}
