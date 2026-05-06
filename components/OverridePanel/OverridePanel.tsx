'use client';

import { useState, useCallback, useRef } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import type { PipelineState } from '@/types/pipeline';
import './styles.css';

type OverrideAction = 'advance' | 'retry' | 'reset';

interface ConfirmationModalProps {
  action: OverrideAction;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  confirmInput: string;
  onConfirmInputChange: (value: string) => void;
  onCancel: () => void;
  onExecute: () => void;
}

function ConfirmationModal({
  action,
  isOpen,
  isLoading,
  error,
  confirmInput,
  onConfirmInputChange,
  onCancel,
  onExecute,
}: ConfirmationModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  const actionLabels: Record<OverrideAction, string> = {
    advance: 'Advance Phase',
    retry: 'Retry Phase',
    reset: 'Reset Pipeline',
  };

  const actionDescriptions: Record<OverrideAction, string> = {
    advance: 'This will advance to the next phase. Make sure the current phase is complete.',
    retry: 'This will reset the current phase and start a new iteration.',
    reset: 'This will reset ALL phases to pending. Type CONFIRM to proceed.',
  };

  const isDestructive = action === 'reset';
  const requiresConfirmInput = action === 'reset';
  const isConfirmValid = confirmInput === 'CONFIRM';

  const canExecute = isLoading || (requiresConfirmInput ? isConfirmValid : true);

  return (
    <div className="override-modal-overlay" onClick={onCancel}>
      <div className="override-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="override-modal-title">
          {actionLabels[action]}
        </h3>

        <p className="override-modal-description">
          {actionDescriptions[action]}
        </p>

        {requiresConfirmInput && (
          <div className="override-modal-confirm-input">
            <label htmlFor="confirm-reset">Type CONFIRM to proceed:</label>
            <input
              id="confirm-reset"
              type="text"
              value={confirmInput}
              onChange={(e) => onConfirmInputChange(e.target.value)}
              placeholder="CONFIRM"
              autoComplete="off"
            />
          </div>
        )}

        {error && (
          <div className="override-modal-error">
            {error}
          </div>
        )}

        <div className="override-modal-actions">
          <button
            type="button"
            className="override-btn override-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`override-btn ${isDestructive ? 'override-btn-danger' : 'override-btn-primary'}`}
            onClick={onExecute}
            disabled={canExecute}
          >
            {isLoading ? (
              <span className="override-btn-loading">
                <span className="override-spinner"></span>
                Executing...
              </span>
            ) : (
              'Execute'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface OverridePanelProps {
  className?: string;
}

/**
 * OverridePanel component with three override controls:
 * - Advance Phase: enabled only when current phase status is 'complete'
 * - Retry Phase: requires button hold (1s) or double-click confirmation
 * - Reset Pipeline: requires typing "CONFIRM" in modal
 */
export default function OverridePanel({ className = '' }: OverridePanelProps): React.ReactElement {
  const { state, dispatch } = usePipeline();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<OverrideAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  // Hold timer for retry button (1 second hold to confirm)
  const retryHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryLastClick = useRef<number>(0);

  const currentPhaseStatus = getCurrentPhaseStatus(state);
  const canAdvance = currentPhaseStatus === 'complete';
  const canRetry = currentPhaseStatus === 'in-progress' || currentPhaseStatus === 'blocked';

  const openModal = useCallback((action: OverrideAction) => {
    setSelectedAction(action);
    setModalOpen(true);
    setError(null);
    setConfirmInput('');
  }, []);

  const closeModal = useCallback(() => {
    if (isLoading) return;
    setModalOpen(false);
    setSelectedAction(null);
    setError(null);
    setConfirmInput('');
  }, [isLoading]);

  const handleExecute = useCallback(async () => {
    if (!selectedAction || !state) return;

    setIsLoading(true);
    setError(null);

    try {
      const body: { action: OverrideAction; phase?: number } = {
        action: selectedAction,
      };

      if (selectedAction === 'retry') {
        body.phase = state.currentPhase;
      }

      const response = await fetch('/api/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${selectedAction}`);
      }

      // Refresh state
      dispatch({ type: 'SET_STATE', payload: data });
      closeModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAction, state, dispatch, closeModal]);

  // Retry hold/double-click handlers
  const handleRetryMouseDown = useCallback(() => {
    if (!canRetry) return;
    retryHoldTimer.current = setTimeout(() => {
      // Hold confirmed — open modal immediately
      openModal('retry');
    }, 1000);
  }, [canRetry, openModal]);

  const handleRetryMouseUp = useCallback(() => {
    if (retryHoldTimer.current) {
      clearTimeout(retryHoldTimer.current);
      retryHoldTimer.current = null;
    }
  }, []);

  const handleRetryMouseLeave = useCallback(() => {
    if (retryHoldTimer.current) {
      clearTimeout(retryHoldTimer.current);
      retryHoldTimer.current = null;
    }
  }, []);

  const handleRetryClick = useCallback(() => {
    if (!canRetry) return;
    const now = Date.now();
    // Double-click: if last click was within 300ms, trigger immediately
    if (now - retryLastClick.current < 300) {
      if (retryHoldTimer.current) {
        clearTimeout(retryHoldTimer.current);
        retryHoldTimer.current = null;
      }
      openModal('retry');
    } else {
      // Otherwise wait for possible hold — don't open on single click
      // The hold timer will open it after 1s
      retryLastClick.current = now;
    }
  }, [canRetry, openModal]);

  return (
    <>
      <div className={`override-panel ${className}`}>
        <h3 className="override-panel-title">Pipeline Controls</h3>

        <div className="override-panel-buttons">
          <button
            type="button"
            className="override-btn override-btn-primary"
            onClick={() => openModal('advance')}
            disabled={!canAdvance}
            title={canAdvance ? 'Advance to the next phase' : 'Current phase must be complete to advance'}
          >
            Advance Phase
          </button>

          {/* Retry: hold (1s) or double-click to confirm */}
          <button
            type="button"
            className="override-btn override-btn-primary"
            onClick={handleRetryClick}
            onMouseDown={handleRetryMouseDown}
            onMouseUp={handleRetryMouseUp}
            onMouseLeave={handleRetryMouseLeave}
            onDoubleClick={() => canRetry && openModal('retry')}
            disabled={!canRetry}
            title={
              canRetry
                ? 'Retry the current phase — hold for 1s or double-click to confirm'
                : 'Current phase must be in-progress or blocked to retry'
            }
          >
            Retry Phase
          </button>

          <button
            type="button"
            className="override-btn override-btn-danger"
            onClick={() => openModal('reset')}
            title="Reset all phases to pending"
          >
            Reset Pipeline
          </button>
        </div>
      </div>

      <ConfirmationModal
        action={selectedAction || 'advance'}
        isOpen={modalOpen}
        isLoading={isLoading}
        error={error}
        confirmInput={confirmInput}
        onConfirmInputChange={setConfirmInput}
        onCancel={closeModal}
        onExecute={handleExecute}
      />
    </>
  );
}

function getCurrentPhaseStatus(state: PipelineState | null): string {
  if (!state) return 'pending';
  const phaseData = state.phases[state.currentPhase];
  return phaseData?.status || 'pending';
}
