/**
 * Model registry — 100% user-defined from IndexedDB.
 * No built-in models. Store starts completely empty.
 * User adds every model via the Settings > Models tab.
 */

import { getAll as dbGetAll } from '@/lib/db';

export type ModelProvider = 'openai' | 'google' | 'replicate' | 'muapi';

export type ModelType = 'image' | 'video' | 'audio' | 'chat';

/** Per-model generation parameters exposed as UI controls */
export interface ModelInputs {
  width?: number;
  height?: number;
  aspectRatios?: string[];
  quality?: Array<'low' | 'standard' | 'high'>;
  style?: string[];
  steps?: { min: number; max: number; default: number };
  guidance?: { min: number; max: number; default: number };
  maxImages?: number;
}

export interface Model {
  id: string;
  name: string;
  provider: ModelProvider;
  type: ModelType;
  inputs?: ModelInputs;
}

export const PROVIDER_COLORS: Record<ModelProvider, string> = {
  openai: '#22c55e',
  google: '#3b82f6',
  replicate: '#a855f7',
  muapi: '#eab308',
};

/** Custom model entry — stored in IndexedDB customModels store */
export interface CustomModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: ModelType;
  inputs?: ModelInputs;
}

export async function getCustomModels(): Promise<CustomModel[]> {
  if (typeof window === 'undefined') return [];
  try {
    return await dbGetAll<CustomModel>('customModels');
  } catch {
    return [];
  }
}

export async function saveCustomModel(model: CustomModel): Promise<void> {
  if (typeof window === 'undefined') return;
  const { putRecord } = await import('@/lib/db');
  await putRecord('customModels', model);
}

export async function deleteCustomModel(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const { deleteRecord } = await import('@/lib/db');
  await deleteRecord('customModels', id);
}

/** Save an array of custom models (batch replace) */
export async function saveCustomModels(models: CustomModel[]): Promise<void> {
  if (typeof window === 'undefined') return;
  // Clear and rewrite all — simpler for batch replace
  const { clear, putRecord } = await import('@/lib/db');
  await clear('customModels');
  for (const m of models) {
    await putRecord('customModels', m);
  }
}

/** Returns ONLY custom models from IndexedDB — no built-ins */
export async function getAllModels(): Promise<CustomModel[]> {
  return getCustomModels();
}

export async function getModelById(id: string): Promise<CustomModel | undefined> {
  const all = await getCustomModels();
  return all.find((m) => m.id === id);
}

export async function getModelInputs(modelId: string): Promise<ModelInputs | undefined> {
  const model = await getModelById(modelId);
  return model?.inputs;
}

export async function getModelsByProvider(provider: ModelProvider): Promise<CustomModel[]> {
  const all = await getCustomModels();
  return all.filter((m) => m.provider === provider);
}

export async function getModelsByType(type: ModelType): Promise<CustomModel[]> {
  const all = await getCustomModels();
  return all.filter((m) => m.type === type);
}