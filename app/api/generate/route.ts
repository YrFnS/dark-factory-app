/**
 * POST /api/generate — Image/video generation endpoint.
 *
 * Phase 3 stub: returns { error: 'not implemented' }.
 * Full provider dispatch is Phase 5.
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate minimal shape — real validation comes in Phase 5
    if (!body.type || !body.model || !body.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: type, model, prompt' },
        { status: 400 }
      );
    }
    // Stub response — image/video generation not implemented yet
    return NextResponse.json(
      { error: 'Generation not implemented yet. This stub will be replaced in Phase 5.' },
      { status: 501 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
