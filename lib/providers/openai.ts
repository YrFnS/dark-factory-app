/**
 * lib/providers/openai.ts — OpenAI Image Generation.
 * Supports: DALL-E 3, GPT-Image 1 via /v1/images/generations
 */
import type { GenerateParams, GenerateResult } from './types';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export async function generateWithOpenAI(
  params: GenerateParams,
  apiKey: string
): Promise<GenerateResult> {
  const start = Date.now();

  // Map model ID to OpenAI model name
  const modelMap: Record<string, string> = {
    'dall-e-3': 'dall-e-3',
    'dall-e-2': 'dall-e-2',
    // GPT-Image model if present
    'gpt-image-1': 'gpt-image-1',
  };
  const model = modelMap[params.model] ?? params.model;

  // Build request body
  const body: Record<string, unknown> = {
    model,
    prompt: params.prompt,
    n: params.numOutputs ?? 1,
  };

  // DALL-E 3 supports size, quality, style
  if (params.model === 'dall-e-3') {
    const size = params.width && params.height ? `${params.width}x${params.height}` : '1024x1024';
    body.size = size;
    if (params.quality) body.quality = params.quality === 'high' ? 'hd' : 'standard';
    if (params.style) body.style = params.style;
  } else if (params.model === 'dall-e-2') {
    body.size = params.width && params.height ? `${params.width}x${params.height}` : '1024x1024';
  }

  const res = await fetch(`${OPENAI_API_BASE}/images/generations`, {
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
      provider: 'openai',
      model: params.model,
      error: err.error?.message ?? `OpenAI API error ${res.status}`,
    };
  }

  const data = await res.json() as {
    data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
  };

  const urls: string[] = [];
  const warnings: string[] = [];

  for (const item of data.data) {
    if (item.url) {
      urls.push(item.url);
    } else if (item.b64_json) {
      // Convert base64 to data URL
      const mime = 'image/png';
      urls.push(`data:${mime};base64,${item.b64_json}`);
    }
    if (item.revised_prompt && item.revised_prompt !== params.prompt) {
      warnings.push(`Prompt revised: "${item.revised_prompt}"`);
    }
  }

  return {
    urls,
    provider: 'openai',
    model: params.model,
    processingTimeMs: Date.now() - start,
    ...(warnings.length ? { warnings } : {}),
  };
}
