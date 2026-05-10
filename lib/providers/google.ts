/**
 * lib/providers/google.ts — Google AiStudio/Gemini Imagen Generation.
 * Uses Google AiStudio API (generativelanguage.googleapis.com) with API key as query param.
 */
import type { GenerateParams, GenerateResult } from './types';

const AISTUDIO_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate images using Google's Imagen models via AiStudio API.
 *
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predict?key={API_KEY}
 * Body: { "instances": [{ "prompt": "..." }], "parameters": { ... } }
 * Response: { "predictions": [{ "bytesBase64Encoded": "...", "mimeType": "image/png" }] }
 */
export async function generateWithGoogle(
  params: GenerateParams,
  apiKey: string
): Promise<GenerateResult> {
  const start = Date.now();

  // Map short model id to full AiStudio model name
  const modelId = resolveModelId(params.model);

  const endpoint = `${AISTUDIO_API_BASE}/models/${modelId}:predict`;

  // Build parameters based on what's provided
  const generationConfig: Record<string, unknown> = {};

  if (params.aspectRatio) {
    generationConfig.aspectRatio = params.aspectRatio;
  }
  if (params.width && params.height) {
    // Some models support explicit dimensions; pass as imageSize if aspectRatio not used
    generationConfig.imageSize = { width: params.width, height: params.height };
  }
  if (params.numOutputs) {
    generationConfig.sampleCount = params.numOutputs;
  }
  if (params.style) {
    generationConfig.style = params.style;
  }

  const body = {
    instances: [{ prompt: params.prompt }],
    parameters: generationConfig,
  };

  let res: Response;
  try {
    res = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      urls: [],
      provider: 'google',
      model: params.model,
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    let errMsg = `Google API error ${res.status}`;
    try {
      const errData = await res.json() as { error?: { message?: string } };
      if (errData.error?.message) {
        errMsg = errData.error.message;
      }
    } catch {
      // ignore parse error
    }
    return {
      urls: [],
      provider: 'google',
      model: params.model,
      error: errMsg,
    };
  }

  const data = await res.json() as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    error?: { message: string };
  };

  if (data.error) {
    return { urls: [], provider: 'google', model: params.model, error: data.error.message };
  }

  const urls: string[] = [];
  for (const pred of data.predictions ?? []) {
    if (pred.bytesBase64Encoded) {
      const mime = pred.mimeType ?? 'image/png';
      urls.push(`data:${mime};base64,${pred.bytesBase64Encoded}`);
    }
  }

  return {
    urls,
    provider: 'google',
    model: params.model,
    processingTimeMs: Date.now() - start,
  };
}

/**
 * Resolve short model id (e.g. 'imagen-3', 'imagen-4') to full AiStudio model name.
 */
function resolveModelId(shortId: string): string {
  const modelMap: Record<string, string> = {
    'imagen-4': 'imagen-4.0-generate-001',
    'imagen-3': 'imagen-3.0-generate-001',
  };
  return modelMap[shortId] ?? shortId;
}