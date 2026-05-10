/**
 * lib/storage.ts — IndexedDB-backed storage for API keys, upload history, and generation history.
 * All functions are client-side only (check typeof window !== 'undefined').
 * Falls back to in-memory state if IndexedDB is unavailable.
 */

import { get as dbGet, putRecord as dbPut, deleteRecord as dbDelete, getAll as dbGetAll, clear as dbClear } from '@/lib/db';

// ─── API Keys ────────────────────────────────────────────────────────────────

export interface ApiKeys {
  openai?: string;
  google?: string;
  replicate?: string;
  muapi?: string;
}

// In-memory fallback for server-side / unavailable contexts
let _keys: ApiKeys = {};
let _keysLoaded = false;

async function loadKeys(): Promise<ApiKeys> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = await dbGet<ApiKeys>('apiKeys', 'keys');
    return raw ?? {};
  } catch {
    return {};
  }
}

export async function getApiKeys(): Promise<ApiKeys> {
  if (!_keysLoaded) {
    _keys = await loadKeys();
    _keysLoaded = true;
  }
  return _keys;
}

export async function setApiKey(provider: string, key: string): Promise<void> {
  if (typeof window === 'undefined') return;
  _keys = { ..._keys, [provider]: key };
  await dbPut('apiKeys', { provider: 'keys', ..._keys });
}

export async function removeApiKey(provider: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const rest = _keys as Record<string, string>;
  delete rest[provider];
  _keys = rest as ApiKeys;
  await dbPut('apiKeys', { provider: 'keys', ..._keys });
}

// ─── Upload History ──────────────────────────────────────────────────────────

export interface UploadRecord {
  id: string;
  dataUrl: string;
  thumbnail: string;
  timestamp: number;
}

const MAX_UPLOADS = 20;

export async function getUploadHistory(): Promise<UploadRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const records = await dbGetAll<UploadRecord>('uploads');
    return records.slice(0, MAX_UPLOADS);
  } catch {
    return [];
  }
}

export async function saveUpload(upload: Omit<UploadRecord, 'id' | 'timestamp'>): Promise<UploadRecord> {
  if (typeof window === 'undefined') throw new Error('IndexedDB not available');

  const record: UploadRecord = {
    ...upload,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  await dbPut('uploads', record);

  // Prune old records beyond MAX_UPLOADS
  const all = await dbGetAll<UploadRecord>('uploads');
  if (all.length > MAX_UPLOADS) {
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp);
    const toRemove = sorted.slice(MAX_UPLOADS);
    for (const r of toRemove) {
      await dbDelete('uploads', r.id);
    }
  }

  return record;
}

export async function removeUpload(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await dbDelete('uploads', id);
}

// ─── Generation History ──────────────────────────────────────────────────────

export interface GenerationRecord {
  id: string;
  model: string;
  provider: string;
  prompt: string;
  params: Record<string, unknown>;
  resultUrl: string;
  thumbnail?: string;
  timestamp: number;
}

const MAX_GENERATIONS = 50;

export async function getGenerationHistory(): Promise<GenerationRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const records = await dbGetAll<GenerationRecord>('generations');
    return records.slice(0, MAX_GENERATIONS);
  } catch {
    return [];
  }
}

export async function saveGeneration(
  generation: Omit<GenerationRecord, 'id' | 'timestamp'>
): Promise<GenerationRecord> {
  if (typeof window === 'undefined') throw new Error('IndexedDB not available');

  const record: GenerationRecord = {
    ...generation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  await dbPut('generations', record);

  // Prune old records
  const all = await dbGetAll<GenerationRecord>('generations');
  if (all.length > MAX_GENERATIONS) {
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp);
    const toRemove = sorted.slice(MAX_GENERATIONS);
    for (const r of toRemove) {
      await dbDelete('generations', r.id);
    }
  }

  return record;
}

export async function removeGeneration(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await dbDelete('generations', id);
}

export async function clearGenerationHistory(): Promise<void> {
  if (typeof window === 'undefined') return;
  await dbClear('generations');
}