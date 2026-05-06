# Dark Factory AI Studio

Multi-provider AI generation studio. Select a model, write a prompt, generate.

## Providers

- OpenAI (GPT-Image)
- Google Vertex AI (Imagen)
- Replicate (Flux, SDXL)
- Muapi.ai

API keys are stored client-side in localStorage — your keys never touch a server you don't control.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Model selector** — switch between OpenAI, Google, Replicate, Muapi models at runtime
- **Smart controls** — dynamic parameters per model (steps, guidance, style, quality)
- **Style presets** — one-click prompt modifiers
- **Reference images** — upload up to 5 reference images; use them as generation context
- **Inpaint canvas** — mask regions of an image and regenerate just those areas
- **Comparison slider** — drag to compare before/after on any generation
- **Generation history** — localStorage-persisted across sessions
- **Keyboard shortcuts** — `Cmd+Enter` generate, `Cmd+S` save, `Esc` close
- **Responsive** — desktop-first, mobile layout collapses history to a bottom drawer
- **Dark glassmorphism UI** — #050505 background, #d9ff00 accent, Inter font

## Architecture

```
app/
  api/generate/   — unified generation endpoint (dispatches to provider)
  api/upload/     — multipart upload proxy
  settings/       — API key configuration modal
  studio/         — main studio page

components/
  studio/         — GenerationButton, SmartControls, StylePresets, ModelSelector,
                     InpaintCanvas, InpaintResultPanel, ReferencePicker, ResultPanel,
                     ComparisonSlider, PhaseTimeline, PhaseDetail
  tabs/           — ImageTab, VideoTab, CinemaTab, LipSyncTab
  ui/             — Button, Modal, Toast, ToastContainer, Tabs, QualityGates

lib/
  models.ts        — model registry (10+ models across 4 providers)
  providers/       — per-provider generation implementations
  storage.ts       — localStorage read/write for keys, history, generations
```

## Tech Stack

Next.js 15, React 19, TypeScript, Tailwind CSS, Next.js App Router.
