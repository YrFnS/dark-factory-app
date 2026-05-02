# Phase 2 — Dashboard UI

> Metadata
> - Phase: 2
> - Status: in-progress
> - Parent: SPEC.md §7
> - Plan-agent: completed 2026-05-01

## 1. Goals

Phase 2 builds the dashboard UI for the Dark Factory pipeline. By the end of Phase 2:

- All 7 React components are implemented and wired to pipeline state
- Next.js 14 App Router structure is in place (pages, layout, API routes)
- SSE log stream endpoint streams real-time logs to the dashboard
- Frontend reads from and polls `pipeline/state.json` via API routes
- CronStatusBar displays next/last run timestamps
- OverridePanel provides advance/retry/reset controls

Phase 2 does NOT include agent spawning, cron job setup, or real agent integration — those are Phase 3.

---

## 2. Implementation Order & Dependencies

```
[Setup]           Next.js + Tailwind scaffolding          (Task 1)
                  Type definitions                         (Task 2)
                  Pipeline context + reducer              (Task 3)

[API Routes]      GET /api/state                           (Task 4)
                  POST /api/phase                          (Task 5)
                  GET /api/logs/stream (SSE)              (Task 6)

[Components]      PhaseTimeline + PhaseNode               (Task 7)
                  GateBadge                                (Task 8)
                  LogStream                                 (Task 9)
                  SpecViewer                                (Task 10)
                  OverridePanel                             (Task 11)
                  CronStatusBar                             (Task 12)

[Pages]          Root layout + fonts                      (Task 13)
                  Main dashboard page.tsx                  (Task 14)

[Integration]    Wire components to state                  (Task 15)
                  Final integration + acceptance           (Task 16)
```

---

## 3. Task Details

---

### Task 1: Next.js + Tailwind Scaffolding

**Files:**
- `package.json` (modify)
- `next.config.js` (create)
- `tailwind.config.ts` (create)
- `postcss.config.js` (create)
- `app/` directory (create)
- `app/globals.css` (create)

**What:**
Install Next.js 14, React, React-DOM, and Tailwind CSS dependencies. Configure `next.config.js`, `tailwind.config.ts`, and `postcss.config.js` to match the industrial noir design language. Set up `app/globals.css` with CSS custom properties for all colors from SPEC.md §2 and base Tailwind directives. Create `app/` directory structure.

**Acceptance criteria:**
- [ ] `package.json` has `next`, `react`, `react-dom`, `tailwindcss`, `postcss`, `autoprefixer` in dependencies
- [ ] `next.config.js` has `reactStrictMode: true` and `typescript: { ignoreBuildErrors: false }`
- [ ] `tailwind.config.ts` extends theme with `bg-primary`, `bg-secondary`, `bg-tertiary`, `border-default`, `text-primary`, `text-secondary`, `accent-amber`, `accent-red`, `accent-green`, `accent-blue` using SPEC.md color values
- [ ] `globals.css` defines `:root` CSS variables and includes Tailwind base/components/utilities
- [ ] `app/` directory created with empty `layout.tsx` and `page.tsx` placeholders
- [ ] `tsc --noEmit` passes after setup (no type errors from Next.js types)

**Risks:**
- Next.js 14 version conflicts with existing TypeScript version — pin to compatible versions
- Tailwind v4 has breaking changes — use v3.x stable

---

### Task 2: Type Definitions

**Files:**
- `types/pipeline.ts` (create)
- `types/log.ts` (create)

**What:**
Define all TypeScript interfaces matching `pipeline/state.json` schema and log entry format from rules.md §9. Create `types/pipeline.ts` with `PipelineState`, `PhaseState`, `GateResult`, `PhaseStatus`, `GateStatus`. Create `types/log.ts` with `LogEntry`, `LogLevel`, `AgentType`.

**Acceptance criteria:**
- [ ] `PipelineState` interface has `version`, `currentPhase`, `phases`, `lastCronRun`, `nextCronRun` matching state.json schema
- [ ] `PhaseState` interface has `status`, `startedAt`, `completedAt`, `error`, `iteration`, `gates` matching state.json schema
- [ ] `GateResult` interface has `status`, `lastRun`, `errorCount`, `reportPath` matching state.json schema
- [ ] `LogEntry` interface has `timestamp`, `agent`, `phase`, `level`, `message`
- [ ] `LogLevel` is union: `'INFO' | 'WARN' | 'ERROR' | 'DEBUG'`
- [ ] `AgentType` is union: `'orchestrator' | 'plan' | 'implement' | 'test'`
- [ ] All interfaces exported
- [ ] `tsc --noEmit` passes

**Risks:**
- None — pure type definitions

---

### Task 3: Pipeline Context + useReducer

**Files:**
- `context/PipelineContext.tsx` (create)
- `lib/state-store.ts` (read — do not modify Phase 1's implementation, only re-export types)

**What:**
Create a React Context (`PipelineContext`) that holds `PipelineState`. Implement a `usePipeline` hook that wraps `useReducer` with actions: `SET_STATE`, `UPDATE_PHASE`, `UPDATE_GATE`. The context fetches initial state from `GET /api/state` on mount and exposes a `dispatch` function. Also re-export pipeline types from `lib/state-store.ts` for consumer use.

**Acceptance criteria:**
- [ ] `PipelineContext` is created with proper React context typing
- [ ] `usePipeline()` hook returns `{ state: PipelineState, dispatch: Dispatch<PipelineAction> }`
- [ ] `PipelineAction` union type includes `SetStateAction`, `UpdatePhaseAction`, `UpdateGateAction`
- [ ] Initial state is fetched from `/api/state` on mount (useEffect with fetch)
- [ ] Loading state is tracked during initial fetch
- [ ] Error state is tracked if fetch fails
- [ ] Context is wrapped in `<Provider>` pattern for app-wide availability
- [ ] `tsc --noEmit` passes

**Risks:**
- Must not call `state-store.ts` write methods — only reads happen from the frontend in Phase 2

---

### Task 4: GET /api/state API Route

**Files:**
- `app/api/state/route.ts` (create)

**What:**
Implement Next.js Route Handler at `app/api/state/route.ts` that performs a GET request. It reads `pipeline/state.json` from the filesystem and returns it as JSON with `Content-Type: application/json`. Returns `500` if the file doesn't exist or is invalid JSON, with a descriptive error message.

**Acceptance criteria:**
- [ ] `GET /api/state` returns `200` with full `PipelineState` JSON from `pipeline/state.json`
- [ ] Response has `Cache-Control: no-cache` header to prevent stale reads
- [ ] Returns `500` with `{ error: string }` if `state.json` is missing or malformed
- [ ] Uses `fs.promises.readFile` with absolute path constructed from `process.cwd()`
- [ ] `tsc --noEmit` passes
- [ ] Route handler is registered at the correct Next.js App Router path

**Risks:**
- Path resolution must use `process.cwd()` not a relative path

---

### Task 5: POST /api/phase API Route

**Files:**
- `app/api/phase/route.ts` (create)

**What:**
Implement POST `/api/phase` route handler that accepts `{ action: 'advance' | 'retry' | 'reset', phase?: number }`. Validates the action is legal given current pipeline state (e.g., can only advance if current phase is complete). In Phase 2, this route delegates to `lib/state-store.ts` write methods. Returns updated state after action.

**Acceptance criteria:**
- [ ] `POST /api/phase` with `{ action: 'advance' }` advances phase if current is complete
- [ ] `POST /api/phase` with `{ action: 'retry', phase: N }` resets phase N to in-progress with incremented iteration
- [ ] `POST /api/phase` with `{ action: 'reset' }` resets all phases to pending, currentPhase to 0
- [ ] Returns `400` if action is illegal (e.g., advance when current phase not complete)
- [ ] Returns `500` if state-store write fails
- [ ] Returns updated `PipelineState` after successful action
- [ ] All state changes are logged with timestamp
- [ ] `tsc --noEmit` passes

**Risks:**
- This route modifies state — must validate state transitions carefully

---

### Task 6: GET /api/logs/stream SSE Endpoint

**Files:**
- `app/api/logs/stream/route.ts` (create)

**What:**
Implement SSE (Server-Sent Events) route at `GET /api/logs/stream`. Streams log entries from `logs/orchestrator.log` (and optionally `logs/plan.log`, `logs/implement.log`, `logs/test.log`) as they are appended. Uses `ReadableStream` with `TextEncoder`. Sends `data: ` formatted lines per SSE spec. Implements proper cleanup on client disconnect. Streams all existing logs on connect, then continues tailing.

**Acceptance criteria:**
- [ ] SSE endpoint sets `Content-Type: text/event-stream; charset=utf-8`
- [ ] SSE endpoint sets `Cache-Control: no-cache`
- [ ] SSE endpoint sets `Connection: keep-alive`
- [ ] Existing log entries are sent immediately on connection
- [ ] New log entries are streamed as they are appended (tail -f behavior)
- [ ] Log entries are formatted as SSE data: `{ "timestamp": "...", "agent": "...", "phase": "...", "level": "...", "message": "..." }`
- [ ] Client disconnect properly cleans up the watch/stream
- [ ] Returns `500` if log file cannot be read
- [ ] `tsc --noEmit` passes

**Risks:**
- Must handle log file rotation or large files gracefully (stream, don't load entire file)
- Watch stream must be properly cleaned up on abort

---

### Task 7: PhaseTimeline + PhaseNode Components

**Files:**
- `components/PhaseTimeline/index.tsx` (create)
- `components/PhaseTimeline/PhaseTimeline.tsx` (create)
- `components/PhaseTimeline/PhaseNode.tsx` (create)
- `components/PhaseTimeline/styles.css` (create)

**What:**
Implement `PhaseTimeline` as a vertical list of `PhaseNode` components. `PhaseNode` displays: phase number, phase name, status icon (pending/running/complete/blocked), and timestamp. The current phase is highlighted with amber accent. Clicking a phase node opens its spec (calls `SpecViewer` with phase number). `PhaseNode` handles all 4 visual states per SPEC.md §5.

**Acceptance criteria:**
- [ ] `PhaseTimeline` renders all 6 phases in a vertical list
- [ ] Each `PhaseNode` shows: phase number (0-5), phase name, status icon, timestamp (startedAt or completedAt)
- [ ] Status icon: pending = hollow circle `○`, in-progress = filled circle `●` with amber glow, complete = checkmark `✓`, blocked = `✕` with red
- [ ] Current phase (`currentPhase`) has amber left border accent
- [ ] Complete phases show green checkmark
- [ ] Blocked phases show red `✕` and red border
- [ ] In-progress phase has amber border glow animation (CSS animation)
- [ ] Clicking a phase node triggers `onPhaseSelect(phaseNumber)` callback
- [ ] `tsc --noEmit` passes
- [ ] All styles use Tailwind + CSS custom properties, no hardcoded colors

**Risks:**
- Phase names should come from a constant mapping (phase 0 = "Init", 1 = "Core Orchestrator", etc.)

---

### Task 8: GateBadge Component

**Files:**
- `components/GateBadge/index.tsx` (create)
- `components/GateBadge/GateBadge.tsx` (create)

**What:**
Implement `GateBadge` component that displays a single quality gate (lint/types/tests). Shows icon + label. Handles 4 states: pending (gray), running (blue pulse), pass (green), fail (red). Hover shows tooltip with error count and last run time. GateBadge is used inside `QualityGates` component.

**Acceptance criteria:**
- [ ] `GateBadge` accepts `gate: GateResult`, `label: string`, `type: 'lint' | 'types' | 'tests'`
- [ ] Shows icon: pending = `○`, running = spinning `●`, pass = `✓`, fail = `✕`
- [ ] pending state: gray (#8b8b94) text and icon
- [ ] running state: blue (#3b82f6) with CSS pulse animation
- [ ] pass state: green (#22c55e) text and icon
- [ ] fail state: red (#ef4444) text and icon, red border
- [ ] Hover tooltip shows: "Last run: {timestamp}", "Errors: {errorCount}"
- [ ] Tooltip positioned above the badge
- [ ] `tsc --noEmit` passes

**Risks:**
- Tooltip should not overflow viewport on small screens

---

### Task 9: LogStream Component

**Files:**
- `components/LogStream/index.tsx` (create)
- `components/LogStream/LogStream.tsx` (create)
- `components/LogStream/styles.css` (create)

**What:**
Implement `LogStream` component that connects to `GET /api/logs/stream` SSE endpoint and renders log entries in real-time. Uses monospace font, color-coded by level (INFO=white, WARN=amber, ERROR=red, DEBUG=gray). Auto-scrolls to bottom unless user is hovering. Includes filter controls: agent dropdown (All/Plan/Implement/Test) and level dropdown (All/INFO/WARN/ERROR/DEBUG). Includes a search input that filters entries by message content.

**Acceptance criteria:**
- [ ] Connects to SSE endpoint on mount, disconnects on unmount
- [ ] Renders log entries in format: `[HH:MM:SS] [AGENT] [PHASE-N] LEVEL: message`
- [ ] INFO entries: `--text-primary` color
- [ ] WARN entries: `--accent-amber` color
- [ ] ERROR entries: `--accent-red` color
- [ ] DEBUG entries: `--text-secondary` color (only shown if DEBUG filter active)
- [ ] Auto-scrolls to bottom when new entries arrive, unless user is hovering
- [ ] Pause-on-hover: when mouse is over the log area, auto-scroll stops
- [ ] Agent filter dropdown filters by agent type
- [ ] Level filter dropdown filters by log level
- [ ] Search input filters entries by message content (case-insensitive)
- [ ] Log area has a dark background (`--bg-secondary`) with monospace font
- [ ] `tsc --noEmit` passes

**Risks:**
- Must handle rapid log updates without freezing the UI (use throttled state updates or virtual list if > 500 entries)

---

### Task 10: SpecViewer Component

**Files:**
- `components/SpecViewer/index.tsx` (create)
- `components/SpecViewer/SpecViewer.tsx` (create)

**What:**
Implement `SpecViewer` component that displays markdown content (phase spec). Uses a simple markdown renderer (no heavy dependencies — can use `react-markdown` with `remark-gfm`). Shows sticky header with phase name. Includes syntax highlighting for code blocks. Displays "Previous Phase Specs" accordion at bottom listing completed phases.

**Acceptance criteria:**
- [ ] `SpecViewer` accepts `phaseNumber: number` prop
- [ ] Reads phase spec from `specs/in-progress/PHASE-{N}.md` for current phase
- [ ] Renders markdown with proper heading hierarchy (h1-h6)
- [ ] Code blocks use monospace font with dark background
- [ ] Sticky header shows "Phase {N} — {Phase Name}"
- [ ] "Previous Phase Specs" accordion at bottom lists phases 0 to N-1
- [ ] Clicking a previous phase spec in accordion shows that phase's spec
- [ ] If spec file is missing, shows "Spec not found" message
- [ ] Uses `react-markdown` + `remark-gfm` packages
- [ ] `tsc --noEmit` passes

**Risks:**
- File reading must use absolute path from `process.cwd()`
- Keep markdown parser lightweight — do not add heavy remark plugins

---

### Task 11: OverridePanel Component

**Files:**
- `components/OverridePanel/index.tsx` (create)
- `components/OverridePanel/OverridePanel.tsx` (create)

**What:**
Implement `OverridePanel` with three override controls: "Advance Phase", "Retry Phase", "Reset Pipeline". Each button triggers a confirmation dialog before executing. "Reset Pipeline" requires user to type "CONFIRM" in an input field (per SPEC.md §4 F5). Buttons are disabled when the current state doesn't permit the action (e.g., cannot advance if current phase is not complete). All actions call `POST /api/phase`.

**Acceptance criteria:**
- [ ] "Advance Phase" button: enabled only when current phase status is `complete`
- [ ] "Retry Phase" button: enabled only when current phase status is `in-progress` or `blocked`
- [ ] "Reset Pipeline" button: always enabled
- [ ] Each button opens a confirmation modal before executing
- [ ] "Reset Pipeline" confirmation requires typing "CONFIRM" in an input field
- [ ] Cancel button closes modal without action
- [ ] Execute button calls `POST /api/phase` with appropriate action payload
- [ ] On success, pipeline state refreshes
- [ ] On error, shows error message in modal
- [ ] Loading spinner shown during API call
- [ ] `tsc --noEmit` passes

**Risks:**
- Override actions are destructive — confirmation flow must be robust

---

### Task 12: CronStatusBar Component

**Files:**
- `components/CronStatusBar/index.tsx` (create)
- `components/CronStatusBar/CronStatusBar.tsx` (create)

**What:**
Implement `CronStatusBar` that displays cron schedule information from `pipeline/state.json`: "Next run: {timestamp}" and "Last run: {timestamp} — {outcome}". Shows a "Trigger Now" button that calls `POST /api/phase` with `{ action: 'advance' }` to manually trigger the next phase. Status bar is a compact horizontal bar at the top or bottom of the dashboard.

**Acceptance criteria:**
- [ ] Displays "Next run: {ISO timestamp}" in monospace font
- [ ] Displays "Last run: {ISO timestamp} — {outcome}" in monospace font
- [ ] "Trigger Now" button triggers manual phase advancement
- [ ] Timestamps are formatted as `YYYY-MM-DD HH:MM:SS` in local time
- [ ] If no lastCronRun exists, shows "Never run"
- [ ] If no nextCronRun exists, shows "Not scheduled"
- [ ] Shows amber dot indicator when a run is in progress
- [ ] `tsc --noEmit` passes

**Risks:**
- None — read-only from state.json, manual trigger calls existing POST endpoint

---

### Task 13: Root Layout + Fonts

**Files:**
- `app/layout.tsx` (create)
- `app/globals.css` (update from Task 1)

**What:**
Implement Next.js root layout (`app/layout.tsx`) that:
- Imports Google Fonts (JetBrains Mono and Inter) via `next/font/google`
- Wraps app in `PipelineProvider` from `context/PipelineContext`
- Sets default HTML attributes for dark theme
- Includes the `globals.css` import
- Sets metadata (title: "Dark Factory", description)

**Acceptance criteria:**
- [ ] `JetBrains_Mono` font loaded and available via CSS variable `--font-mono`
- [ ] `Inter` font loaded and available via CSS variable `--font-sans`
- [ ] `<html>` has `className="dark"` and `lang="en"`
- [ ] `PipelineProvider` wraps all children
- [ ] Metadata is set: title "Dark Factory", description "Autonomous AI-driven software factory"
- [ ] `tsc --noEmit` passes

**Risks:**
- Font loading must use Next.js font system for optimal performance

---

### Task 14: Main Dashboard Page

**Files:**
- `app/page.tsx` (create)
- `app/dashboard.module.css` (create)

**What:**
Implement the main dashboard page (`app/page.tsx`) that composes all components into the layout described in SPEC.md §3. The layout is:
```
┌─────────────────────────────────────────────────────┐
│  HEADER: Logo | Phase: N/M | Status Badge | CronStatusBar │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────────────────────┐  │
│  │  PIPELINE   │  │  CURRENT PHASE DETAIL        │  │
│  │  TIMELINE   │  │  ├─ Goals                    │  │
│  │  (vertical) │  │  ├─ Files                    │  │
│  │             │  │  ├─ Acceptance Criteria      │  │
│  │             │  │  └─ Agent Activity Log       │  │
│  │             │  ├───────────────────────────────┤  │
│  │             │  │  QUALITY GATES                │  │
│  │             │  │  Lint ● | Types ● | Tests ●  │  │
│  └─────────────┘  └───────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  LOG STREAM (live, auto-scroll, monospace)          │
└─────────────────────────────────────────────────────┘
```

Uses CSS Grid for the main layout. Header at top, pipeline timeline on left, phase detail + quality gates on right, log stream at bottom spanning full width.

**Acceptance criteria:**
- [ ] Header shows: "DARK FACTORY" logo text, "Phase: {current}/{total}", status badge (colored by state)
- [ ] Left column (30% width): PhaseTimeline component
- [ ] Right column (70% width): PhaseDetail placeholder + QualityGates (GateBadge x3)
- [ ] Bottom (25vh height): LogStream component
- [ ] Responsive: on tablet, pipeline timeline stacks above phase detail
- [ ] On mobile, shows simplified view (phase number + status only)
- [ ] All components receive state from `usePipeline()` hook
- [ ] `tsc --noEmit` passes

**Risks:**
- Responsive breakpoints: 1024px for tablet, 768px for mobile

---

### Task 15: Wire Components to State

**Files:**
- All component files (update as needed)
- `app/page.tsx` (update from Task 14)

**What:**
Wire all components to the `usePipeline()` context. PhaseTimeline receives state and calls dispatch on phase click. LogStream connects to SSE and receives state. OverridePanel calls POST endpoint and triggers state refresh. CronStatusBar reads `nextCronRun`/`lastCronRun` from state. PhaseDetail shows current phase info from `state.phases[state.currentPhase]`. QualityGates shows gate statuses from current phase.

**Acceptance criteria:**
- [ ] PhaseTimeline highlights current phase based on `state.currentPhase`
- [ ] Clicking a phase in PhaseTimeline updates `selectedPhase` state and shows that phase's spec in SpecViewer
- [ ] LogStream receives log entries from SSE and displays them
- [ ] OverridePanel buttons call `POST /api/phase` and refresh state on success
- [ ] CronStatusBar displays `state.nextCronRun` and `state.lastCronRun`
- [ ] QualityGates shows gate statuses from `state.phases[state.currentPhase].gates`
- [ ] PhaseDetail shows info from current phase
- [ ] Page auto-refreshes state every 10 seconds via polling (fallback for when SSE is not connected)
- [ ] `tsc --noEmit` passes

**Risks:**
- Polling interval should not cause UI flicker — only update if data changed

---

### Task 16: Final Integration + Acceptance Testing

**Files:**
- `app/page.tsx` (update)
- `components/` (update if needed)

**What:**
Final integration pass — verify all components work together. Test the complete user flow:
1. Dashboard loads and shows current phase
2. SSE connects and streams logs
3. Clicking a phase shows its spec
4. Override buttons are properly enabled/disabled per state
5. All quality gates display correct status
6. Cron status bar shows correct timestamps
7. Page auto-refreshes without flicker

Add a simple end-to-end test suite using Vitest + @testing-library/react to verify component behavior.

**Acceptance criteria:**
- [ ] `npm run build` completes without errors (Next.js production build)
- [ ] `npm run dev` starts without errors
- [ ] Dashboard page renders without console errors
- [ ] All 6 phases visible in timeline
- [ ] GateBadge renders all 4 states correctly
- [ ] LogStream renders entries from SSE (or empty state if no logs yet)
- [ ] SpecViewer renders markdown (test with a sample spec)
- [ ] OverridePanel buttons disabled when state doesn't permit action
- [ ] CronStatusBar renders timestamps or "Never run" / "Not scheduled"
- [ ] Responsive layout works at 1920px, 1024px, and 768px widths
- [ ] Unit tests for: PipelineContext reducer, GateBadge states, PhaseNode states
- [ ] `tsc --noEmit` passes with 0 errors

**Risks:**
- Production build must succeed — this is the gate for Phase 2 completion

---

## 4. Dependencies Summary

| Task | Depends On |
|------|-----------|
| 1 (Next.js setup) | None |
| 2 (Types) | None |
| 3 (Pipeline Context) | Task 2 |
| 4 (GET /api/state) | Task 2 |
| 5 (POST /api/phase) | Task 2, Task 4 |
| 6 (SSE endpoint) | Task 2 |
| 7 (PhaseTimeline) | Task 1, Task 3 |
| 8 (GateBadge) | Task 1, Task 2 |
| 9 (LogStream) | Task 1, Task 6 |
| 10 (SpecViewer) | Task 1, Task 2 |
| 11 (OverridePanel) | Task 1, Task 3, Task 5 |
| 12 (CronStatusBar) | Task 1, Task 3 |
| 13 (Root Layout) | Task 1 |
| 14 (Main Page) | Task 1, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12 |
| 15 (State wiring) | Task 3, Task 4, Task 5, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12 |
| 16 (Final testing) | All above |

---

## 5. New npm Dependencies Required

```
next@14
react@18
react-dom@18
tailwindcss@3
postcss
autoprefixer
react-markdown@9
remark-gfm@4
@testing-library/react@14
@testing-library/dom@9
jsdom
```

---

## 6. File Manifest

```
app/
├── layout.tsx                        [Task 13]
├── page.tsx                          [Task 14]
├── globals.css                       [Task 1]
├── api/
│   ├── state/
│   │   └── route.ts                  [Task 4]
│   ├── phase/
│   │   └── route.ts                  [Task 5]
│   └── logs/
│       └── stream/
│           └── route.ts              [Task 6]
components/
├── PhaseTimeline/
│   ├── index.tsx                    [Task 7]
│   ├── PhaseTimeline.tsx             [Task 7]
│   ├── PhaseNode.tsx                 [Task 7]
│   └── styles.css                   [Task 7]
├── GateBadge/
│   ├── index.tsx                    [Task 8]
│   └── GateBadge.tsx                [Task 8]
├── LogStream/
│   ├── index.tsx                    [Task 9]
│   ├── LogStream.tsx                 [Task 9]
│   └── styles.css                   [Task 9]
├── SpecViewer/
│   ├── index.tsx                    [Task 10]
│   └── SpecViewer.tsx                [Task 10]
├── OverridePanel/
│   ├── index.tsx                    [Task 11]
│   └── OverridePanel.tsx            [Task 11]
├── CronStatusBar/
│   ├── index.tsx                    [Task 12]
│   └── CronStatusBar.tsx            [Task 12]
├── PhaseDetail/
│   ├── index.tsx                    [Task 15]
│   └── PhaseDetail.tsx              [Task 15]
├── QualityGates/
│   ├── index.tsx                    [Task 15]
│   └── QualityGates.tsx             [Task 15]
context/
├── PipelineContext.tsx               [Task 3]
types/
├── pipeline.ts                       [Task 2]
└── log.ts                           [Task 2]
```

---

## 7. Acceptance Criteria — Phase 2 Completion

All of the following must be true to consider Phase 2 complete:

- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] `npm run dev` starts without errors
- [ ] `GET /api/state` returns valid `PipelineState` JSON
- [ ] `POST /api/phase` with `{ action: 'advance' }` advances phase when legal
- [ ] `POST /api/phase` with `{ action: 'reset' }` resets pipeline
- [ ] `GET /api/logs/stream` returns SSE stream with correct `Content-Type`
- [ ] All 6 phase nodes render in PhaseTimeline with correct states
- [ ] GateBadge renders all 4 states (pending/running/pass/fail)
- [ ] LogStream connects to SSE and renders entries
- [ ] SpecViewer renders markdown specs
- [ ] OverridePanel buttons are properly enabled/disabled
- [ ] CronStatusBar shows next/last run timestamps
- [ ] All components use design language from SPEC.md §2 (colors, fonts, spacing)
- [ ] Responsive layout works at 1920px, 1024px, 768px
- [ ] Phase 2 quality gates (lint, types, tests) all pass

---

## 8. Out of Scope (Phase 3)

- Agent spawning (`agent-spawner.ts`)
- Live log streaming from real agent processes
- Cron job setup and execution
- Quality gate execution (lint/type/test runners)
- Real-time agent activity
