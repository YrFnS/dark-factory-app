# Phase 2 Spec: ModelSelector + Model Options

## Task
Build `components/studio/ModelSelector.tsx` — a searchable dropdown with provider badge colors.

## Problems
- `ImageTab.tsx` imports from `@/lib/model-options` which does not exist (causes build failure)
- `ModelSelector` lives as a stub inside `StudioControls.tsx` — must be extracted to its own file
- No provider badge colors on the current stub

## Files to create
- `lib/model-options.ts` — exports `getImageModelOptions()` reading from `lib/models.ts`
- `components/studio/ModelSelector.tsx` — extracted, searchable select with provider color dot + badge

## Files to modify
- `components/studio/StudioControls.tsx` — remove inline ModelSelector (re-export from new file)
- `components/tabs/ImageTab.tsx` — update import to use new `ModelSelector` file

## Implementation
- `ModelSelector`: native `<select>` with search input above it that filters options; colored dot before the selected option showing provider color from `PROVIDER_COLORS`
- `getImageModelOptions`: reads image-type models from `lib/models.ts` MODELS array, maps to `{ value: id, label: name, providerColor }`
- Provider colors: openai=#22c55e, google=#3b82f6, replicate=#a855f7, muapi=#eab308

## Verification
- `npx tsc --noEmit` passes (no new type errors)
- `grep -r "model-options" /home/lich/test/dark-factory-app --include="*.ts" --include="*.tsx"` finds no broken imports
- `ModelSelector` exists as a standalone file
