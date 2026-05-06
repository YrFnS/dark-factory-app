'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import { PhaseTimeline } from '@/components/PhaseTimeline';
import { PhaseDetail } from '@/components/PhaseDetail';
import { QualityGates } from '@/components/QualityGates';
import LogStream from '@/components/LogStream';
import OverridePanel from '@/components/OverridePanel';
import { CronStatusBar } from '@/components/CronStatusBar';
import type { PhaseStatus } from '@/types/pipeline';
import styles from './dashboard.module.css';

const PHASE_NAMES: Record<number, string> = {
  0: 'Init',
  1: 'Core Orchestrator',
  2: 'Dashboard UI',
  3: 'Agent Integration',
  4: 'Polish & Hardening',
  5: 'Finalize',
};

function getStatusLabel(status: PhaseStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in-progress':
      return 'In Progress';
    case 'complete':
      return 'Complete';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

export default function HomePage(): React.ReactElement {
  const { state, loading, error, dispatch } = usePipeline();
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  // Auto-refresh state every 10 seconds
  useEffect(() => {
    const fetchState = async (): Promise<void> => {
      try {
        const response = await fetch('/api/state');
        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'SET_STATE', payload: data });
        }
      } catch {
        // Silently ignore fetch errors during polling
      }
    };

    const intervalId = setInterval(fetchState, 10000);
    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Handle phase selection from timeline
  const handlePhaseSelect = useCallback((phaseNumber: number) => {
    setSelectedPhase(phaseNumber === selectedPhase ? null : phaseNumber);
  }, [selectedPhase]);

  // Determine which phase to display
  const displayPhase = selectedPhase ?? state?.currentPhase ?? 0;
  const currentPhaseName = PHASE_NAMES[state?.currentPhase ?? 0] || 'Unknown';
  const displayPhaseData = state?.phases[displayPhase];
  const displayPhaseStatus: PhaseStatus = displayPhaseData?.status ?? 'pending';

  // Loading state
  if (loading && !state) {
    return (
      <main className={styles.dashboard}>
        <header className={styles.header}>
          <span className={styles.logo}>DARK FACTORY</span>
        </header>
        <div className={styles.phaseDetailPlaceholder}>
          <p>Loading pipeline state...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !state) {
    return (
      <main className={styles.dashboard}>
        <header className={styles.header}>
          <span className={styles.logo}>DARK FACTORY</span>
        </header>
        <div className={styles.phaseDetailPlaceholder}>
          <h3>Error</h3>
          <p className={styles.phaseStatus}>{error}</p>
        </div>
      </main>
    );
  }

  // No state available
  if (!state) {
    return (
      <main className={styles.dashboard}>
        <header className={styles.header}>
          <span className={styles.logo}>DARK FACTORY</span>
        </header>
        <div className={styles.phaseDetailPlaceholder}>
          <p>No pipeline state available</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>DARK FACTORY</span>

        <div className={styles.phaseIndicator}>
          <span>Phase: {state.currentPhase}/5</span>
          <span>—</span>
          <span>{currentPhaseName}</span>
        </div>

        <span className={`${styles.statusBadge} ${styles[displayPhaseStatus]}`}>
          {getStatusLabel(displayPhaseStatus)}
        </span>

        <div className={styles.headerSpacer} />

        <OverridePanel />
      </header>

      {/* Cron Status Bar */}
      <CronStatusBar />

      {/* Main Content Grid */}
      <div className={styles.mainContent}>
        {/* Left Column - Pipeline Timeline */}
        <section className={styles.pipelineColumn}>
          <h2>Pipeline Timeline</h2>
          <PhaseTimeline
            pipelineState={state}
            onPhaseSelect={handlePhaseSelect}
          />
        </section>

        {/* Right Column - Phase Detail + Quality Gates */}
        <section className={styles.detailColumn}>
          {/* Phase Detail */}
          <div className={styles.phaseDetail}>
            <PhaseDetail phaseNumber={displayPhase} />
          </div>

          {/* Quality Gates */}
          <div className={styles.qualityGates}>
            <QualityGates phaseNumber={displayPhase} />
          </div>
        </section>
      </div>

      {/* Log Stream */}
      <div className={styles.logStream}>
        <LogStream />
      </div>
    </main>
  );
}
