# Phase 1 — Core Orchestrator

> Metadata
- Phase: 1
- Created: 2026-05-01
- Status: in-progress
- Parent: SPEC.md

## 1. Goals

Phase 1 establishes the core orchestration engine for the Dark Factory pipeline. It delivers the TypeScript foundation (`lib/`) that manages phase state transitions, persists pipeline state to `pipeline/state.json`, and provides append-only logging. This phase does NOT build the dashboard UI — that is Phase 2.

The three agent scripts (`scripts/plan-agent.sh`, `scripts/implement-agent.sh`, `scripts/test-agent.sh`) already exist as functional bash scripts from Phase 0. Phase 1 verifies their correctness and documents their behavior in the TypeScript modules.

## 2. Scope

### In Scope
- `lib/orchestrator.ts` — Phase state machine: advance, retry, reset, gate-check
- `lib/state-store.ts` — Read/write `pipeline/state.json` with atomic writes
- `lib/log-writer.ts` — Append-only log utility with timestamped entries
- Verify `pipeline/state.json` exists and is valid for Phase 1
- Verify existing bash agent scripts are correctly implemented
- TypeScript strict mode throughout

### Out of Scope
- No Next.js dashboard (Phase 2)
- No agent spawning integration (Phase 3)
- No SSE log streaming (Phase 3)
- No cron job setup (Phase 3)

## 3. Deliverables

### New Files to Create

| File | Action | Description |
|------|--------|-------------|
| `lib/orchestrator.ts` | create | Phase state machine class |
| `lib/state-store.ts` | create | State file read/write with atomic writes |
| `lib/log-writer.ts` | create | Append-only log utility |
| `lib/types.ts` | create | Shared TypeScript interfaces (PipelineState, GateResult, Phase) |
| `specs/in-progress/PHASE-1.md` | create | This spec (already created by plan agent) |

### Existing Files to Verify

| File | Action | Verification |
|------|--------|--------------|
| `pipeline/state.json` | verify | Valid JSON, phase 0 complete, phase 1 in-progress |
| `scripts/plan-agent.sh` | verify | Correct Claude Code invocation, correct spec path |
| `scripts/implement-agent.sh` | verify | Correct Claude Code invocation, correct code dir |
| `scripts/test-agent.sh` | verify | Runs lint → type → test, updates state.json gates |

### No Modification Required

- `SPEC.md` — protected
- `rules.md`, `AGENTS.md`, `ARCHON.md`, `CLAUDE.md` — protected
- `scripts/orchestrator.sh` — already functional bash orchestrator (kept as cron entry point)

## 4. Dependencies

### External
- Node.js 20+ (required runtime)
- TypeScript (`tsc` via `npx tsc`, no separate install needed)
- Claude Code CLI (`claude` or `claude-code` in PATH) — required by agent scripts

### Internal
- `pipeline/state.json` — state persistence (created in Phase 0)
- `specs/templates/PHASE-TEMPLATE.md` — phase spec template
- `SPEC.md` — master spec (read-only reference)

### No New npm Packages
No external npm packages are introduced in Phase 1. All dependencies are:
- Node.js built-ins (`fs`, `path`, `crypto`)
- TypeScript (dev dependency, already in standard Next.js toolchain)

## 5. Implementation Order

### Step 1: `lib/types.ts` — Shared Interfaces
Define all TypeScript interfaces used across the pipeline:
```typescript
interface PipelineState
interface Phase
interface GateResult
type PhaseStatus = 'pending' | 'in-progress' | 'complete' | 'blocked'
type GateStatus = 'pending' | 'pass' | 'fail' | 'running'
```
This file is imported by both `state-store.ts` and `orchestrator.ts`.

### Step 2: `lib/state-store.ts` — State Persistence
Implement:
- `loadState(): PipelineState` — read and parse `pipeline/state.json`
- `saveState(state: PipelineState): void` — atomic write (write to temp, then rename)
- `updatePhase(phase: number, updates: Partial<Phase>): void`
- `updateGate(phase: number, gate: 'lint' | 'types' | 'tests', result: GateResult): void`
- `advancePhase(): number` — increment `currentPhase`, return new phase number
- `getCurrentPhase(): number`
- `getPhaseStatus(phase: number): PhaseStatus`
- `setPhaseStatus(phase: number, status: PhaseStatus): void`

Error handling: throw if state file is missing, malformed, or write fails.

### Step 3: `lib/log-writer.ts` — Append-Only Logging
Implement:
- `LogWriter` class with constructor: `constructor(logDir: string, agent: string)`
- `info(message: string): void`
- `warn(message: string): void`
- `error(message: string): void`
- `debug(message: string): void` (only if `DEBUG=1` env var set)

Log format: `[ISO8601] [AGENT] [PHASE-N] LEVEL: message`
Log files named: `{agent}-{phase}.log` in `logs/` directory.
Uses `fs.appendFileSync` — append-only, no truncation.
Creates log directory if it does not exist.

### Step 4: `lib/orchestrator.ts` — Phase State Machine
Implement:
- `Orchestrator` class
- Constructor takes `stateStore: StateStore`, `logWriter: LogWriter`
- `advancePhase(): void` — if current phase is complete, advance to next
- `retryPhase(): void` — increment iteration, reset gates to pending
- `resetPipeline(): void` — reset all phases to pending, currentPhase to 0
- `isBlocked(): boolean` — returns true if current phase is blocked
- `areGatesPassing(phase: number): boolean` — checks lint, types, tests all pass
- `checkStalePhase(maxAgeMs: number): void` — marks stale phases as blocked

The orchestrator does NOT spawn agents — that is Phase 3. Phase 1 defines the state machine interface only.

### Step 5: Verify `pipeline/state.json`
Read `pipeline/state.json`. Verify:
- Valid JSON
- `version: "1.0.0"`
- `phases["0"].status === "complete"`
- `phases["1"].status === "in-progress"`
- All 6 phases (0-5) are present
- `gates` structure is correct for each phase

### Step 6: Verify Agent Scripts
Verify each script against the acceptance criteria in §6.

## 6. Acceptance Criteria

### A. `lib/types.ts`
- [ ] Exports `PipelineState`, `Phase`, `GateResult`, `PhaseStatus`, `GateStatus` types
- [ ] All interface fields match the `pipeline/state.json` schema from SPEC.md

### B. `lib/state-store.ts`
- [ ] `loadState()` correctly parses `pipeline/state.json`
- [ ] `saveState()` uses atomic write (temp file + rename)
- [ ] `updatePhase()` correctly patches phase fields
- [ ] `updateGate()` correctly patches gate results
- [ ] `advancePhase()` correctly increments `currentPhase` and returns it
- [ ] Throws error if state file is missing or malformed
- [ ] TypeScript strict mode: no `any` types

### C. `lib/log-writer.ts`
- [ ] Constructor creates `logs/` directory if absent
- [ ] `info/warn/error/debug` all append to `logs/{agent}-{phase}.log`
- [ ] Log format: `[ISO8601] [AGENT] [PHASE-N] LEVEL: message`
- [ ] `debug()` is a no-op unless `DEBUG=1` env var is set
- [ ] Append-only: uses `fs.appendFileSync`, never truncates
- [ ] TypeScript strict mode: no `any` types

### D. `lib/orchestrator.ts`
- [ ] `advancePhase()` only advances if current phase status is `complete`
- [ ] `retryPhase()` increments `iteration` and resets all gates to `pending`
- [ ] `resetPipeline()` sets all phases to `pending`, `currentPhase` to 0
- [ ] `areGatesPassing()` returns true only when all three gates are `pass`
- [ ] `checkStalePhase(5 * 60 * 60 * 1000)` marks phases stale > 5h as `blocked`
- [ ] All state changes go through `stateStore` — no direct file I/O
- [ ] TypeScript strict mode: no `any` types

### E. `pipeline/state.json` Verification
- [ ] File exists at correct path
- [ ] Valid JSON
- [ ] `version === "1.0.0"`
- [ ] `currentPhase === 1`
- [ ] Phase 0: `status === "complete"`, all gates `pass`
- [ ] Phase 1: `status === "in-progress"`, all gates `pending`
- [ ] Phases 2-5: `status === "pending"`, all gates `pending`

### F. Agent Scripts Verification
- [ ] `scripts/plan-agent.sh`: Uses Claude Code CLI, outputs to `specs/in-progress/PHASE-{N}.md`
- [ ] `scripts/implement-agent.sh`: Uses Claude Code CLI, outputs to `pipeline/phase-{N}/code/`
- [ ] `scripts/test-agent.sh`: Runs lint → type → test in order, updates gate statuses in `state.json`
- [ ] All three scripts have `set -euo pipefail`
- [ ] All three scripts log with timestamped format matching `LogWriter` format

## 7. Quality Gates

| Gate | Tool | Threshold |
|------|------|----------|
| Lint | `npx tsc --noEmit` (lib/ only) | 0 errors |
| Types | `npx tsc --noEmit --strict` | 0 errors |
| Tests | Node.js unit tests via Vitest (or manual verification) | 100% pass |

Run quality gates:
```bash
cd /home/lich/test/dark-factory-app
npx tsc --noEmit lib/types.ts lib/state-store.ts lib/log-writer.ts lib/orchestrator.ts
```
If the project has Vitest: `npm test` from project root.

## 8. File Structure After Phase 1

```
dark-factory-app/
├── lib/
│   ├── types.ts          # NEW: Shared TypeScript interfaces
│   ├── state-store.ts    # NEW: State read/write
│   ├── log-writer.ts     # NEW: Append-only log utility
│   └── orchestrator.ts   # NEW: Phase state machine
├── logs/                 # (empty until agents run)
├── pipeline/
│   └── state.json        # (verified — already exists)
├── scripts/
│   ├── plan-agent.sh     # (verified — already exists)
│   ├── implement-agent.sh # (verified — already exists)
│   └── test-agent.sh     # (verified — already exists)
└── specs/
    └── in-progress/
        └── PHASE-1.md   # This spec
```

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Atomic write failure (rename fails) | low | high | Fall back to direct write, log warning |
| Claude Code CLI not in PATH | medium | high | Scripts already check and exit 1 with install instructions |
| state.json gets corrupted during write | low | high | Keep backup as `state.json.bak` before write |
| Phase 0 state not properly initialized | low | medium | Verify state.json as explicit step; if wrong, fix in place |
| TypeScript strict mode reveals implicit any | medium | low | Fix types incrementally; use `unknown` where appropriate |

## 10. Notes

- Phase 0 created stub bash scripts. They are functional but the TypeScript modules in `lib/` provide the canonical programmatic API for future phases.
- The bash `scripts/orchestrator.sh` remains the cron entry point. It calls the TypeScript orchestrator indirectly through agent scripts.
- `pipeline/state.json` was created by Phase 0. Its structure must match the `PipelineState` interface exactly — any mismatch is a Phase 0 bug to fix before Phase 1 closes.
- No agent spawning in Phase 1. Agent spawning (connecting `orchestrator.ts` to the bash scripts) is Phase 3.
- Log files are per-agent and per-phase: `logs/plan-1.log`, `logs/implement-1.log`, `logs/test-1.log`.
