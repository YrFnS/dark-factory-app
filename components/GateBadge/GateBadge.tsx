'use client';

import { useState } from 'react';
import type { GateResult } from '@/types/pipeline';

export type GateBadgeProps = {
  gate: GateResult;
  label: string;
  type: 'lint' | 'types' | 'tests';
};

type GateStatus = 'pending' | 'running' | 'pass' | 'fail';

// Color mapping based on design spec
const STATUS_COLORS: Record<GateStatus, { text: string; icon: string; bg: string; border: string }> = {
  pending: {
    text: '#8b8b94',
    icon: '○',
    bg: 'bg-transparent',
    border: 'border-transparent',
  },
  running: {
    text: '#d9ff00',
    icon: '●',
    bg: 'bg-transparent',
    border: 'border-transparent',
  },
  pass: {
    text: '#22c55e',
    icon: '✓',
    bg: 'bg-transparent',
    border: 'border-transparent',
  },
  fail: {
    text: '#ef4444',
    icon: '✕',
    bg: 'bg-transparent',
    border: 'border-2',
  },
};

/**
 * GateBadge component displays a single quality gate (lint/types/tests).
 * Shows icon + label and handles 4 states: pending, running, pass, fail.
 * Hover shows tooltip with error count and last run time.
 */
export function GateBadge({ gate, label }: GateBadgeProps): JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);

  const status: GateStatus = gate.status;
  const colors = STATUS_COLORS[status];

  // Format timestamp for display
  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  const tooltipContent = (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-tertiary border border-border rounded text-xs whitespace-nowrap z-50">
      <div className="text-text-primary font-medium">{label}</div>
      <div className="text-text-secondary mt-1">
        Last run: {formatTimestamp(gate.lastRun)}
      </div>
      <div className="text-text-secondary">
        Errors: {gate.errorCount ?? 0}
      </div>
      {status === 'fail' && gate.errorCount !== undefined && gate.errorCount > 0 && (
        <div className="text-accent-red mt-1">Click for details</div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded
          transition-all duration-200 ease-out
          ${colors.bg} ${colors.border}
          ${status === 'running' ? 'gate-badge-running' : ''}
          ${status === 'fail' ? 'border-accent-red' : ''}
          hover:bg-bg-tertiary hover:border-border
          focus:outline-none focus:ring-2 focus:ring-accent-amber focus:ring-offset-1 focus:ring-offset-bg-primary
        `}
        style={{ borderColor: status === 'fail' ? '#ef4444' : undefined }}
      >
        <span
          className="font-mono text-sm font-bold"
          style={{ color: colors.text }}
        >
          {colors.icon}
        </span>
        <span
          className="text-sm font-medium"
          style={{ color: colors.text }}
        >
          {label}
        </span>
      </button>

      {/* Tooltip positioned above the badge */}
      {showTooltip && tooltipContent}

      {/* CSS for blue pulse animation */}
      <style jsx>{`
        @keyframes gate-badge-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .gate-badge-running {
          animation: gate-badge-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
