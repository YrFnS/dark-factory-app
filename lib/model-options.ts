/**
 * lib/model-options.ts — Model options helper.
 * Exports typed option arrays for dropdown components.
 * Reads ONLY from IndexedDB customModels store.
 */

import { getAllModels, PROVIDER_COLORS } from '@/lib/models';
import type { CustomModel } from '@/lib/models';

export { getModelInputs } from '@/lib/models';

interface ModelOption {
  value: string;
  label: string;
  providerColor: string;
}

export async function getImageModelOptions(): Promise<ModelOption[]> {
  const all = await getAllModels();
  return all
    .filter((m: CustomModel) => m.type === 'image')
    .map((m: CustomModel) => ({
      value: m.id,
      label: m.name,
      providerColor: PROVIDER_COLORS[m.provider] ?? '#888888',
    }));
}

export async function getVideoModelOptions(): Promise<ModelOption[]> {
  const all = await getAllModels();
  return all
    .filter((m: CustomModel) => m.type === 'video')
    .map((m: CustomModel) => ({
      value: m.id,
      label: m.name,
      providerColor: PROVIDER_COLORS[m.provider] ?? '#888888',
    }));
}