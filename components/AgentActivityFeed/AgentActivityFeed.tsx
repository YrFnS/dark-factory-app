'use client';

import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/pipeline/phase-3/code/lib/agent-log-stream';

interface AgentActivity {
  agent: string;
  phase: number;
  status: 'idle' | 'running' | 'success' | 'failure';
  startTime: string | null;
  exitCode: number | null;
  duration: number | null;
  outputLines: string[];
}

interface AgentActivityFeedProps {
  phaseNumber: number;
}

const AGENT_TYPES = ['plan', 'implement', 'test'] as const;

function createInitialActivities(phase: number): Record<string, AgentActivity> {
  return Object.fromEntries(
    AGENT_TYPES.map((t) => [
      t,
      { agent: t, phase, status: 'idle', startTime: null, exitCode: null, duration: null, outputLines: [] },
    ])
  ) as Record<string, AgentActivity>;
}

export function AgentActivityFeed({ phaseNumber }: AgentActivityFeedProps): JSX.Element {
  const [activities, setActivities] = useState<Record<string, AgentActivity>>(
    createInitialActivities(phaseNumber)
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource('/api/logs/stream');
    eventSourceRef.current = es;

    es.onmessage = (event: MessageEvent) => {
      try {
        const entry: LogEntry = JSON.parse(event.data as string);
        if (!entry || typeof entry.agent !== 'string') return;

        const agentKey = entry.agent.toLowerCase();
        if (!AGENT_TYPES.includes(agentKey as typeof AGENT_TYPES[number])) return;

        setActivities((prev) => {
          const current = prev[agentKey];
          if (!current) return prev;

          const newLines = [...current.outputLines, entry.message].slice(-100);
          let updated: AgentActivity = { ...current, outputLines: newLines };

          if (entry.message.startsWith('[EXIT]') || entry.message.includes('exited with code')) {
            const exitMatch = entry.message.match(/exited with code (\d+)/);
            if (exitMatch) {
              const code = parseInt(exitMatch[1] ?? '1', 10);
              updated = { ...updated, status: code === 0 ? 'success' : 'failure', exitCode: code };
            }
          } else if (entry.level === 'STDERR' || entry.message.startsWith('[ERROR]')) {
            updated = { ...updated, status: 'running' };
          } else if (entry.message.startsWith('[TIMEOUT]')) {
            updated = { ...updated, status: 'failure' };
          } else if (current.status === 'idle') {
            updated = { ...updated, status: 'running', startTime: entry.timestamp };
          }

          return { ...prev, [agentKey]: updated };
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => es.close();

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [phaseNumber]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [activities]);

  return (
    <div className="agent-activity-feed">
      <div className="feed-header">
        <h3 className="feed-title">Agent Activity</h3>
        <span className="feed-phase">Phase {phaseNumber}</span>
      </div>

      <div className="feed-list" ref={scrollRef}>
        {AGENT_TYPES.map((agentType) => {
          const activity = activities[agentType];
          if (!activity) return null;
          return (
            <div key={agentType} className={`feed-item feed-item--${activity.status}`}>
              <div className="feed-item-header">
                <span className="feed-item-type">{agentType}</span>
                <span className={`feed-item-status badge--${activity.status}`}>{activity.status}</span>
                {activity.startTime && (
                  <span className="feed-item-time">{new Date(activity.startTime).toLocaleTimeString()}</span>
                )}
                {activity.duration && (
                  <span className="feed-item-duration">{(activity.duration / 1000).toFixed(1)}s</span>
                )}
                {activity.exitCode !== null && (
                  <span className="feed-item-exit">exit {activity.exitCode}</span>
                )}
              </div>
              <div className="feed-item-output">
                {activity.outputLines.length === 0 ? (
                  <span className="feed-item-empty">No output yet</span>
                ) : (
                  activity.outputLines.map((line, i) => (
                    <pre key={i} className="feed-line">{line}</pre>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .agent-activity-feed {
          background: #161618;
          border-radius: 4px;
          border: 1px solid #2a2a2e;
          display: flex;
          flex-direction: column;
          max-height: 480px;
        }
        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #2a2a2e;
        }
        .feed-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #8b8b94;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .feed-phase { font-size: 0.7rem; color: #555; font-variant-numeric: tabular-nums; }
        .feed-list { overflow-y: auto; flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
        .feed-item { border-radius: 4px; border: 1px solid #2a2a2e; overflow: hidden; }
        .feed-item--running { border-color: #d9ff00; }
        .feed-item--success { border-color: #22c55e; }
        .feed-item--failure { border-color: #ef4444; }
        .feed-item--idle { border-color: #2a2a2e; }
        .feed-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #0d0d0f;
          font-size: 0.75rem;
        }
        .feed-item-type { font-weight: 600; color: #ccc; text-transform: uppercase; }
        .feed-item-status {
          font-size: 0.65rem;
          padding: 1px 6px;
          border-radius: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge--running { background: #1e3a5f; color: #60a5fa; }
        .badge--success { background: #14532d; color: #4ade80; }
        .badge--failure { background: #7f1d1d; color: #f87171; }
        .badge--idle { background: #1a1a1d; color: #555; }
        .feed-item-time,
        .feed-item-duration,
        .feed-item-exit {
          color: #666;
          font-size: 0.65rem;
          margin-left: auto;
          font-variant-numeric: tabular-nums;
        }
        .feed-item-duration { margin-right: 8px; }
        .feed-item-output {
          padding: 6px 10px;
          max-height: 120px;
          overflow-y: auto;
          background: #0a0a0c;
        }
        .feed-item-empty { color: #444; font-size: 0.7rem; font-style: italic; }
        .feed-line {
          margin: 0;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 0.65rem;
          color: #888;
          white-space: pre-wrap;
          word-break: break-all;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
