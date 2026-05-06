# Phase 8b — InpaintResultPanel, InpaintHistory, Inpaint API wiring

## Overview

Phase 8 remaining work: build `InpaintResultPanel`, `InpaintHistory`, wire inpaint into the generate API, and add `onEditInCanvas` to `ResultPanel`.

---

## 1. `components/studio/InpaintResultPanel.tsx`

**Purpose:** Display inpaint generation results with download and "use as reference" actions.

**Props:**
```ts
interface InpaintResultPanelProps {
  resultUrl: string | null;        // Generated image URL
  originalUrl?: string;             // Original image URL for comparison
  model?: string;
  prompt?: string;
  onUseAsReference?: (url: string) => void;  // Load into canvas as new base
  onDownload?: (url: string) => void;
}
```

**Behavior:**
- If `resultUrl` is null → placeholder with "No inpaint result yet"
- Shows the result image
- Action bar: [Download] [Use as Reference] buttons
- "Use as Reference" → calls `onUseAsReference(resultUrl)` so parent can load it into the canvas
- Download → saves `resultUrl` as PNG

**Design:** Dark glassmorphism panel (#0a0a0a bg, glass border), #d9ff00 accent on hover, same visual language as `ResultPanel`.

---

## 2. `components/studio/InpaintHistory.tsx`

**Purpose:** Show inpaint history from localStorage (`dark-factory-inpaint-history`), allow restoring params on click, delete on hover.

**Props:**
```ts
interface InpaintHistoryProps {
  onRestore?: (record: InpaintHistoryRecord) => void;
}

interface InpaintHistoryRecord {
  id: string;
  originalUrl: string;
  maskUrl?: string;
  resultUrl: string;
  thumbnail?: string;
  model: string;
  provider: string;
  prompt: string;
  timestamp: number;
}
```

**Behavior:**
- Reads from localStorage key `dark-factory-inpaint-history`
- Grid of cards: thumbnail (or resultUrl preview), model badge, prompt truncated, timestamp
- Hover → show delete (×) button top-right
- Click → call `onRestore(record)` so parent can reload the canvas with those params
- Empty state: "No inpaint history yet"

**Design:** Same dark glassmorphism card grid, #d9ff00 accent, consistent with `HistoryPanel`.

**Storage helpers (inline or in lib):**
- `getInpaintHistory(): InpaintHistoryRecord[]`
- `saveInpaintHistory(record: Omit<InpaintHistoryRecord, 'id' | 'timestamp'>): InpaintHistoryRecord`
- `removeInpaintHistory(id: string): void`

---

## 3. `app/api/generate/route.ts` — inpaint support

**Changes:**
- Accept `mask?: string` (base64 PNG) and `image?: string` (base64 input image) in POST body
- Add `mask?: string` and `image?: string` to the `params` object built from the request body
- For **OpenAI** (`generateWithOpenAI`): if `image` is provided (base64), use the `b64_json` input style. GPT-Image supports image + mask via the `image` parameter (base64) and `mask` parameter (base64 PNG).
- For **Replicate** (`generateWithReplicate`): if `image` and `mask` are provided, set `input_image` and `mask` on the replicate input. For flux inpaint models the mask is a separate input field.
- If `referenceImages` is set and `image` is also set, prefer `image` as the primary input.

**Note:** The `GenerateParams` interface in `lib/providers/types.ts` will be extended via spread to accept `image?: string` and `mask?: string` as extra fields — the providers handle them conditionally.

---

## 4. `ResultPanel.tsx` — Add `onEditInCanvas`

**Changes to `ResultPanelProps`:**
```ts
interface ResultPanelProps {
  resultUrl: string | null;
  type?: 'image' | 'video';
  onUseAsReference?: (url: string) => void;
  onEditInCanvas?: (url: string) => void;  // NEW
}
```

**UI change:**
- If `type === 'image'` and `onEditInCanvas` is provided, add a third button:
  ```tsx
  <button onClick={() => onEditInCanvas(resultUrl!)} title="Edit in Canvas">
    <svg ...pencil icon... />
    Edit in Canvas
  </button>
  ```
- Button style: same glass button style with #d9ff00 hover accent.

---

## 5. `GenerateParams` extension (types.ts)

Add to `GenerateParams`:
```ts
/** Base64 input image for img2img / inpaint */
image?: string;
/** Base64 PNG mask for inpaint */
mask?: string;
```

---

## 6. Provider implementations

### OpenAI (`lib/providers/openai.ts`)
If `params.image` is set, include it as `image: params.image` in the request body. OpenAI GPT-Image supports image + mask:
```ts
if (params.image) body.image = params.image;
if (params.mask) body.mask = params.mask;
```

### Replicate (`lib/providers/replicate.ts`)
If `params.image` is set:
```ts
input.input_image = params.image;
if (params.mask) input.mask = params.mask;
```

---

## 7. PLAN.md updates

Mark these items as done:
- `- [x] Phase 8: Build InpaintResultPanel.tsx + InpaintHistory.tsx`
- `- [x] Phase 8: Wire inpaint API call in app/api/generate/route.ts`
- `- [x] Phase 8: Add "Edit in Canvas" button to ResultPanel`

---

## Design tokens (from existing codebase)

```css
--bg-app: #050505
--bg-panel: #0a0a0a
--bg-card: #141414
--color-primary: #d9ff00
--glass-bg: rgba(255,255,255,0.03)
--glass-border: rgba(255,255,255,0.08)
--radius-xl: 0.75rem
--radius-2xl: 1rem
```

All new components use inline `<style jsx>` with these values — no external CSS imports needed.
