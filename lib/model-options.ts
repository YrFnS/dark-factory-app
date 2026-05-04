/**
 * Tab-specific model option arrays with provider colors.
 * Consumed by ImageTab, VideoTab, and CinemaTab.
 */

import { MODELS, PROVIDER_COLORS, ModelProvider, getModelInputs } from './models';

export interface ModelOption {
  value: string;
  label: string;
  providerColor?: string;
}

function modelToOption(model: (typeof MODELS)[number]): ModelOption {
  return {
    value: model.id,
    label: model.name,
    providerColor: PROVIDER_COLORS[model.provider as ModelProvider],
  };
}

export { getModelInputs } from './models';

export function getImageModelOptions(): ModelOption[] {
  return MODELS.filter((m) => m.type === 'image').map(modelToOption);
}

export function getVideoModelOptions(): ModelOption[] {
  return MODELS.filter((m) => m.type === 'video').map(modelToOption);
}
