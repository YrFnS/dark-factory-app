/**
 * Model options helper — bridges lib/models.ts to UI components.
 * Exports typed option arrays for dropdown components.
 */

import { MODELS, PROVIDER_COLORS } from '@/lib/models';

export { getModelInputs } from '@/lib/models';

interface ModelOption {
  value: string;
  label: string;
  providerColor: string;
}

export function getImageModelOptions(): ModelOption[] {
  return MODELS
    .filter((m) => m.type === 'image')
    .map((m) => ({
      value: m.id,
      label: m.name,
      providerColor: PROVIDER_COLORS[m.provider],
    }));
}

export function getVideoModelOptions(): ModelOption[] {
  return MODELS
    .filter((m) => m.type === 'video')
    .map((m) => ({
      value: m.id,
      label: m.name,
      providerColor: PROVIDER_COLORS[m.provider],
    }));
}
