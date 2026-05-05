/**
 * lib/providers/muapi.ts — Muapi.ai gateway.
 * Unified gateway for various open-source models via Muapi service.
 */
import type { GenerateParams, GenerateResult } from './types';

const MUAPI_BASE = 'https://api.muapi.ai/v1';

export async function generateWithMuapi(
  params: GenerateParams,
  apiKey: string
): Promise<GenerateResult> {
  const start = Date.now();

  // Muapi model ID mapping
  const muapiModelMap: Record<string, string> = {
    'modelscope': 'modelscope/text-to-video',
    'text2video-zero': 'text2video-zero/text2video-zero',
    'sdxl-turbo': 'stability-ai/sdxl-turbo',
  };

  const muapiModel = muapiModelMap[params.model] ?? params.model;

  const body: Record<string, unknown> = {
    model: muapiModel,
    prompt: params.prompt,
  };

  if (params.width) body.width = params.width;
  if (params.height) body.height = params.height;
  if (params.steps) body.num_inference_steps = params.steps;
  if (params.seed !== undefined) body.seed = params.seed;
  if (params.numOutputs && params.numOutputs > 1) body.num_outputs = params.numOutputs;
  if (params.referenceImages?.length) body.input_image = params.referenceImages[0];

  const res = await fetch(`${MUAPI_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    return {
      urls: [],
      provider: 'muapi',
      model: params.model,
      error: (err as { error?: { message?: string } }).error?.message ?? `Muapi API error ${res.status}`,
    };
  }

  const data = await res.json() as {
    outputs?: Array<{ url?: string; b64?: string; mimeType?: string }>;
    result?: { url?: string };
    error?: { message: string };
  };

  if (data.error) {
    return { urls: [], provider: 'muapi', model: params.model, error: data.error.message };
  }

  const urls: string[] = [];

  if (Array.isArray(data.outputs)) {
    for (const item of data.outputs) {
      if (item.url) urls.push(item.url);
      else if (item.b64) {
        const mime = item.mimeType ?? 'image/png';
        urls.push(`data:${mime};base64,${item.b64}`);
      }
    }
  } else if (data.result?.url) {
    urls.push(data.result.url);
  }

  return {
    urls,
    provider: 'muapi',
    model: params.model,
    processingTimeMs: Date.now() - start,
  };
}
