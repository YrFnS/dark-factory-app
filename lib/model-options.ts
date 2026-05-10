/**
 * Model options helper — bridges lib/models.ts to UI components.
 * Exports typed option arrays for dropdown components.
 */

import { MODELS, PROVIDER_COLORS, getCustomModels } from '@/lib/models';

export { getModelInputs } from '@/lib/models';

interface ModelOption {
  value: string;
  label: string;
  providerColor: string;
}

export function getImageModelOptions(): ModelOption[] {
  const custom = getCustomModels().filter((m) => m.type === 'image');
  const builtIn = MODELS.filter((m) => m.type === 'image');
  return [...builtIn, ...custom].map((m) => ({
    value: m.id,
    label: m.name,
    providerColor: PROVIDER_COLORS[m.provider] ?? '#888888',
  }));
}

export function getVideoModelOptions(): ModelOption[] {
  const custom = getCustomModels().filter((m) => m.type === 'video');
  const builtIn = MODELS.filter((m) => m.type === 'video');
  return [...builtIn, ...custom].map((m) => ({
    value: m.id,
    label: m.name,
    providerColor: PROVIDER_COLORS[m.provider] ?? '#888888',
  }));
}
