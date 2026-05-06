'use client';

import { usePipeline } from '@/context/PipelineContext';

/**
 * Format a timestamp to YYYY-MM-DD HH:MM:SS in local time
 */
function formatTimestamp(timestamp: string | undefined | null): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return timestamp;
  }
}

/**
 * CronStatusBar displays cron schedule information from pipeline state.
 * Shows next run time, last run time with outcome, and a trigger button.
 */
export function CronStatusBar(): React.ReactElement {
  const { state } = usePipeline();

  const isRunInProgress = state?.phases
    ? Object.values(state.phases).some((phase) => phase.status === 'in-progress')
    : false;

  const nextRunDisplay = state?.nextCronRun
    ? formatTimestamp(state.nextCronRun)
    : 'Not scheduled';

  const lastRunDisplay = state?.lastCronRun
    ? `${formatTimestamp(state.lastCronRun)}`
    : 'Never run';

  const handleTriggerNow = async (): Promise<void> => {
    try {
      const response = await fetch('/api/phase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'advance' }),
      });
      if (!response.ok) {
        console.error('Failed to trigger phase advancement:', response.statusText);
      }
    } catch (err) {
      console.error('Error triggering phase advancement:', err);
    }
  };

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-t border-border"
      style={{ backgroundColor: '#161618' }}
    >
      {/* Amber dot indicator when run is in progress */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isRunInProgress ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: isRunInProgress ? '#f59e0b' : '#3f3f46' }}
        />
      </div>

      {/* Next run timestamp */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">Next run:</span>
        <span
          className="font-mono text-sm"
          style={{ color: '#e8e8ec' }}
        >
          {nextRunDisplay}
        </span>
      </div>

      {/* Divider */}
      <div
        className="w-px h-4"
        style={{ backgroundColor: '#3f3f46' }}
      />

      {/* Last run timestamp and outcome */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">Last run:</span>
        <span
          className="font-mono text-sm"
          style={{ color: '#e8e8ec' }}
        >
          {lastRunDisplay}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Trigger Now button */}
      <button
        type="button"
        onClick={handleTriggerNow}
        className="px-3 py-1 text-sm font-medium rounded border transition-colors duration-200 hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-accent-amber focus:ring-offset-1 focus:ring-offset-bg-primary"
        style={{
          borderColor: '#3f3f46',
          color: '#f59e0b',
        }}
      >
        Trigger Now
      </button>
    </div>
  );
}
