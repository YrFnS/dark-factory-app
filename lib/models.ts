/**
 * Model registry — centralized model definitions for the Dark Factory Studio.
 * Replaces hardcoded MODEL_OPTIONS in tab components.
 */

export type ModelProvider = 'openai' | 'google' | 'replicate' | 'muapi';

export type ModelType = 'image' | 'video' | 'audio' | 'chat';

/** Per-model generation parameters exposed as UI controls */
export interface ModelInputs {
  /** Fixed output width (px). Omit if model uses aspectRatio instead. */
  width?: number;
  /** Fixed output height (px). Omit if model uses aspectRatio instead. */
  height?: number;
  /** Available aspect ratio options. If defined, model uses ratio picker instead of w/h. */
  aspectRatios?: string[];
  /** Available quality options. */
  quality?: Array<'low' | 'standard' | 'high'>;
  /** Style options. */
  style?: string[];
  /** Steps (inference steps) range. */
  steps?: { min: number; max: number; default: number };
  /** Guidance scale range. */
  guidance?: { min: number; max: number; default: number };
  /** Max reference images allowed. Defaults to 1. */
  maxImages?: number;
}

export interface Model {
  id: string;
  name: string;
  provider: ModelProvider;
  type: ModelType;
  /** Generation parameters for this model. */
  inputs?: ModelInputs;
}

export const PROVIDER_COLORS: Record<ModelProvider, string> = {
  openai: '#22c55e',
  google: '#3b82f6',
  replicate: '#a855f7',
  muapi: '#eab308',
};

export const MODELS: Model[] = [
  // OpenAI (green)
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    type: 'chat',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    type: 'chat',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    type: 'image',
    inputs: {
      width: 1024,
      height: 1024,
      quality: ['standard', 'high'],
    },
  },

  // Google (blue)
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    type: 'chat',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    type: 'chat',
  },
  {
    id: 'imagen-3',
    name: 'Imagen 3',
    provider: 'google',
    type: 'image',
    inputs: {
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      style: ['vivid', 'natural'],
      maxImages: 4,
    },
  },
  {
    id: 'imagen-4',
    name: 'Imagen 4',
    provider: 'google',
    type: 'image',
    inputs: {
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      style: ['vivid', 'natural'],
      maxImages: 4,
    },
  },

  // Replicate (purple)
  {
    id: 'sdxl',
    name: 'SDXL 1.0',
    provider: 'replicate',
    type: 'image',
    inputs: {
      width: 1024,
      height: 1024,
      steps: { min: 10, max: 100, default: 30 },
      guidance: { min: 1, max: 20, default: 7.5 },
      maxImages: 1,
    },
  },
  {
    id: 'playground-v2',
    name: 'Playground v2',
    provider: 'replicate',
    type: 'image',
    inputs: {
      width: 1024,
      height: 1024,
      steps: { min: 10, max: 100, default: 30 },
      guidance: { min: 1, max: 20, default: 7.5 },
      maxImages: 1,
    },
  },
  {
    id: 'zeroscope-v2',
    name: 'ZeroScope v2',
    provider: 'replicate',
    type: 'video',
    inputs: {
      width: 1024,
      height: 576,
      maxImages: 0,
    },
  },

  // Muapi (yellow)
  {
    id: 'modelscope',
    name: 'ModelScope',
    provider: 'muapi',
    type: 'video',
    inputs: {
      width: 1024,
      height: 576,
      maxImages: 0,
    },
  },
  {
    id: 'text2video-zero',
    name: 'Text2Video-Zero',
    provider: 'muapi',
    type: 'video',
    inputs: {
      width: 512,
      height: 512,
      maxImages: 0,
    },
  },
  {
    id: 'sdxl-turbo',
    name: 'SDXL Turbo',
    provider: 'muapi',
    type: 'image',
    inputs: {
      width: 512,
      height: 512,
      steps: { min: 1, max: 10, default: 4 },
      maxImages: 1,
    },
  },
];

export function getModelsByProvider(provider: ModelProvider): Model[] {
  return MODELS.filter((m) => m.provider === provider);
}

export function getModelsByType(type: ModelType): Model[] {
  return MODELS.filter((m) => m.type === type);
}

export function getModelById(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getModelInputs(modelId: string): ModelInputs | undefined {
  return getModelById(modelId)?.inputs;
}

/** Custom model entry — user-defined, stored in localStorage */
export interface CustomModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: ModelType;
  inputs?: ModelInputs;
}

const CUSTOM_MODELS_KEY = 'df_custom_models';

export function getCustomModels(): CustomModel[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomModels(models: CustomModel[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(models));
}

/** Merge built-in MODELS + custom models from localStorage */
export function getAllModels(): (Model | CustomModel)[] {
  return [...MODELS, ...getCustomModels()];
}
