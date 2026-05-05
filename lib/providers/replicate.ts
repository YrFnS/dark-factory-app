/**
 * lib/providers/replicate.ts — Replicate API for Flux, SDXL, etc.
 * Replicate uses model-specific endpoints. API key is a Replicate token.
 */
import type { GenerateParams, GenerateResult } from './types';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

export async function generateWithReplicate(
  params: GenerateParams,
  apiKey: string
): Promise<GenerateResult> {
  const start = Date.now();

  // Model to Replicate model version mapping
  const modelVersions: Record<string, string> = {
    'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea26252517211f74de3a7b68fe',
    'playground-v2': 'playgroundai/playground-v2-1024px-aesthetic:6fec3419368ef3bab6d7b1d6f9c1c9a9cd0d6f6a4c4e2b5a8c1d3e5f7a9b8c6d',
    'sdxl-turbo': 'stability-ai/sdxl-turbo:2c778e70a07e40a4b7e6ac4b0b8e9d7c5f3a1b8d4e6c2a0f7g3h5i8j9k0l',
    'zeroscope-v2': 'zeroscope-v2:4a5d8c7b3e9f1a2d3c4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
  };

  const modelKey = params.model;
  const modelVersion = modelVersions[modelKey] ?? modelKey;

  // Build input parameters based on model type
  const input: Record<string, unknown> = {
    prompt: params.prompt,
  };

  if (params.width) input.width = params.width;
  if (params.height) input.height = params.height;
  if (params.steps) input.num_inference_steps = params.steps;
  if (params.guidance) input.guidance_scale = params.guidance;
  if (params.seed !== undefined) input.seed = params.seed;
  if (params.numOutputs && params.numOutputs > 1) input.num_outputs = params.numOutputs;

  // Reference images as input image
  if (params.referenceImages?.length) {
    input.input_image = params.referenceImages[0];
  }

  // Create prediction
  const createRes = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: modelVersion, input }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({ error: `HTTP ${createRes.status}` }));
    return {
      urls: [],
      provider: 'replicate',
      model: params.model,
      error: (err as { error?: string }).error ?? `Replicate API error ${createRes.status}`,
    };
  }

  const createData = await createRes.json() as {
    id: string;
    status: string;
    urls?: { get?: string };
  };

  // Poll for completion
  const pollUrl = createData.urls?.get;
  if (!pollUrl) {
    return { urls: [], provider: 'replicate', model: params.model, error: 'No polling URL returned' };
  }

  let status = createData.status;
  let pollCount = 0;
  const maxPolls = 60; // 60 * 5s = 5 minutes max

  while ((status === 'starting' || status === 'processing') && pollCount < maxPolls) {
    await new Promise(r => setTimeout(r, 5000));
    const pollRes = await fetch(pollUrl, {
      headers: { 'Authorization': `Token ${apiKey}` },
    });
    const pollData = await pollRes.json() as { status: string; output?: unknown; error?: string };
    status = pollData.status;
    pollCount++;

    if (status === 'failed') {
      return { urls: [], provider: 'replicate', model: params.model, error: (pollData as { error?: string }).error ?? 'Prediction failed' };
    }
    if (status === 'succeeded') {
      const output = pollData.output;
      const urls: string[] = [];
      if (typeof output === 'string') urls.push(output);
      else if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string') urls.push(item);
        }
      }
      return { urls, provider: 'replicate', model: params.model, processingTimeMs: Date.now() - start };
    }
  }

  return { urls: [], provider: 'replicate', model: params.model, error: 'Prediction timed out' };
}
