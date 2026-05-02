import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import type { PipelineState } from '$lib/types';

export async function GET(): Promise<NextResponse<PipelineState | { error: string }>> {
  const statePath = path.join(process.cwd(), 'pipeline', 'state.json');

  let fileContents: string;
  try {
    fileContents = await fs.readFile(statePath, 'utf-8');
  } catch {
    return NextResponse.json(
      { error: 'State file not found' },
      { status: 500 }
    );
  }

  let state: PipelineState;
  try {
    state = JSON.parse(fileContents) as PipelineState;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in state file' },
      { status: 500 }
    );
  }

  return NextResponse.json(state, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
