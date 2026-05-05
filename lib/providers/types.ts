/**
 * lib/providers/types.ts — Unified generation interface across all providers.
 */

export type ProviderName = 'openai' | 'google' | 'replicate' | 'muapi';

export interface GenerateParams {
  /** Model ID (e.g. 'dall-e-3', 'imagen-3', 'sdxl') */
  model: string;
  /** Provider name */
  provider: ProviderName;
  /** Generation prompt */
  prompt: string;
  /** Output width in pixels */
  width?: number;
  /** Output height in pixels */
  height?: number;
  /** Aspect ratio label (e.g. '16:9'). If set, width/height are derived. */
  aspectRatio?: string;
  /** Quality: 'low' | 'standard' | 'high' */
  quality?: 'low' | 'standard' | 'high';
  /** Style modifier (provider-specific string) */
  style?: string;
  /** Number of inference steps (Replicate SD models) */
  steps?: number;
  /** Guidance scale (Replicate SD models) */
  guidance?: number;
  /** Reference image URLs for img2img / inpaint */
  referenceImages?: string[];
  /** Seed for deterministic generation */
  seed?: number;
  /** Number of outputs (max 4 for most providers) */
  numOutputs?: number;
}

export interface GenerateResult {
  /** URL(s) of generated media. Revoke when no longer needed. */
  urls: string[];
  /** Processing time in milliseconds */
  processingTimeMs?: number;
  /** Provider that fulfilled the request */
  provider: ProviderName;
  /** Model that was used */
  model: string;
  /** Any warning messages */
  warnings?: string[];
  /** Error message if the request failed */
  error?: string;
}

export interface ProviderClient {
  /** Human-readable provider name */
  name: ProviderName;
  /** Generate media from the given parameters */
  generate(params: GenerateParams, apiKey: string): Promise<GenerateResult>;
}

/** Parse aspectRatio string into { width, height } pixels */
export function aspectRatioToDimensions(
  ratio: string,
  base: number = 1024
): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return { width: base, height: base };
  if (h === 1) return { width: base, height: Math.round(base / w) };
  const scale = base / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}
