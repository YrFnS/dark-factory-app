'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { PipelineState, PhaseState, GateResult } from '@/types/pipeline';
import type { LogEntry, LogLevel, AgentType } from '@/types/log';

// Re-export LogEntry, LogLevel, AgentType for convenience
export type { LogEntry, LogLevel, AgentType };

/**
 * Action types for the pipeline reducer
 */
export type PipelineAction =
  | { type: 'SET_STATE'; payload: PipelineState }
  | { type: 'UPDATE_PHASE'; payload: { phase: number; updates: Partial<PhaseState> } }
  | { type: 'UPDATE_GATE'; payload: { phase: number; gate: 'lint' | 'types' | 'tests'; updates: Partial<GateResult> } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

/**
 * Extended state interface including loading and error states
 */
interface PipelineContextState {
  state: PipelineState | null;
  loading: boolean;
  error: string | null;
}

/**
 * Initial context state
 */
const initialContextState: PipelineContextState = {
  state: null,
  loading: true,
  error: null,
};

/**
 * Pipeline reducer function
 */
function pipelineReducer(
  contextState: PipelineContextState,
  action: PipelineAction
): PipelineContextState {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...contextState,
        state: action.payload,
        loading: false,
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...contextState,
        error: action.payload,
        loading: false,
      };

    case 'SET_LOADING':
      return {
        ...contextState,
        loading: action.payload,
      };

    case 'UPDATE_PHASE': {
      if (!contextState.state) return contextState;
      const { phase, updates } = action.payload;
      const currentPhase = contextState.state.phases[phase];
      if (!currentPhase) return contextState;

      return {
        ...contextState,
        state: {
          ...contextState.state,
          phases: {
            ...contextState.state.phases,
            [phase]: {
              ...currentPhase,
              ...updates,
            },
          },
        },
      };
    }

    case 'UPDATE_GATE': {
      if (!contextState.state) return contextState;
      const { phase, gate, updates } = action.payload;
      const currentPhase = contextState.state.phases[phase];
      if (!currentPhase) return contextState;

      return {
        ...contextState,
        state: {
          ...contextState.state,
          phases: {
            ...contextState.state.phases,
            [phase]: {
              ...currentPhase,
              gates: {
                ...currentPhase.gates,
                [gate]: {
                  ...currentPhase.gates[gate],
                  ...updates,
                },
              },
            },
          },
        },
      };
    }

    default:
      return contextState;
  }
}

/**
 * Context value interface for consumers
 */
interface PipelineContextValue {
  state: PipelineState | null;
  loading: boolean;
  error: string | null;
  dispatch: Dispatch<PipelineAction>;
}

/**
 * Create the context with undefined default (requires Provider)
 */
const PipelineContext = createContext<PipelineContextValue | undefined>(undefined);

/**
 * Provider component props
 */
interface PipelineProviderProps {
  children: ReactNode;
}

/**
 * Pipeline Provider component
 * Fetches initial state from /api/state on mount
 */
export function PipelineProvider({ children }: PipelineProviderProps): JSX.Element {
  const [contextState, dispatch] = useReducer(pipelineReducer, initialContextState);

  useEffect(() => {
    let isMounted = true;

    const fetchState = async (): Promise<void> => {
      try {
        const response = await fetch('/api/state');
        if (!response.ok) {
          throw new Error(`Failed to fetch state: ${response.status} ${response.statusText}`);
        }
        const data: PipelineState = await response.json();
        if (isMounted) {
          dispatch({ type: 'SET_STATE', payload: data });
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching pipeline state';
          dispatch({ type: 'SET_ERROR', payload: errorMessage });
        }
      }
    };

    fetchState();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: PipelineContextValue = {
    state: contextState.state,
    loading: contextState.loading,
    error: contextState.error,
    dispatch,
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

/**
 * Custom hook to access the pipeline context
 * @throws Error if used outside of PipelineProvider
 */
export function usePipeline(): PipelineContextValue {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
}
