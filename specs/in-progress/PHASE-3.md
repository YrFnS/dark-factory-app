# Phase 3 — Smart Controls + Prompt Input

> Metadata
> - Phase: 3
> - Status: in-progress
> - Parent: PLAN.md §Phase 3

## 1. Goals

Phase 3 makes controls dynamic and wires generation to the API. By the end:
- `SmartControls` reads `model.inputs` — renders aspectRatio buttons, width/height inputs, quality/style dropdowns only when the selected model supports them
- `StylePresets` appends a modifier suffix to the prompt string on click
- `GenerationButton` calls `/api/generate` with loading state
- Phase 3 does NOT implement the API route itself — that is Phase 5

## 2. Implementation Steps

### Step 1: Extend `lib/models.ts` with `ModelInputs`

**File:** `lib/models.ts` (update)

Add `ModelInputs` interface:
```typescript
export interface ModelInputs {
  width?: number;
  height?: number;
  aspectRatios?: string[];       // e.g. ['1:1', '16:9', '9:16']
  quality?: 'low' | 'standard' | 'high';
  steps?: { min: number; max: number; default: number };
  guidance?: { min: number; max: number; default: number };
  style?: string[];              // e.g. ['vivid', 'natural']
  maxImages?: number;             // max reference images
}
```

Assign inputs to each model in `MODELS`:
- dall-e-3: width=1024, height=1024, quality=['standard','high']
- imagen-3: aspectRatios=['1:1','4:3','3:2','16:9','9:16'], style=['vivid','natural']
- sdxl: width=1024, height=1024, steps={min:10,max:100,default:30}, guidance={min:1,max:20,default:7.5}
- playground-v2: width=1024, height=1024, steps={...}, guidance={...}
- sdxl-turbo: width=512, height=512, steps={min:1,max:10,default:4}

Add helper:
```typescript
export function getModelInputs(modelId: string): ModelInputs | undefined;
```

**Acceptance criteria:**
- [ ] `ModelInputs` interface added
- [ ] All image models have appropriate inputs
- [ ] `getModelInputs(id)` returns inputs or undefined
- [ ] `tsc --noEmit` passes

---

### Step 2: Update `SmartControls` + `StylePresets`

**File:** `components/studio/StudioControls.tsx` (update)

`SmartControls` receives `modelInputs?: ModelInputs` and renders:
- `aspectRatio` → row of toggle buttons (1:1, 16:9, etc.) — default selected = first
- `width/height` → number inputs shown only when NO aspectRatios defined
- `quality` → select dropdown
- `style` → row of toggle buttons
- `steps` (range slider) → only if defined, replaces hardcoded defaults
- `guidance` (range slider) → only if defined, replaces hardcoded defaults
- `seed` → always shown

`StylePresetsProps` adds `onPromptAppend?: (modifier: string) => void`. On click, calls `onPromptAppend(' <preset suffix>')`. ImageTab concatenates.

**Acceptance criteria:**
- [ ] SmartControls accepts `modelInputs` prop
- [ ] aspectRatio buttons render when `model.inputs.aspectRatios` is defined
- [ ] width/height inputs render when NO aspectRatios but width/height defined
- [ ] quality dropdown renders when defined
- [ ] style buttons render when defined
- [ ] steps/guidance sliders use model defaults when defined
- [ ] StylePresets calls `onPromptAppend` with modifier suffix
- [ ] `tsc --noEmit` passes

---

### Step 3: Wire ImageTab to Dynamic Controls + Generation API

**File:** `components/tabs/ImageTab.tsx` (update)

Changes:
1. Import `getModelInputs` from `@/lib/models`
2. Pass `modelInputs={getModelInputs(state.model)}` to `SmartControls`
3. `StylePresets` gets `onPromptAppend={(mod) => update({ prompt: state.prompt + mod })}`
4. `handleGenerate` becomes async, calls `POST /api/generate` with `{ model, prompt, seed, ...inputs }`, sets `loading` state
5. Build stub API route at `app/api/generate/route.ts` that returns `{ error: 'not implemented' }` so the UI can at least exercise the call

Store update: `ImageTabState` needs `steps?: number` and `guidance?: number` fields, added to partial state update.

**Acceptance criteria:**
- [ ] Switching model changes SmartControls layout
- [ ] Clicking StylePreset appends modifier to prompt
- [ ] GenerationButton shows loading state during API call
- [ ] On API error, shows placeholder image (no crash)
- [ ] `tsc --noEmit` passes

## 3. File Manifest

```
lib/
└── models.ts           [Step 1 — update]

components/
├── studio/
│   └── StudioControls.tsx    [Step 2 — SmartControls + StylePresets]
└── tabs/
    └── ImageTab.tsx           [Step 3 — wire everything]

app/api/generate/
└── route.ts            [Step 3 — stub route]
```

## 4. Acceptance Criteria — Phase 3 Completion

- [ ] `SmartControls` renders aspectRatio buttons for models that define them
- [ ] `SmartControls` renders width/height inputs for models without aspectRatios
- [ ] `StylePresets` appends modifier to prompt on click
- [ ] `GenerationButton` shows loading state during generate
- [ ] `npm run build` succeeds (Next.js build)
- [ ] All Phase 3 checklist items in PLAN.md checked off
