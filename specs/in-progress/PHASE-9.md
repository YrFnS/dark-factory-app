# Phase 9 — Full Studio Integration

## Overview

Integrate all previous tabs into a unified studio experience with shared infrastructure: API routes connecting each tab to real model providers, shared state persistence, and a polished UI shell.

## Tasks

### Task 1: API Integration Layer
- Build `lib/model-providers.ts`:
  - Unified interface: `generate(model, params): Promise<Result>`
  - Provider stubs: OpenAI DALL-E 3, Stability AI, Replicate (with API key from env)
  - Rate limiting and retry logic
- Build `app/api/generate/route.ts`:
  - POST endpoint accepting `{ tab: string, params: object }`
  - Routes to correct model provider
  - Returns streaming SSE for progress
- Build `app/api/models/route.ts`:
  - GET available models per tab
  - Keys from environment variables

### Task 2: Unified Prompt Builder
- Build `lib/prompt-builder.ts`:
  - `buildPrompt(tab, state): string` — assembles tab-specific state into model prompt
  - Cinema tab: injects camera settings suffix
  - LipSync tab: builds combined portrait + audio prompt
  - ThreeDee tab: builds mesh generation prompt

### Task 3: Result Persistence
- Extend `lib/state-store.ts` or create `lib/result-store.ts`:
  - Persist generation results to filesystem (not just sessionStorage)
  - History across browser sessions
  - Storage: `results/{phase}/{timestamp}.json`

### Task 4: Studio Shell Polish
- Build `components/studio/StudioHeader.tsx`:
  - App title, current phase indicator
  - Settings gear → modal with API key inputs per provider
- Build `components/studio/GenerationQueue.tsx`:
  - Show pending/in-progress/completed generations
  - Real-time status via SSE stream
- Wire up `StudioShell` to SSE stream from `/api/logs/stream`

### Task 5: Environment & Deployment
- Create `.env.example`:
  ```
  OPENAI_API_KEY=
  STABILITY_API_KEY=
  REPLICATE_API_KEY=
  ```
- Create `scripts/setup-env.sh`:
  - Interactive script to collect API keys
  - Creates `.env.local` from `.env.example`

### Task 6: Quality Gates
- types: `npx tsc --noEmit` — 0 errors
- tests: integration tests for prompt-builder, model-providers stub routing
- lint: `npx eslint` — 0 errors

## Files

### New Files
- `lib/model-providers.ts`
- `lib/prompt-builder.ts`
- `lib/result-store.ts`
- `app/api/generate/route.ts`
- `app/api/models/route.ts`
- `components/studio/StudioHeader.tsx`
- `components/studio/GenerationQueue.tsx`
- `.env.example`
- `scripts/setup-env.sh`

### Modified Files
- `specs/in-progress/PHASE-8.md` — archived to `specs/completed/PHASE-8.md`
- `app/studio/page.tsx` — integrate header and queue
- `package.json` — add `dotenv` dependency

## Acceptance Criteria
- [ ] All 5 tabs connected to API routes
- [ ] API keys configurable via settings modal
- [ ] Generation results persist across sessions
- [ ] Studio header shows current phase and queue status
- [ ] All quality gates pass
