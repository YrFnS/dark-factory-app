/**
 * lib/storage.ts — localStorage helpers for API keys, upload history, and generation history.
 * All functions are client-side only (check typeof window !== 'undefined').
 */

const KEYS_API = 'uas_api_keys';
const KEYS_UPLOAD = 'dark-factory-upload-history';
const KEYS_GENERATION = 'dark-factory-generation-history';
const MAX_UPLOADS = 20;
const MAX_GENERATIONS = 50;

// ─── API Keys ────────────────────────────────────────────────────────────────

export interface ApiKeys {
  openai?: string;
  google?: string;
  replicate?: string;
  muapi?: string;
}

export function getApiKeys(): ApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEYS_API);
    return raw ? (JSON.parse(raw) as ApiKeys) : {};
  } catch {
    return {};
  }
}

export function setApiKey(provider: string, key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getApiKeys();
    (keys as Record<string, string>)[provider] = key;
    localStorage.setItem(KEYS_API, JSON.stringify(keys));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function removeApiKey(provider: string): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getApiKeys();
    delete (keys as Record<string, string>)[provider];
    localStorage.setItem(KEYS_API, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

// ─── Upload History ──────────────────────────────────────────────────────────

export interface UploadRecord {
  id: string;
  dataUrl: string; // base64 data URL
  thumbnail: string; // base64 thumbnail
  timestamp: number;
}

export function getUploadHistory(): UploadRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS_UPLOAD);
    return raw ? (JSON.parse(raw) as UploadRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveUpload(upload: Omit<UploadRecord, 'id' | 'timestamp'>): UploadRecord {
  if (typeof window === 'undefined') throw new Error('localStorage not available');

  const record: UploadRecord = {
    ...upload,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const history = getUploadHistory();
  history.unshift(record);
  if (history.length > MAX_UPLOADS) history.splice(MAX_UPLOADS);
  localStorage.setItem(KEYS_UPLOAD, JSON.stringify(history));
  return record;
}

export function removeUpload(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getUploadHistory().filter((r) => r.id !== id);
    localStorage.setItem(KEYS_UPLOAD, JSON.stringify(history));
  } catch {
    // ignore
  }
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

export function getGenerationHistory(): GenerationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS_GENERATION);
    return raw ? (JSON.parse(raw) as GenerationRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveGeneration(
  generation: Omit<GenerationRecord, 'id' | 'timestamp'>
): GenerationRecord {
  if (typeof window === 'undefined') throw new Error('localStorage not available');

  const record: GenerationRecord = {
    ...generation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const history = getGenerationHistory();
  history.unshift(record);
  if (history.length > MAX_GENERATIONS) history.splice(MAX_GENERATIONS);
  localStorage.setItem(KEYS_GENERATION, JSON.stringify(history));
  return record;
}

export function removeGeneration(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getGenerationHistory().filter((r) => r.id !== id);
    localStorage.setItem(KEYS_GENERATION, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function clearGenerationHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEYS_GENERATION);
  } catch {
    // ignore
  }
}
