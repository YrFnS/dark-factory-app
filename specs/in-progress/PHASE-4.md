# Phase 4 Spec: Storage Helpers

## Task
Build `lib/storage.ts` — localStorage helpers for API keys, upload history, and generation history.

## Status: ✅ DONE

## Implementation

### `lib/storage.ts`

**API Keys** (`uas_api_keys`)
- `getApiKeys(): ApiKeys` — reads from localStorage, returns `{}` on error
- `setApiKey(provider: string, key: string)` — upserts per-provider key
- `removeApiKey(provider: string)` — removes key

**Upload History** (`dark-factory-upload-history`, FIFO 20)
- `getUploadHistory(): UploadRecord[]` — returns `[]` on error
- `saveUpload(upload: Omit<UploadRecord, 'id'|'timestamp'>): UploadRecord` — adds UUID + timestamp, enforces FIFO
- `removeUpload(id: string)` — removes by id

**Generation History** (`dark-factory-generation-history`, FIFO 50)
- `getGenerationHistory(): GenerationRecord[]`
- `saveGeneration(gen: Omit<GenerationRecord, 'id'|'timestamp'>): GenerationRecord`
- `removeGeneration(id: string)`
- `clearGenerationHistory()`

### SSR Safety
All functions guard with `typeof window === 'undefined'` before accessing localStorage.

### Type Exports
- `ApiKeys`, `UploadRecord`, `GenerationRecord`

## Verification
- `npx tsc --noEmit` — 0 errors from `lib/storage.ts`
- All functions are synchronous and side-effect-free in the SSR guard
