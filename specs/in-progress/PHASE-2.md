# Phase 2 — Model Registry

> Metadata
> - Phase: 2
> - Status: in-progress
> - Parent: SPEC.md §7
> - Plan-agent: completed 2026-05-04

## 1. Goals

Phase 2 centralizes all model definitions into a single `lib/models.ts` file, replacing hardcoded `MODEL_OPTIONS` arrays in each tab. By the end of Phase 2:

- `lib/models.ts` exports `ModelProvider`, `ModelType`, `Model` interfaces and a `MODELS` array with 10–15 models across OpenAI, Google, Replicate, and Muapi
- `ModelSelector` component in `StudioControls.tsx` accepts enhanced options including provider badge color
- `ImageTab`, `VideoTab`, `CinemaTab` import model options from `lib/models.ts` instead of local constants
- Provider badge colors: OpenAI=green (#22c55e), Google=blue (#3b82f6), Replicate=purple (#a855f7), Muapi=yellow (#eab308)

Phase 2 does NOT change the store types (`model: string` remains), does NOT add new API integrations.

---

## 2. Implementation Steps

### Step 1: Create `lib/models.ts`

**File:** `lib/models.ts` (create)

**What:**
Define TypeScript interfaces and a centralized model registry.

Interfaces:
```typescript
type ModelProvider = 'openai' | 'google' | 'replicate' | 'muapi';
type ModelType = 'image' | 'video' | 'audio' | 'chat';

interface Model {
  id: string;          // unique identifier, e.g. 'sdxl', 'gpt-4o'
  name: string;        // display name, e.g. 'SDXL 1.0'
  provider: ModelProvider;
  type: ModelType;
}
```

`MODELS` array with 12 models:
- OpenAI (green): `gpt-4o` (chat), `gpt-4o-mini` (chat), `dall-e-3` (image)
- Google (blue): `gemini-1.5-pro` (chat), `gemini-1.5-flash` (chat), `imagen-3` (image)
- Replicate (purple): `sdxl` (image), `playground-v2` (image), `zeroscope-v2` (video)
- Muapi (yellow): `modelscope` (video), `text2video-zero` (video), `sdxl-turbo` (image)

Provider color map:
```typescript
const PROVIDER_COLORS: Record<ModelProvider, string> = {
  openai: '#22c55e',
  google: '#3b82f6',
  replicate: '#a855f7',
  muapi: '#eab308',
};
```

Helper exports:
```typescript
export function getModelsByProvider(provider: ModelProvider): Model[];
export function getModelsByType(type: ModelType): Model[];
export function getModelById(id: string): Model | undefined;
```

**Acceptance criteria:**
- [ ] `ModelProvider` is a union type of the four providers
- [ ] `ModelType` covers 'image' | 'video' | 'audio' | 'chat'
- [ ] `Model` interface has `id`, `name`, `provider`, `type`
- [ ] `MODELS` array has exactly 12 models across all 4 providers
- [ ] `PROVIDER_COLORS` maps each provider to the specified hex color
- [ ] Helper functions are exported and work correctly
- [ ] `tsc --noEmit` passes

---

### Step 2: Update `ModelSelector` in `StudioControls.tsx`

**File:** `components/studio/StudioControls.tsx` (update)

**What:**
Enhance `ModelSelector` to display a colored provider badge next to each option in the dropdown.

Update `ModelSelectorProps`:
```typescript
interface ModelSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; providerColor?: string }>;
}
```

The select dropdown shows provider color as a small dot indicator before each option label.

**Acceptance criteria:**
- [ ] `ModelSelectorProps.options` accepts optional `providerColor` field
- [ ] Each option renders with a colored dot indicator when `providerColor` is provided
- [ ] Dot is 8px circle using the provider color
- [ ] No changes to existing behavior when `providerColor` is absent
- [ ] `tsc --noEmit` passes

---

### Step 3: Create `lib/model-options.ts` helper

**File:** `lib/model-options.ts` (create)

**What:**
Create helper functions that return tab-specific model option arrays with provider colors, for consumption by the tab components.

```typescript
import { MODELS, PROVIDER_COLORS } from './models';

export function getImageModelOptions() {
  return MODELS.filter(m => m.type === 'image').map(m => ({
    value: m.id,
    label: m.name,
    providerColor: PROVIDER_COLORS[m.provider],
  }));
}

export function getVideoModelOptions() {
  return MODELS.filter(m => m.type === 'video').map(m => ({
    value: m.id,
    label: m.name,
    providerColor: PROVIDER_COLORS[m.provider],
  }));
}
```

**Acceptance criteria:**
- [ ] `getImageModelOptions()` returns all image models with provider colors
- [ ] `getVideoModelOptions()` returns all video models with provider colors
- [ ] `tsc --noEmit` passes

---

### Step 4: Update `ImageTab.tsx`

**File:** `components/tabs/ImageTab.tsx` (update)

**What:**
Replace local `MODEL_OPTIONS` constant with import from `lib/model-options.ts`.

**Before:**
```typescript
const MODEL_OPTIONS = [
  { value: 'sdxl', label: 'SDXL 1.0' },
  { value: 'sd15', label: 'Stable Diffusion 1.5' },
  { value: 'sdxl-turbo', label: 'SDXL Turbo' },
  { value: 'playground-v2', label: 'Playground v2' },
];
```

**After:**
```typescript
import { getImageModelOptions } from '@/lib/model-options';

const MODEL_OPTIONS = getImageModelOptions();
```

**Acceptance criteria:**
- [ ] `MODEL_OPTIONS` is now `getImageModelOptions()` call
- [ ] ImageTab renders all image models from the registry
- [ ] `tsc --noEmit` passes

---

### Step 5: Update `VideoTab.tsx`

**File:** `components/tabs/VideoTab.tsx` (update)

**What:**
Replace local `MODEL_OPTIONS` constant with import from `lib/model-options.ts`.

**After:**
```typescript
import { getVideoModelOptions } from '@/lib/model-options';

const MODEL_OPTIONS = getVideoModelOptions();
```

**Acceptance criteria:**
- [ ] `MODEL_OPTIONS` is now `getVideoModelOptions()` call
- [ ] VideoTab renders all video models from the registry
- [ ] `tsc --noEmit` passes

---

### Step 6: Update `CinemaTab.tsx`

**File:** `components/tabs/CinemaTab.tsx` (update)

**What:**
Replace local `MODEL_OPTIONS` constant with import from `lib/model-options.ts`.

**After:**
```typescript
import { getImageModelOptions } from '@/lib/model-options';

const MODEL_OPTIONS = getImageModelOptions();
```

**Acceptance criteria:**
- [ ] `MODEL_OPTIONS` is now `getImageModelOptions()` call
- [ ] CinemaTab renders all image models from the registry
- [ ] `tsc --noEmit` passes

---

## 3. File Manifest

```
lib/
├── models.ts           [Step 1]
└── model-options.ts    [Step 3]

components/
├── studio/
│   └── StudioControls.tsx    [Step 2]
└── tabs/
    ├── ImageTab.tsx           [Step 4]
    ├── VideoTab.tsx           [Step 5]
    └── CinemaTab.tsx          [Step 6]
```

---

## 4. Acceptance Criteria — Phase 2 Completion

All of the following must be true to consider Phase 2 complete:

- [ ] `lib/models.ts` exports `ModelProvider`, `ModelType`, `Model`, `MODELS`, `PROVIDER_COLORS`
- [ ] 12 models defined across OpenAI, Google, Replicate, Muapi
- [ ] Provider colors: OpenAI=#22c55e, Google=#3b82f6, Replicate=#a855f7, Muapi=#eab308
- [ ] `lib/model-options.ts` exports `getImageModelOptions()` and `getVideoModelOptions()`
- [ ] `ModelSelector` renders provider color dots when `providerColor` is provided
- [ ] `ImageTab` uses `getImageModelOptions()`
- [ ] `VideoTab` uses `getVideoModelOptions()`
- [ ] `CinemaTab` uses `getImageModelOptions()`
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run type` passes with 0 errors
- [ ] `npm run test` passes 100%
