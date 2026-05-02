# Phase 8 — Audio Pipeline

## Overview

Implement audio pipeline capabilities: text-to-speech, voice cloning, audio editing, and audio-to-video sync. Integrate with LipSync and extend the studio for audio-only workflows.

## Tasks

### Task 1: Audio Controls
- Build `components/studio/AudioControls.tsx`:
  - Text input for TTS script
  - Voice selector: 5 preset voices (Male, Female, Narrator, Character A, Character B)
  - Speed slider: 0.5x to 2.0x
  - Pitch adjustment: -12 to +12 semitones
  - Audio waveform display (canvas-based)
- Build `components/studio/AudioEditor.tsx`:
  - Timeline view with waveform
  - Split at playhead
  - Fade in/out controls (0–5 seconds)
  - Export format selector: MP3 128/192/320, WAV 16-bit/24-bit

### Task 2: Audio Generation Service
- Build `lib/audio-generator.ts`:
  - `synthesizeSpeech(text, voice, speed, pitch): Promise<AudioResult>`
  - `applyEffects(audio, fadeIn, fadeOut): Promise<AudioResult>`
  - Mock implementation: return base64-encoded silent WAV for now
- Build `lib/audio-mixer.ts`:
  - `mixAudio(tracks: AudioTrack[]): Promise<AudioResult>` — combine multiple audio clips
  - Crossfade between clips

### Task 3: LipSync Enhancement
- Extend `LipSyncTab` to use audio pipeline:
  - After portrait + audio is combined into video, add the audio track
  - Support multiple talking heads in sequence
- Build `components/studio/LipSyncTimeline.tsx`:
  - Visual timeline showing portrait clips + audio track alignment

### Task 4: Quality Gates
- types: `npx tsc --noEmit` — 0 errors
- tests: unit tests for `audio-generator.ts` and `audio-mixer.ts`

## Files

### New Files
- `components/studio/AudioControls.tsx`
- `components/studio/AudioEditor.tsx`
- `components/studio/LipSyncTimeline.tsx`
- `lib/audio-generator.ts`
- `lib/audio-mixer.ts`

### Modified Files
- `store/useStudioStore.ts` — add `AudioTabState`, update `LipSyncTabState`
- `specs/in-progress/PHASE-7.md` — archived to `specs/completed/PHASE-7.md`

## Acceptance Criteria
- [ ] TTS text input produces audio waveform preview
- [ ] Audio editor shows timeline with split and fade controls
- [ ] LipSync timeline shows portrait clips aligned with audio
- [ ] All quality gates pass
