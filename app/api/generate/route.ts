/**
 * POST /api/generate — Unified image/video generation endpoint.
 * Phase 5: full provider dispatch.
 *
 * Request body: { model, provider, prompt, width?, height?, aspectRatio?,
 *                  quality?, style?, steps?, guidance?, referenceImages?, seed?, numOutputs? }
 *
 * API key is read from:
 *   - Header `x-api-key` (preferred — stored client-side in localStorage)
 *   - Falls back to the Authorization header as a bearer token
 *
 * Providers: openai | google | replicate | muapi
 */
import { NextResponse } from 'next/server';
import { generateWithOpenAI } from '@/lib/providers/openai';
import { generateWithGoogle } from '@/lib/providers/google';
import { generateWithReplicate } from '@/lib/providers/replicate';
import { generateWithMuapi } from '@/lib/providers/muapi';
import type { GenerateParams, ProviderName } from '@/lib/providers/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    // Extract required fields
    const model = body.model as string;
    const provider = body.provider as ProviderName;
    const prompt = body.prompt as string;

    if (!model || !provider || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: model, provider, prompt' },
        { status: 400 }
      );
    }

    // Read API key
    const apiKey = (request.headers.get('x-api-key')
      ?? request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')) as string | null;

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 401 });
    }

    // Build generation params — only include fields that are defined
    const params: GenerateParams = {
      model,
      provider,
      prompt,
      ...(body.width !== undefined ? { width: body.width as number } : {}),
      ...(body.height !== undefined ? { height: body.height as number } : {}),
      ...(body.aspectRatio ? { aspectRatio: body.aspectRatio as string } : {}),
      ...(body.quality ? { quality: body.quality as 'low' | 'standard' | 'high' } : {}),
      ...(body.style ? { style: body.style as string } : {}),
      ...(body.steps !== undefined ? { steps: body.steps as number } : {}),
      ...(body.guidance !== undefined ? { guidance: body.guidance as number } : {}),
      ...(body.seed !== undefined ? { seed: body.seed as number } : {}),
      ...(body.numOutputs !== undefined ? { numOutputs: body.numOutputs as number } : {}),
      ...(Array.isArray(body.referenceImages) ? { referenceImages: body.referenceImages as string[] } : {}),
      ...(body.image ? { image: body.image as string } : {}),
      ...(body.mask ? { mask: body.mask as string } : {}),
    };

    // Dispatch to correct provider
    let result;
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(params, apiKey);
        break;
      case 'google':
        result = await generateWithGoogle(params, apiKey);
        break;
      case 'replicate':
        result = await generateWithReplicate(params, apiKey);
        break;
      case 'muapi':
        result = await generateWithMuapi(params, apiKey);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
