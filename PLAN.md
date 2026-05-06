# Dark Factory AI Studio — Implementation Plan

> **Note:** This project has two phase systems:
> - **App phases (1–9):** Feature/build phases tracked in this plan's Progress Checklist
> - **Pipeline phases (0–9):** Orchestrator infrastructure phases in `pipeline/phase-N/` — these are the agent machinery that builds the app
> The cron job reads this plan's Progress Checklist to pick the next feature task.

## Context

Build a web app with no auth system where users can:
1. Add their own API keys (BYOK, stored client-side in localStorage)
2. Select any AI model from the UI
3. Generate image/video content, switching models and params at runtime without code changes

**Decisions made:**
- API providers: All (OpenAI GPT-Image, Google Imagen, Replicate, Muapi)
- API keys: Client-side localStorage (simple, user-owned)
- Workflow builder: Deferred (not in scope)
- Platform: Web app (responsive, desktop-first)
- Design: Dark glassmorphism, Inter font, #050505 bg, #d9ff00 accent — inspired by Open-Generative-AI's studio UI

---

## Design System

### Color Palette (from Open-Generative-AI)
```
Background:     #050505  (--bg-app)
Panel:          #0a0a0a  (--bg-panel)
Card:           #141414  (--bg-card)
Primary/Accent: #d9ff00  (--color-primary)
Border:         rgba(255,255,255,0.05)
Glass BG:       rgba(255,255,255,0.03)
Glass Border:   rgba(255,255,255,0.08)
Text Primary:   #ffffff
Text Muted:     #a1a1aa
Text Secondary: #52525b
```

### Typography
- Font: Inter (Google Fonts), weights 400/500/600/700/800/900
- Body: 14px, line-height 1.5
- Headings: 700–900 weight, tight letter-spacing

### Spatial System
- Border radius: 0.75rem (--radius-xl), 1rem (--radius-2xl), 1.5rem (--radius-3xl)
- Panel padding: 1rem–1.5rem
- Gap between elements: 0.5rem–1rem
- Custom scrollbar: 4px, rgba(255,255,255,0.1)

### Motion
- Entrance: `fade-in-up` — `opacity 0→1, translateY 12px→0`, 400ms cubic-bezier(0.16, 1, 0.3, 1)
- Hover: scale(1.02) on cards, subtle glow on primary buttons
- Loading: pulsing skeleton or spinning indicator
- Reduced motion: respect `prefers-reduced-motion`

### Components
- **Glass panel**: `background: var(--glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border)`
- **Primary button**: `#d9ff00` bg, black text, glow shadow on hover
- **Cards**: `#141414` bg, subtle border, hover lift
- **Slider**: custom styled, primary color track
- **Modal**: centered, glass panel, overlay backdrop

---

## Architecture

```
dark-factory-app/
├── app/
│   ├── layout.tsx              # Inter font, dark theme, global CSS
│   ├── page.tsx                # Redirect to /studio
│   ├── studio/
│   │   └── page.tsx           # Main studio shell with tab bar
│   ├── settings/
│   │   └── page.tsx           # API key modal (accessed via gear icon)
│   └── api/
│       ├── generate/
│       │   └── route.ts        # Unified generation endpoint
│       └── upload/
│           └── route.ts        # Proxy uploads to providers
├── components/
│   ├── ui/                     # Generic reusable components
│   │   ├── Button.tsx
│   │   ├── Slider.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Tabs.tsx
│   │   ├── Card.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   ├── studio/
│   │   ├── Header.tsx          # App name + settings gear
│   │   ├── PromptInput.tsx     # Textarea + enhance toggle
│   │   ├── ModelSelector.tsx    # Dropdown with search + provider badge
│   │   ├── ReferencePicker.tsx  # Multi-image upload + history tab
│   │   ├── StylePresets.tsx    # Horizontal scroll preset cards
│   │   ├── SmartControls.tsx   # Dynamic controls per model
│   │   ├── GenerationButton.tsx # Generate CTA with loading state
│   │   ├── ResultPanel.tsx     # Image display, download, "use as ref"
│   │   ├── HistoryPanel.tsx    # Sidebar: generation history
│   │   └── ComparisonSlider.tsx # Before/after drag slider
│   └── tabs/
│       ├── ImageTab.tsx        # Image Studio
│       ├── VideoTab.tsx         # Video Studio
│       ├── CinemaTab.tsx        # Cinema Studio (camera controls)
│       └── LipSyncTab.tsx       # Lip Sync Studio
├── lib/
│   ├── models.ts               # Model registry (definitive source of truth)
│   ├── providers/
│   │   ├── types.ts            # Unified GenerateParams / GenerateResult
│   │   ├── openai.ts           # OpenAI GPT-Image, Dall-E
│   │   ├── google.ts           # Google Imagen, Gemini
│   │   ├── replicate.ts        # Replicate (Flux, SD, etc.)
│   │   └── muapi.ts            # Muapi.ai gateway
│   ├── storage.ts              # localStorage helpers
│   └── utils.ts                # Image compression, base64, thumbnails
├── store/
│   └── useStudioStore.ts       # Zustand: model, params, results, history
└── styles/
    └── globals.css             # Theme tokens, glassmorphism, animations
```

---

## Progress Checklist

Check off items as they complete. Cron job reads this to pick the next task.

### Phase 1 — Project Scaffold + Design System + Settings
- [x] Phase 1: Extract Button → `components/ui/Button.tsx` (primary #d9ff00, ghost, outline variants)
- [x] Phase 1: Extract Modal → `components/ui/Modal.tsx` (glass panel, overlay, Escape/outside click)
- [x] Phase 1: Build `app/settings/page.tsx` — API key modal, per-provider fields, save to localStorage `uas_api_keys`
- [x] Phase 1: Build `components/studio/Header.tsx` — app name left, gear icon opens settings
- [x] Phase 1: Fix accent color #3b82f6 → #d9ff00 in globals.css and all inline styles

### Phase 2 — Model Registry + Model Selector
- [x] Phase 2: Build `lib/models.ts` — ModelProvider/ModelType/Model interface, 10–15 models across all providers
- [x] Phase 2: Build `components/studio/ModelSelector.tsx` — dropdown with search + provider badge (currently missing from codebase)
- [x] Phase 2: Wire `ModelSelector` in StudioControls to `lib/models.ts` (replace hardcoded `MODEL_OPTIONS`)
- [x] Phase 2: Add provider badge colors (OpenAI=green, Google=blue, Replicate=purple, Muapi=yellow)

### Phase 3 — Smart Controls + Prompt Input
- [x] Phase 3: Build `components/studio/SmartControls.tsx` — dynamic controls from `model.inputs` (currently missing)
- [x] Phase 3: Build `components/studio/StylePresets.tsx` — horizontal scroll preset cards (currently missing)
- [x] Phase 3: Build `components/studio/GenerationButton.tsx` — generate CTA with loading state (currently missing)
- [x] Phase 3: Make `StylePresets` append modifiers to prompt string on click
- [x] Phase 3: Wire `GenerationButton` to call `/api/generate` with loading state

### Phase 4 — Reference Picker + Upload History
- [x] Phase 4: Build `lib/storage.ts` — getApiKeys/setApiKeys/getUploadHistory/saveUpload/getGenerationHistory/saveGeneration
- [x] Phase 4: Build `components/studio/ReferencePicker.tsx` — multi-image upload + history tab (currently missing)

### Phase 5 — API Providers + Generation Route ✅ DONE
- [x] Phase 5: Build `lib/providers/types.ts` — GenerateParams / GenerateResult interfaces
- [x] Phase 5: Build `lib/providers/openai.ts` — OpenAI `/v1/images/generations`
- [x] Phase 5: Build `lib/providers/google.ts` — Google Vertex AI Imagen API
- [x] Phase 5: Build `lib/providers/replicate.ts` — Replicate API (Flux, SD)
- [x] Phase 5: Build `lib/providers/muapi.ts` — Muapi.ai gateway
- [x] Phase 5: Build `app/api/generate/route.ts` — dispatch to correct provider, read key from header

### Phase 6 — Result Panel + History
- [x] Phase 6: Add download button to `ResultPanel`
- [x] Phase 6: Wire "Use as reference" in `ResultPanel` → adds to ReferencePicker
- [x] Phase 6: Wire `saveGeneration()` to localStorage on completion; restore params on history item click

### Phase 7 — Tabbed Studio Layout ✅ DONE
- [x] Phase 7: StudioShell, Tabs, ImageTab, VideoTab, CinemaTab, LipSyncTab, CinemaCameraControls — all wired

### Phase 8 — Inpaint/Canvas Editor
- [ ] Phase 8: Build `InpaintCanvas.tsx` + `MaskControls.tsx` + `CanvasToolbar.tsx`
- [ ] Phase 8: Build `InpaintResultPanel.tsx` + `InpaintHistory.tsx`
- [ ] Phase 8: Wire inpaint API call in `app/api/generate/route.ts`
- [ ] Phase 8: Add "Edit in Canvas" button to `ResultPanel`

### Phase 9 — Comparison Slider + Polish
- [ ] Phase 9: Build `ComparisonSlider.tsx` — before/after draggable divider
- [ ] Phase 9: Build `Toast.tsx` — success/error feedback
- [ ] Phase 9: Add keyboard shortcuts (Cmd+Enter generate, Cmd+S save, Esc close)
- [ ] Phase 9: Responsive layout — collapse HistoryPanel to bottom drawer on mobile
- [ ] Phase 9: Build `app/api/upload/route.ts`

---

## Implementation Phases

### Phase 1: Project Scaffold + Design System + Settings — PARTIAL ⚠️

**Status as of 2026-05-03:**
- Next.js app scaffolded with Tailwind — ✅
- `app/globals.css` has design tokens but accent is `#3b82f6` (blue), not `#d9ff00` — ❌
- `app/layout.tsx` exists but Inter font not confirmed loaded via `next/font/google` — ❌
- `components/ui/Button.tsx`, `components/ui/Modal.tsx` — **do not exist** as separate files; inline stubs in `StudioControls.tsx`
- `app/settings/page.tsx` — **does not exist** — no API key modal at all
- `components/studio/Header.tsx` — **does not exist**; header is hardcoded inline in `StudioShell`

**Remaining:**
1. Extract Button + Modal into `components/ui/` with proper variants and glass panel style
2. Build `app/settings/page.tsx` — API key modal with per-provider fields (OpenAI, Google, Replicate, Muapi), saved to localStorage key `uas_api_keys`
3. Build `components/studio/Header.tsx` — app name left, gear icon right, opens settings modal
4. Fix accent color to `#d9ff00` throughout
5. Verify Inter font loads via `next/font/google`

**Verification:** Settings modal saves keys to localStorage; dark theme renders; app loads without errors.

---

### Phase 2: Model Registry + Model Selector — NOT STARTED ❌

**Status as of 2026-05-03:**
- `lib/models.ts` — **does not exist**
- `components/studio/ModelSelector` uses hardcoded `['sdxl', 'sd15', 'sdxl-turbo', 'playground-v2']` instead of the registry
- `useStudioStore` exists (Phase 1 dependency done) — ✅

**Remaining:**
1. Build `lib/models.ts` — model registry with `ModelProvider`, `ModelType`, `Model` interface; populate 10–15 models across OpenAI, Google, Replicate, Muapi
2. Replace hardcoded `MODEL_OPTIONS` in `ImageTab` with `lib/models.ts` data
3. `components/studio/ModelSelector` → searchable dropdown with provider badge colors
4. Wire model selection to `useStudioStore`

**Files to create:** `lib/models.ts` (new)
**Files to modify:** `components/studio/StudioControls.tsx` (ModelSelector), `components/tabs/ImageTab.tsx`

**Verification:** Switching model dropdown changes the selected model in state; all models render grouped by provider.

---

### Phase 3: Smart Controls + Prompt Input — STUB ⚠️

**Status as of 2026-05-03:**
- `PromptInput`, `StylePresets`, `GenerationButton` — exist as inline stubs in `StudioControls.tsx`
- `SmartControls` — **not dynamic**, shows seed/steps/guidance always regardless of model; does not read from `model.inputs`
- `GenerationButton` — stub only; calls `placehold.co` mock result, no API call
- `StylePresets` — doesn't append modifiers to prompt

**Remaining:**
1. `SmartControls` → reads `model.inputs` from `lib/models.ts`; renders aspectRatio buttons, width/height inputs, quality/style dropdowns
2. `StylePresets` → clicking preset appends suffix to prompt string
3. `GenerationButton` → call `/api/generate` with loading state
4. Split stubs from `StudioControls.tsx` into separate files per component

**Files to create:** `components/studio/SmartControls.tsx`, `components/studio/PromptInput.tsx`, `components/studio/StylePresets.tsx`, `components/studio/GenerationButton.tsx`
**Files to modify:** `components/studio/StudioControls.tsx` (remove stubs), `components/tabs/ImageTab.tsx`

**Verification:** Selecting a model with `aspectRatio` shows ratio buttons; switching to model with `width/height` shows number inputs.

---

### Phase 4: Reference Picker + Upload History — PARTIAL ⚠️

**Status as of 2026-05-03:**
- `ReferencePicker` stub exists in `StudioControls.tsx` — single-image upload via `URL.createObjectURL`
- No `lib/storage.ts` — upload history not persisted

**Remaining:**
1. Build `lib/storage.ts` — `getApiKeys()`, `setApiKey()`, `getUploadHistory()`, `saveUpload()`, `removeUpload()`, `getGenerationHistory()`, `saveGeneration()`
2. `ReferencePicker` → add History tab (grid of previously uploaded images from localStorage)
3. Max images enforced per model (`model.inputs.maxImages`)
4. 80×80 JPEG thumbnail generation via canvas center-crop

**Files to create:** `lib/storage.ts` (new)
**Files to modify:** `components/studio/StudioControls.tsx` (ReferencePicker)

**Verification:** Upload 3 images → order badges; close/reopen picker → history tab shows them; max 1 image model prevents selecting more than 1.

---

### Phase 5: API Providers + Generation Route — NOT STARTED ❌

**Status as of 2026-05-03:**
- `lib/providers/` — **does not exist**
- `app/api/generate/route.ts` — **does not exist**
- All generation is stubbed with `placehold.co` URLs

**Remaining:**
1. Build `lib/providers/types.ts` — `GenerateParams`, `GenerateResult` interfaces
2. Build `lib/providers/openai.ts` — OpenAI Images API (`/v1/images/generations`)
3. Build `lib/providers/google.ts` — Google Vertex AI Imagen API
4. Build `lib/providers/replicate.ts` — Replicate API for Flux/SD models
5. Build `lib/providers/muapi.ts` — Muapi.ai gateway
6. Build `app/api/generate/route.ts` — reads API key from request header, dispatches to correct provider
7. Wire `GenerationButton` to call `/api/generate`, show streaming progress

**Files to create:** `lib/providers/types.ts`, `lib/providers/openai.ts`, `lib/providers/google.ts`, `lib/providers/replicate.ts`, `lib/providers/muapi.ts`, `app/api/generate/route.ts`

**Verification:** With a real OpenAI API key, generate an image via GPT-Image; result displays in browser.

---

### Phase 6: Result Panel + History — STUB ⚠️

**Status as of 2026-05-03:**
- `ResultPanel` and `HistoryPanel` exist as inline stubs in `StudioControls.tsx`
- `saveGeneration()` to localStorage — **not implemented**; history lives only in React state (ephemeral, lost on refresh)
- No download button, no "use as reference" wire-up

**Remaining:**
1. `ResultPanel` → image grid, download button, "Use as reference" button, error state with retry
2. `HistoryPanel` → thumbnail + model name + prompt preview + timestamp; click to reload params; download + delete on hover
3. Wire generation completion → `saveGeneration()` via `lib/storage.ts`
4. "Clear history" button with confirmation

**Files to modify:** `components/studio/StudioControls.tsx` (split into separate files)

**Verification:** Generate 3 images → appear in history; refresh page → history persists; click history item → params restored; download works.

---

### Phase 7: Tabbed Studio Layout — DONE ✅ (stubs underneath)

**Status as of 2026-05-03:**
- `StudioShell`, `Tabs`, all 4 tabs (Image/Video/Cinema/LipSync), `CinemaCameraControls`, `LipSyncControls` — **all exist and wired**
- ⚠️ Tab content is all stub components — nothing is wired to real generation
- Tab state persists to `sessionStorage` via `useStudioStore` — ✅

**Remaining:** Nothing for the layout itself. Content (phases 3-6) needs to be completed.

**Verification:** All 4 tabs accessible; switching tabs preserves state.

---

### Phase 8: Inpaint/Canvas Editor — NOT STARTED ❌

**Prerequisite:** Phase 5 (API generation) and Phase 6 (ResultPanel) must be complete.

---

### Phase 9: Comparison Slider + Polish — NOT STARTED ❌

**Remaining:**
1. `components/studio/ComparisonSlider.tsx` — two images stacked, draggable vertical divider reveals before/after; keyboard accessible
2. "Compare" button to `ResultPanel` when a generation has a reference image
3. `app/api/upload/route.ts` — proxy for multipart form upload → provider's upload endpoint
4. `components/ui/Toast.tsx` — success/error feedback for copy, download, generate
5. Keyboard shortcuts: `Cmd/Ctrl+Enter` to generate, `Cmd/Ctrl+S` to save, `Escape` to close modals
6. Empty states — illustrated placeholders for no generations, no uploads, no results
7. Responsive layout — collapse HistoryPanel to bottom drawer on mobile; stack controls vertically

**Files to create:** `components/studio/ComparisonSlider.tsx`, `components/ui/Toast.tsx`, `app/api/upload/route.ts`
**Files to modify:** `ResultPanel.tsx` (compare button), keyboard handlers, responsive CSS

**Verification:** Comparison slider works; toasts appear on actions; keyboard shortcuts work; mobile layout clean.

## Feature Summary

| Phase | Features | Status | Files |
| --- | --- | --- | --- |
| 1 | Project scaffold, dark theme, Button, Modal, Settings page | ✅ Done — scaffold, Button, Modal, Settings, Header, accent color all implemented | 8 total, done |
| 2 | Model registry (`models.ts`), ModelSelector component | ✅ Done — `lib/models.ts` + `ModelSelector.tsx` with search + provider badges + ImageTab wired | 4 total, all done |
| 3 | SmartControls, StylePresets, GenerationButton | ❌ NOT DONE — all 3 components MISSING from codebase | 4 total, all missing |
| 4 | Storage helpers, ReferencePicker | ⚠️ PARTIAL — `lib/storage.ts` exists, but `ReferencePicker.tsx` is MISSING | 3 total, 1 missing |
| 5 | Provider clients (OpenAI, Google, Replicate, Muapi), generate API route | ✅ Done — all 4 providers + dispatch route implemented | 6 total, done |
| 6 | ResultPanel (download, use-as-ref), HistoryPanel (localStorage), saveGeneration wired | ✅ Done — download button, use-as-reference, localStorage persistence all implemented | 2 new files + 3 tab files updated |
| 7 | Tab bar, ImageTab, VideoTab, CinemaTab, LipSyncTab, CinemaCameraControls | ✅ Done — studio shell fully wired | 7 total, done |
| 8 | InpaintCanvas, MaskControls, CanvasToolbar, InpaintResultPanel, InpaintHistory, utils helpers | ❌ Not started | 6 total |
| 9 | ComparisonSlider, Toast, upload route, keyboard shortcuts, responsive | ❌ Not started | 5 total |

**Overall: ~46 files. ~28 files remaining. Verified against actual codebase: Phases 1,5,6,7 fully done. Phases 2,3,4 partially done but plan overstated completion. Phases 8,9 not started.**

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| API keys in localStorage (XSS) | Warn user; sessionStorage option; proxy through API route for most calls |
| CORS blocking provider APIs | All calls go through Next.js API route (`/api/generate`) |
| Model registry goes stale | Allow custom model entry in settings; store in localStorage |
| Large uploads bloat localStorage | Store only metadata + object URLs; lazy-load thumbnails |
| Provider API format changes | Abstract provider behind `GenerateParams`/`GenerateResult` interface |

---

## Open Questions (Assumptions Made)

| Question | Assumption |
|---|---|
| Image storage for history? | Object URLs + localStorage metadata; images lost on tab close |
| Max generation history items? | 50 items, FIFO |
| Max upload history items? | 20 items, FIFO |
| Upload size limit? | 10MB per file client-side |
| Concurrent generations? | 1 at a time (queue future enhancement) |
| Prompt enhancement provider? | GPT-4o-mini via OpenAI provider (requires key) |
| Video playback format? | MP4 via `<video>` tag |
| Audio waveform preview? | Canvas-based visualization (simple) |
