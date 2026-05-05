/**
 * lib/providers/google.ts — Google Vertex AI Imagen Generation.
 * Uses Google Cloud Vertex AI API — requires service account or API key.
 */
import type { GenerateParams, GenerateResult } from './types';

const VERTEX_API_BASE = 'https://vertexai.googleapis.com/v1';

export async function generateWithGoogle(
  params: GenerateParams,
  apiKey: string
): Promise<GenerateResult> {
  const start = Date.now();

  // Determine endpoint based on model
  const modelId = params.model; // e.g. 'imagen-3'
  const project = 'demo-project'; // User would configure this

  // Imagen API endpoint
  const endpoint = `${VERTEX_API_BASE}/projects/${project}/locations/us-central1/publishers/google/models/${modelId}:predict`;

  // Build image prompt
  const prompt = {
    prompt: params.prompt,
    ...(params.aspectRatio ? { aspectRatio: params.aspectRatio } : {}),
    ...(params.width ? { width: params.width } : {}),
    ...(params.height ? { height: params.height } : {}),
    ...(params.numOutputs ? { sampleCount: params.numOutputs } : {}),
    ...(params.style ? { style: params.style } : {}),
  };

  const res = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt: params.prompt }], parameters: prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    return {
      urls: [],
      provider: 'google',
      model: params.model,
      error: err.error?.message ?? `Google API error ${res.status}`,
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
