# Phase 7 — 3D Asset Generation

## Overview

Implement 3D asset generation capabilities in the studio. Extend the tab model with a 3D tab supporting mesh generation, texture synthesis, and 3D preview.

## Tasks

### Task 1: ThreeDeeTab
- Build `components/tabs/ThreeDeeTab.tsx` — studio assembly with 3D-specific controls
- Build `components/studio/ThreeDeeControls.tsx`:
  - Mesh type selector: Humanoid, Animal, Prop, Vehicle, Architecture, Abstract
  - Pose/expression selector (for humanoid/animal): T-pose, A-pose, Custom
  - Texture resolution: 512/1024/2048/4096
  - Mesh complexity: Low/Medium/High/Ultra (polygon budget hint)
  - Preview mode toggle: Solid / Wireframe / Textured
- Build `components/studio/ThreeDeePreview.tsx`:
  - `<canvas>` WebGL preview with orbit controls (manual implementation, no external library)
  - Mouse drag to rotate, scroll to zoom
  - Display current mesh stats (vertices, faces)

### Task 2: 3D Generation Service
- Build `lib/three-dee-generator.ts`:
  - `generateMesh(params: MeshGenParams): Promise<MeshResult>` — returns mock mesh data
  - Support for multiple mesh formats (obj, gltf, fbx)
  - Texture map generation (diffuse, normal, roughness)
- Mock implementation: return procedural geometry (UV sphere, box, cylinder) based on params

### Task 3: ThreeDeeTab Integration
- Connect `ThreeDeeTab` to `useStudioStore` (add `ThreeDeeTabState`)
- Wire up generation to canvas preview
- History panel for generated meshes

### Task 4: Quality Gates
- types: `npx tsc --noEmit` — 0 errors
- tests: unit tests for `three-dee-generator.ts` (mock geometry generation, format conversion, parameter validation)

## Files

### New Files
- `components/tabs/ThreeDeeTab.tsx`
- `components/studio/ThreeDeeControls.tsx`
- `components/studio/ThreeDeePreview.tsx`
- `lib/three-dee-generator.ts`

### Modified Files
- `store/useStudioStore.ts` — add `ThreeDeeTabState` and `updateThreeDeeTab`
- `specs/in-progress/PHASE-6.md` — archived to `specs/completed/PHASE-6.md`

## Acceptance Criteria
- [ ] 3D tab appears in tab bar alongside Image, Video, Cinema, LipSync
- [ ] Canvas renders a rotatable 3D mesh
- [ ] Mesh type and resolution selectors affect generation
- [ ] History panel shows past generations
- [ ] All quality gates pass
