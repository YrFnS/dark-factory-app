import { NextResponse } from 'next/server';
import * as StateStore from '$lib/state-store';
import type { PipelineState } from '$lib/types';

interface PhaseActionRequest {
  action: 'advance' | 'retry' | 'reset';
  phase?: number;
}

/**
 * POST /api/phase
 * Accepts { action: 'advance' | 'retry' | 'reset', phase?: number }
 * Validates action is legal given current pipeline state.
 * Returns updated state after successful action.
 */
export async function POST(
  request: Request
): Promise<NextResponse<PipelineState | { error: string }>> {
  let body: PhaseActionRequest;

  try {
    body = (await request.json()) as PhaseActionRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, phase } = body;

  // Validate action is a known action
  if (!action || !['advance', 'retry', 'reset'].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'advance', 'retry', or 'reset'" },
      { status: 400 }
    );
  }

  try {
    const state = StateStore.loadState();

    switch (action) {
      case 'advance': {
        const currentPhaseKey = String(state.currentPhase);
        const currentPhaseData = state.phases[currentPhaseKey];

        if (!currentPhaseData) {
          return NextResponse.json(
            { error: `Phase ${state.currentPhase} not found in state` },
            { status: 400 }
          );
        }

        if (currentPhaseData.status !== 'complete') {
          return NextResponse.json(
            {
              error: `Cannot advance: current phase ${state.currentPhase} is '${currentPhaseData.status}', expected 'complete'`,
            },
            { status: 400 }
          );
        }

        const newPhase = StateStore.advancePhase();
        console.info(`[api/phase] Advanced to phase ${newPhase}`);

        const updatedState = StateStore.loadState();
        return NextResponse.json(updatedState);
      }

      case 'retry': {
        if (phase === undefined || phase === null) {
          return NextResponse.json(
            { error: 'Phase number is required for retry action' },
            { status: 400 }
          );
        }

        const phaseKey = String(phase);
        const phaseData = state.phases[phaseKey];

        if (!phaseData) {
          return NextResponse.json(
            { error: `Phase ${phase} not found in state` },
            { status: 400 }
          );
        }

        const newIteration = phaseData.iteration + 1;

        StateStore.updatePhase(phase, {
          status: 'in-progress',
          iteration: newIteration,
          gates: {
            lint: { status: 'pending' },
            types: { status: 'pending' },
            tests: { status: 'pending' },
          },
        });

        console.info(`[api/phase] Retrying phase ${phase}, iteration ${newIteration}`);

        const updatedState = StateStore.loadState();
        return NextResponse.json(updatedState);
      }

      case 'reset': {
        for (const phaseKey of Object.keys(state.phases)) {
          const phaseNum = Number(phaseKey);
          StateStore.updatePhase(phaseNum, {
            status: 'pending',
            iteration: 0,
            gates: {
              lint: { status: 'pending' },
              types: { status: 'pending' },
              tests: { status: 'pending' },
            },
          });
        }

        state.currentPhase = 0;
        StateStore.saveState(state);

        console.info('[api/phase] Pipeline reset - all phases pending, currentPhase set to 0');

        const updatedState = StateStore.loadState();
        return NextResponse.json(updatedState);
      }

      default:
        // This should never happen due to the validation above
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error(`[api/phase] State-store error: ${(err as Error).message}`);
    return NextResponse.json(
      { error: `State-store error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
