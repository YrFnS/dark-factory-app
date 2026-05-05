# Phase 1 Spec: Button Component + Accent Color Fix

## Goal
Extract `Button` into `components/ui/Button.tsx` with primary/ghost/outline variants using `#d9ff00` accent. Fix accent color throughout the project.

## Design Tokens (from plan)
- Primary/Accent: `#d9ff00`
- Background: `#050505`
- Panel: `#0a0a0a`
- Card: `#141414`
- Border: `rgba(255,255,255,0.05)`
- Glass BG: `rgba(255,255,255,0.03)`
- Glass Border: `rgba(255,255,255,0.08)`

## Button Variants

### Primary
- Background: `#d9ff00`
- Text: `#000000` (black)
- Hover: subtle glow shadow `0 0 20px rgba(217,255,0,0.4)`
- Active: slightly darker `#c4e600`

### Ghost
- Background: transparent
- Text/Border: `#d9ff00`
- Hover: `rgba(217,255,0,0.08)` fill

### Outline
- Background: transparent
- Border: `rgba(255,255,255,0.08)`
- Text: `#ffffff`
- Hover: border brightens to `rgba(255,255,255,0.15)`

## Sizes
- `sm`: h-8 px-3 text-xs
- `md`: h-10 px-4 text-sm
- `lg`: h-12 px-6 text-base

## States
- `disabled`: opacity 0.4, cursor not-allowed
- `loading`: shows spinner, text "Loading..."

## Files
- Create: `components/ui/Button.tsx`
- Modify: `app/globals.css` (add `--color-primary: #d9ff00`)
- Modify: `components/studio/StudioControls.tsx` (update inline button styles from `#3b82f6` → `#d9ff00`)

## Verification
- `next build` passes with no type errors
- Button renders in browser with correct accent color
