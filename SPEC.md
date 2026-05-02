# SPEC.md — Dark Factory App

> The machine that runs the machine.

## 1. Concept & Vision

Dark Factory App is a meta-level autonomous development pipeline tool — it is itself built using the principles it embodies. It coordinates AI agents to plan, implement, test, and validate software with zero human intervention in the execution loop. It is the operating system of a fully AI-driven software factory.

The visual personality is **industrial noir**: dark surfaces, precise typography, amber/orange warning accents, monospace readouts. Think a factory floor control panel — authoritative, information-dense, and slightly ominous.

## 2. Design Language

### Aesthetic Direction
Industrial control system meets modern dashboard. Inspired by Bloomberg Terminal, factory SCADA interfaces, and dark-mode IDEs.

### Color Palette
```
--bg-primary:    #0d0d0f   (near-black base)
--bg-secondary:  #161618   (panel surfaces)
--bg-tertiary:   #1e1e21   (elevated cards)
--border:        #2a2a2e   (subtle dividers)
--text-primary:  #e8e8ec   (high-contrast text)
--text-secondary:#8b8b94   (muted labels)
--accent-amber:  #f59e0b   (primary action, active state)
--accent-red:    #ef4444   (error, blocked)
--accent-green:  #22c55e   (success, complete)
--accent-blue:   #3b82f6   (info, in-progress)
```

### Typography
- **Headings**: JetBrains Mono (700) — monospace authority
- **Body**: Inter (400/500) — readable information density
- **Data/Readouts**: JetBrains Mono (400) — terminal aesthetic

### Spatial System
- 4px base unit
- Generous padding in panels (24px), tight in data grids (8px)
- Sharp corners (2px radius max) — industrial, not soft

### Motion Philosophy
- Minimal, purposeful animation
- Status changes: color transitions 200ms ease
- Log entries: slide-in from left, 150ms
- No decorative motion — every animation conveys state change

## 3. Layout & Structure

### Main Dashboard (Single Page App)
```
┌─────────────────────────────────────────────────────┐
│  HEADER: Logo | Phase: N/M | Status Badge | Time    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────────────────────┐  │
│  │  PIPELINE   │  │  CURRENT PHASE DETAIL          │  │
│  │  TIMELINE   │  │  ├─ Goals                      │  │
│  │  (vertical) │  │  ├─ Files                      │  │
│  │  Phase 0 ✓  │  │  ├─ Acceptance Criteria      │  │
│  │  Phase 1 ●  │  │  └─ Agent Activity Log       │  │
│  │  Phase 2 ○  │  ├───────────────────────────────┤  │
│  │  Phase 3 ○  │  │  QUALITY GATES                │  │
│  │  Phase 4 ○  │  │  Lint ● | Types ● | Tests ●  │  │
│  │  Phase 5 ○  │  └───────────────────────────────┘  │
│  └─────────────┘                                     │
├─────────────────────────────────────────────────────┤
│  LOG STREAM (live, auto-scroll, monospace)          │
└─────────────────────────────────────────────────────┘
```

### Responsive Strategy
- Desktop-first (this is a control panel, not a mobile app)
- Tablet: stack pipeline and phase detail vertically
- Mobile: simplified status view only (phase number + status badge)

## 4. Features & Interactions

### Core Features

**F1 — Phase State Display**
- Shows all 9 phases in vertical timeline
- Each phase: icon (pending/running/complete/blocked), name, timestamp
- Current phase expands to show detail panel
- Clicking a phase shows its spec and artifacts (read-only)

**F2 — Live Log Stream**
- Real-time log entries from all agents
- Auto-scroll with pause-on-hover
- Filter by agent (Plan/Implement/Test)
- Filter by level (INFO/WARN/ERROR/DEBUG)
- Searchable (Cmd+F style)

**F3 — Quality Gates Dashboard**
- Three gates per phase: Lint, Types, Tests
- Each gate: icon (passing/failing/running/pending)
- On hover: last run timestamp, error count, link to full report
- Clicking opens full report in modal or side panel

**F4 — Phase Spec Viewer**
- Read-only view of current phase SPEC.md
- Syntax highlighted markdown
- "Previous Phase Specs" accordion at bottom

**F5 — Manual Override Controls** (restricted)
- "Advance Phase" button (advances if current phase is complete)
- "Retry Phase" button (re-runs current phase from implement)
- "Reset Pipeline" button (wipes state, returns to Phase 0)
- All override actions logged with timestamp

**F6 — Cron Status**
- Shows next scheduled run time
- Shows last run timestamp and outcome
- Manual "Run Now" trigger

### Interactions

| Element | Hover | Click | State |
|---------|-------|-------|-------|
| Phase node | Glow + tooltip | Open spec viewer | — |
| Log entry | Highlight row | Copy to clipboard | — |
| Gate badge | Show mini-report | Open full report | pass/fail/run |
| Override btn | Amber glow | Confirm dialog → execute | disabled if wrong state |

### Error States
- Phase blocked: red banner with error summary
- Agent timeout: amber warning, auto-retry indicator
- All gates failing: phase card turns red border

## 5. Component Inventory

### PhaseTimeline
- Vertical list of PhaseNode components
- States: pending (hollow circle), active (filled + pulse), complete (checkmark), blocked (X)

### PhaseNode
- States: pending | in-progress | complete | blocked
- In-progress: amber border glow animation
- Blocked: red border, shake animation on first appearance

### GateBadge
- States: pending (gray), running (blue pulse), pass (green), fail (red)
- Hover: mini tooltip with error count

### LogStream
- Virtualized list for performance (if > 1000 entries)
- Entry format: `[HH:MM:SS] [AGENT] [PHASE-N] LEVEL: message`
- Color-coded by level

### SpecViewer
- Markdown renderer with code syntax highlighting
- Sticky header with phase name

### OverridePanel
- Three buttons in a confirmation workflow
- Confirmation requires typing "CONFIRM" for destructive actions

### CronStatusBar
- Shows: "Next run: HH:MM:SS" | "Last run: HH:MM:SS — Outcome"
- Manual "Trigger Now" button

## 6. Technical Approach

### Stack
- **Runtime**: Node.js 20+ (for Claude Code CLI integration)
- **Frontend**: Next.js 14 App Router, TypeScript strict mode
- **Styling**: Tailwind CSS + CSS custom properties for theming
- **State**: React Context + `useReducer` for pipeline state
- **Real-time**: SSE (Server-Sent Events) from orchestrator logs
- **Agent execution**: Spawned as child processes (Node.js `child_process.spawn`)

### Architecture
```
app/
├── page.tsx               ← Main dashboard
├── layout.tsx             ← Root layout with fonts
├── api/
│   ├── state/             ← GET pipeline state.json
│   ├── logs/stream/       ← SSE log stream
│   └── phase/             ← POST: advance/retry/reset
components/
├── PhaseTimeline/
├── PhaseDetail/
├── LogStream/
├── QualityGates/
├── SpecViewer/
└── OverridePanel/
lib/
├── orchestrator.ts        ← Phase state machine
├── agent-spawner.ts       ← Spawns plan/implement/test agents
├── log-writer.ts          ← Append-only log utility
└── state-store.ts         ← pipeline/state.json reader/writer
scripts/
├── plan-agent.sh          ← Calls Claude Code with plan prompt
├── implement-agent.sh     ← Calls Claude Code with implementation prompt
├── test-agent.sh          ← Calls Claude Code with test prompt
└── audit.sh               ← Final audit report generator
```

### Data Model

**Pipeline State** (`pipeline/state.json`):
```typescript
interface PipelineState {
  version: string;
  currentPhase: number;        // 0-8
  phases: {
    [phase: number]: {
      status: 'pending' | 'in-progress' | 'complete' | 'blocked';
      startedAt?: string;      // ISO timestamp
      completedAt?: string;
      error?: string;
      iteration: number;       // retry count
      gates: {
        lint: GateResult;
        types: GateResult;
        tests: GateResult;
      };
    };
  };
  lastCronRun?: string;
  nextCronRun?: string;
}

interface GateResult {
  status: 'pending' | 'pass' | 'fail' | 'running';
  lastRun?: string;
  errorCount?: number;
  reportPath?: string;
}
```

### Key Constraints
- No database — filesystem is the source of truth (`pipeline/state.json`)
- Logs are append-only files (no log rotation in v1)
- Orchestrator is a singleton — only one instance runs at a time (PID lock)
- All agent work is in `pipeline/phase-N/` subdirectories
- Specs are the only human-authored input (stored in `specs/`)

## 7. Phases

### Phase 0 — Init (this phase)
- [x] Create project structure
- [x] Write SPEC.md
- [x] Write rules.md
- [x] Init git repo
- [x] Create state.json with phase 0 complete

### Phase 1 — Core Orchestrator
- [x] Implement `orchestrator.ts` (phase state machine)
- [x] Implement `state-store.ts` (read/write state.json)
- [x] Implement `log-writer.ts`
- [x] Implement `scripts/plan-agent.sh`, `implement-agent.sh`, `test-agent.sh`
- [x] Implement `pipeline/state.json` initial state
- [x] 52 unit tests, all gates pass

### Phase 2 — Dashboard UI
- [x] Implement all React components
- [x] Implement Next.js pages and API routes
- [x] Implement SSE log stream endpoint
- [x] Wire up frontend to state.json
- [x] Quality gates: types ✅, tests ✅, lint ⚠️ (ESLint v10/v9 config incompatibility — pre-existing)

### Phase 3 — Agent Integration
- [x] Implement `agent-spawner.ts`
- [x] Connect agents to orchestrator
- [x] Implement live log streaming to dashboard
- [x] Implement quality gate execution
- [x] 136 total tests, all gates pass

### Phase 4 — Polish & Hardening
- [x] Error handling, edge cases
- [x] Timeout and retry logic
- [x] Override safety checks
- [x] UI polish
- [x] 27 Phase 4 tests pass

### Phase 5 — Result Panel + History
- [x] ResultPanel: image display, download, "use as reference"
- [x] HistoryPanel: generation history sidebar
- [x] 163 tests across 11 test files, all pass

### Phase 6 — Tabbed Studio Layout
- [ ] Tab bar: Image | Video | Cinema | LipSync
- [ ] ImageTab assembly from Phase 3–5 components
- [ ] VideoTab: duration selector, start-frame selector, video player
- [ ] CinemaTab: CinemaCameraControls (lens/focal/aperture/camera body → prompt suffix)
- [ ] LipSyncTab: portrait + audio upload, waveform preview

### Phase 7 — Inpaint/Canvas Editor
- [ ] InpaintCanvas: HTML5 canvas, zoom/pan, paint/mask mode
- [ ] MaskControls: brush size, hardness, eraser, clear mask
- [ ] CanvasToolbar: Pan, Brush, Eraser, Zoom, Undo/Redo, Inpaint trigger
- [ ] InpaintResultPanel: before/after, "Use as new base"
- [ ] InpaintHistory: per-image version stack
- [ ] Inpaint API route + provider support

### Phase 8 — Comparison Slider + Polish
- [ ] ComparisonSlider: draggable before/after divider
- [ ] Toast notifications (success/error feedback)
- [ ] Upload API route
- [ ] Keyboard shortcuts (Cmd+Enter to generate, etc.)
- [ ] Empty states, responsive layout

### Phase 9 — Finalize
- [ ] Self-audit: does the app pass its own quality gates?
- [ ] Documentation
- [ ] Git branch merge to main
- [ ] Tag v1.0.0

---

## Metadata
- SPEC version: 1.1.0
- Created: 2026-05-01
- Updated: 2026-05-02
- Phase: 0–5 complete, resuming at Phase 6
- Status: in_progress
