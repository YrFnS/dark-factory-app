# Phase 8 — Inpaint/Canvas Editor

## Overview

Build the inpaint canvas editor: load an image, paint a mask over areas to regenerate, output original image + mask for the inpaint API.

## Tasks

### Task 1: InpaintCanvas.tsx
- HTML5 `<canvas>` element that renders the loaded image at fit-to-container scale
- Overlay mask canvas drawn on top (same dimensions)
- Mask drawn with red `#ff0000` at 40% opacity
- Brush drawing: mousedown starts stroke, mousemove continues, mouseup ends
- Eraser mode: `destination-out` composite to erase mask
- Zoom: transform applied to canvas group for zoom in/out
- Pan: when zoomed, drag to pan
- Expose via ref: `getImageData(): { original: string, mask: string }` — returns data URLs

### Task 2: MaskControls.tsx
- Brush size slider: 5–100px, default 20px
- Brush hardness slider: 0–100%, default 80% (affects globalAlpha of brush strokes)
- Clear mask button: resets mask canvas to transparent
- Undo last stroke: store stroke history (array of canvas ImageData snapshots), pop last on undo

### Task 3: CanvasToolbar.tsx
- Tool toggle: Brush / Eraser (icon buttons with active state)
- Zoom in (+), Zoom out (-), Fit to view (fit), Reset (1:1)
- Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z)
- All buttons use `Button` component variants (ghost/outline)

## Design System
- Background: #0a0a0c
- Card: #141414
- Glass border: rgba(255,255,255,0.08)
- Accent: #d9ff00
- Use same inline styled-jsx patterns as Modal/Button

## Files
- `components/studio/InpaintCanvas.tsx` (new)
- `components/studio/MaskControls.tsx` (new)
- `components/studio/CanvasToolbar.tsx` (new)

## Acceptance Criteria
- [ ] Image loads onto canvas and scales to fit container
- [ ] Brush paints red mask on mouse drag
- [ ] Eraser removes mask
- [ ] Undo restores previous mask state
- [ ] Zoom in/out scales canvas group
- [ ] Fit to view resets zoom and centers image
- [ ] TypeScript compiles with 0 errors
