# Phase 6 — Tabbed Studio Layout

## Overview

Implement the tabbed studio interface supporting Image, Video, Cinema, and LipSync modes. Each tab contains the same core studio controls but adapts the inputs and outputs for its modality.

## Tasks

### Task 1: Tab Navigation Infrastructure
- Build `components/ui/Tabs.tsx` — accessible tab bar with icons, active indicator (primary color underline), keyboard navigation (arrow keys)
- Build `components/studio/StudioShell.tsx` — layout wrapper that holds tab bar + active tab content
- Integrate tabs into `app/studio/page.tsx`

### Task 2: ImageTab
- Build `components/tabs/ImageTab.tsx` — assemble PromptInput, ModelSelector, ReferencePicker, StylePresets, SmartControls, GenerationButton, ResultPanel, HistoryPanel
- Ensure all components work together for image generation (text-to-image, image-to-image)

### Task 3: VideoTab
- Build `components/tabs/VideoTab.tsx` — same studio assembly but swap ResultPanel for video player
- Add `components/studio/VideoControls.tsx`: duration selector (5s/10s/15s/30s), start-frame selector (for i2v models), loop toggle
- Video player: `<video>` tag with playback controls, download button

### Task 4: CinemaTab
- Build `components/tabs/CinemaTab.tsx` — same studio assembly plus cinema-specific controls
- Build `components/studio/CinemaCameraControls.tsx`:
  - Lens type dropdown: Anamorphic, Macro, Cinema Prime, Wide Angle, Telephoto, Fisheye
  - Focal length slider: 8–200mm with numeric input
  - Aperture slider: f/0.95–f/22
  - Camera body selector: 70mm Film, 16mm Film, Large Format Digital, Mirrorless Full Frame
  - Each setting generates a descriptive prompt suffix injected before generation
- Preview: small camera viewport preview showing the current settings applied as a style

### Task 5: LipSyncTab
- Build `components/tabs/LipSyncTab.tsx`
- Build `components/studio/LipSyncControls.tsx`:
  - Portrait image selector (single image, ReferencePicker in single mode)
  - Audio file upload: drag-drop zone for MP3/WAV/OGG
  - Audio waveform preview: canvas-based visualization of audio file
  - Duration display (auto-detected from audio)
- Build `components/studio/LipSyncResult.tsx`: video player showing talking portrait

### Task 6: Cross-Tab State Management
- Each tab preserves its own state (selected model, prompt, params, results) when switching away and back
- Global store (`useStudioStore`) maintains current tab index
- Tab state persisted to sessionStorage so refreshing restores tab context

### Task 7: Quality Gates
- lint: `npm run lint` — 0 errors
- types: `npx tsc --noEmit` — 0 errors
- tests: unit tests for Tab component, tab state persistence, CinemaCameraControls translation logic

## Files

### New Files
- `components/ui/Tabs.tsx`
- `components/studio/StudioShell.tsx`
- `components/tabs/ImageTab.tsx`
- `components/tabs/VideoTab.tsx`
- `components/tabs/CinemaTab.tsx`
- `components/tabs/LipSyncTab.tsx`
- `components/studio/VideoControls.tsx`
- `components/studio/CinemaCameraControls.tsx`
- `components/studio/LipSyncControls.tsx`
- `components/studio/LipSyncResult.tsx`

### Modified Files
- `app/studio/page.tsx` — integrate StudioShell
- `store/useStudioStore.ts` — add tab state

## Acceptance Criteria
- [ ] Four tabs render: Image, Video, Cinema, LipSync
- [ ] Switching tabs preserves each tab's state
- [ ] VideoTab shows duration and start-frame controls
- [ ] CinemaTab camera controls generate descriptive prompt suffix
- [ ] LipSyncTab accepts portrait + audio and shows waveform
- [ ] All quality gates pass
