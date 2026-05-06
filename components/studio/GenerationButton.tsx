/**
 * GenerationButton — primary generate CTA.
 * Internally calls POST /api/generate using props from the parent.
 * Manages loading state to prevent double-submit.
 */

import React, { useCallback, useState } from 'react';
import { getApiKeys } from '@/lib/storage';
import { getModelById } from '@/lib/models';

interface GenerationButtonProps {
  /** Async function to call when the button is clicked (for real API generation) */
  onGenerate?: (params: GenerateParams) => Promise<{ data?: { url?: string } }>;
  /** Called with the result URL on successful generation (used with onGenerate) */
  onSuccess?: (resultUrl: string) => void;
  /** Simple void callback for stub/mock generation (used by Cinema/Video/LipSync tabs) */
  onClick?: () => void;
  loading?: boolean;
  label?: string;
  /** Generation params passed to onGenerate */
  prompt?: string | undefined;
  model?: string | undefined;
  seed?: number | null | undefined;
  referenceImage?: string | null | undefined;
  aspectRatio?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  quality?: string | undefined;
  steps?: number | undefined;
  guidance?: number | undefined;
}

export function GenerationButton({
  onGenerate,
  onSuccess,
  onClick,
  loading = false,
  label = 'Generate',
  prompt,
  model,
  seed,
  referenceImage,
  aspectRatio,
  width,
  height,
  quality,
  steps,
  guidance,
}: GenerationButtonProps): React.ReactElement {
  const handleClick = useCallback(async () => {
    if (loading) return;
    // Stub path: Cinema/Video/LipSync tabs pass onClick
    if (onClick) {
      onClick();
      return;
    }
    // Real path: Image tab passes onGenerate + onSuccess
    if (!prompt || !model || !onGenerate) return;
    try {
      const result = await onGenerate({
        prompt,
        model,
        ...(seed !== undefined ? { seed } : {}),
        ...(referenceImage !== undefined ? { referenceImage } : {}),
        ...(aspectRatio !== undefined ? { aspectRatio } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...(quality !== undefined ? { quality } : {}),
        ...(steps !== undefined ? { steps } : {}),
        ...(guidance !== undefined ? { guidance } : {}),
      });
      const url = result?.data?.url;
      if (url && onSuccess) onSuccess(url);
    } catch {
      // error handled by parent
    }
  }, [loading, prompt, model, seed, referenceImage, aspectRatio, width, height, quality, steps, guidance, onGenerate, onSuccess, onClick]);

  return (
    <button
      type="button"
      className={`gen-btn ${loading ? 'gen-btn--loading' : ''}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          Generating&hellip;
        </>
      ) : (
        label
      )}

      <style jsx>{`
        .gen-btn {
          position: relative;
          width: 100%;
          padding: 13px;
          border-radius: 6px;
          border: none;
          background: #d9ff00;
          color: #000;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.04em;
          transition: background 0.2s, box-shadow 0.2s, opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .gen-btn:hover:not(:disabled) {
          background: #c8f000;
          box-shadow: 0 0 20px rgba(217, 255, 0, 0.35);
        }
        .gen-btn:active:not(:disabled) {
          background: #b8dd00;
        }
        .gen-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .gen-btn--loading {
          background: #a3bf00;
        }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.25);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}

export interface GenerateParams {
  prompt: string;
  model: string;
  seed?: number | null;
  referenceImage?: string | null;
  aspectRatio?: string;
  width?: number;
  height?: number;
  quality?: string;
  steps?: number;
  guidance?: number;
}

/**
 * useGenerate — hook that returns an async generate function and loading state.
 * Reads current imageTab state from the store, calls POST /api/generate,
 * and updates the store with the result on success or error image on failure.
 */
export function useGenerate() {
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (params: GenerateParams) => {
    if (loading) return;

    const { prompt, model, seed, referenceImage, aspectRatio, width, height, quality, steps, guidance } = params;

    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const modelInfo = getModelById(model);
      const provider = modelInfo?.provider ?? model.split('-')[0] ?? 'openai';

      const apiKeys = getApiKeys();
      const apiKey = (apiKeys as Record<string, string | undefined>)[provider];

      if (!apiKey) {
        throw new Error(`No API key for provider: ${provider}`);
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          type: 'image',
          model,
          provider,
          prompt,
          ...(seed !== null ? { seed } : {}),
          ...(referenceImage ? { referenceImages: [referenceImage] } : {}),
          ...(aspectRatio ? { aspectRatio } : {}),
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
          ...(quality ? { quality } : {}),
          ...(steps !== undefined ? { steps } : {}),
          ...(guidance !== undefined ? { guidance } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return { generate, loading };
}
