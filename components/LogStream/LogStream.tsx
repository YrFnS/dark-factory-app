'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { LogEntry, LogLevel, AgentType } from '@/types/log';
import './styles.css';

const AGENTS: AgentType[] = ['orchestrator', 'plan', 'implement', 'test'];
const LEVELS: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

interface LogStreamProps {
  className?: string;
}

/**
 * LogStream component that connects to the SSE endpoint and renders log entries
 * in real-time with filtering capabilities.
 */
export default function LogStream({ className = '' }: LogStreamProps): JSX.Element {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [agentFilter, setAgentFilter] = useState<AgentType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Connect to SSE endpoint
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    const connect = (): void => {
      eventSource = new EventSource('/api/logs/stream');

      eventSource.onmessage = (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const entry: LogEntry = JSON.parse(event.data);
          setLogs((prev) => [...prev, entry]);
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Reconnect after a delay if still mounted
        if (isMounted) {
          setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Auto-scroll to bottom when not hovering
  useEffect(() => {
    if (!isHovering && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isHovering]);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by agent
      if (agentFilter !== 'all' && log.agent !== agentFilter) {
        return false;
      }

      // Filter by level
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }

      // Filter out DEBUG unless showDebug is enabled
      if (log.level === 'DEBUG' && !showDebug) {
        return false;
      }

      // Filter by search query (case-insensitive)
      if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [logs, agentFilter, levelFilter, searchQuery, showDebug]);

  // Extract HH:MM:SS from full timestamp
  const formatTimestamp = useCallback((timestamp: string): string => {
    // Expected format: [HH:MM:SS] - extract from the bracketed timestamp
    const match = timestamp.match(/\[?(\d{2}:\d{2}:\d{2})\]?/);
    return match?.[1] ?? timestamp.substring(0, 8);
  }, []);

  // Get CSS class for log level
  const getLevelClass = useCallback((level: LogLevel): string => {
    switch (level) {
      case 'INFO':
        return 'log-level-info';
      case 'WARN':
        return 'log-level-warn';
      case 'ERROR':
        return 'log-level-error';
      case 'DEBUG':
        return 'log-level-debug';
      default:
        return '';
    }
  }, []);

  return (
    <div className={`log-stream ${className}`}>
      {/* Filter Controls */}
      <div className="log-stream-controls">
        <div className="log-stream-filter">
          <label htmlFor="agent-filter">Agent:</label>
          <select
            id="agent-filter"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value as AgentType | 'all')}
          >
            <option value="all">All Agents</option>
            {AGENTS.map((agent) => (
              <option key={agent} value={agent}>
                {agent.charAt(0).toUpperCase() + agent.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="log-stream-filter">
          <label htmlFor="level-filter">Level:</label>
          <select
            id="level-filter"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
          >
            <option value="all">All Levels</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="log-stream-filter log-stream-search">
          <label htmlFor="search-input">Search:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Filter by message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="log-stream-filter log-stream-debug-toggle">
          <label>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            Show DEBUG
          </label>
        </div>
      </div>

      {/* Log Display Area */}
      <div
        ref={containerRef}
        className="log-stream-container"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {filteredLogs.length === 0 ? (
          <div className="log-stream-empty">
            {logs.length === 0
              ? 'Waiting for log entries...'
              : 'No log entries match the current filters.'}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`log-entry ${getLevelClass(log.level)}`}
            >
              <span className="log-timestamp">[{formatTimestamp(log.timestamp)}]</span>
              <span className="log-agent">[{log.agent.toUpperCase()}]</span>
              <span className="log-phase">[{log.phase}]</span>
              <span className="log-level-label">{log.level}:</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Status Bar */}
      <div className="log-stream-status">
        <span>
          Showing {filteredLogs.length} of {logs.length} entries
        </span>
        {isHovering && <span className="log-stream-paused">Paused</span>}
      </div>
    </div>
  );
}
