# Phase 4 — Polish & Hardening

> Metadata
> - Phase: 4
> - Status: in-progress
> - Parent: SPEC.md §7
> - Orchestrator: dispatched 2026-05-01

## 1. Goals

Phase 4 polishes the Dark Factory App for production readiness:

- Robust error handling and edge case coverage
- Timeout and retry logic for all agent operations
- Override safety checks (confirmation dialogs, destructive action protection)
- UI polish (animation consistency, responsive layout refinement)
- PID lock enforcement for orchestrator singleton
- Cron job setup and scheduler integration

Phase 4 does NOT include production deployment or external hosting.

---

## 2. Implementation Order

```
[Error Handling]    orchestrator error boundaries          (Task 1)
                    agent-spawner timeout/retry             (Task 2)

[Safety]           PID lock enforcement                    (Task 3)
                    Override confirmation flows            (Task 4)

[Polish]           UI animation refinement                 (Task 5)
                    Responsive layout fix                  (Task 6)

[Scheduler]        Cron job setup script                   (Task 7)
                    Schedule validation                    (Task 8)

[Integration]       End-to-end error scenario test         (Task 9)
                    Final acceptance                       (Task 10)
```

---

## 3. Task Details

---

### Task 1: Orchestrator Error Boundaries

**Files:**
- `lib/orchestrator.ts` (update)

**What:**
Add try/catch around all agent dispatch calls and phase transitions. Ensure no unhandled promise rejection can crash the orchestrator. Log all errors with full stack traces.

**Acceptance criteria:**
- [ ] All `spawnAgent` calls wrapped in try/catch
- [ ] Phase transitions atomic even on error
- [ ] Errors written to `logs/orchestrator.log` with stack trace
- [ ] tsc --noEmit passes

---

### Task 2: Agent Spawner Timeout & Retry

**Files:**
- `lib/agent-spawner.ts` (update)

**What:**
Add configurable retry logic to spawnAgent. On exit code ≠ 0, optionally retry N times with exponential backoff.

**Acceptance criteria:**
- [ ] `spawnAgent` accepts `{ retries?: number; retryDelayMs?: number }` options
- [ ] Default: 0 retries (backward compatible)
- [ ] On retry: log retry attempt, delay, then re-spawn
- [ ] Max retries capped at 3
- [ ] tsc --noEmit passes

---

### Task 3: PID Lock Enforcement

**Files:**
- `scripts/plan-agent.sh` (update)
- `scripts/implement-agent.sh` (update)
- `scripts/test-agent.sh` (update)
- `scripts/orchestrator.sh` (update, or create if missing)

**What:**
Add PID lock file (`pipeline/.lock`) to ensure only one orchestrator instance runs. Exit 0 if already running.

**Acceptance criteria:**
- [ ] PID file at `pipeline/.lock`
- [ ] Check `kill -0 $(cat $PID_FILE)` before starting
- [ ] Remove PID file on exit (trap)
- [ ] Scripts are executable

---

### Task 4: Override Confirmation Flows

**Files:**
- `components/OverridePanel/OverridePanel.tsx` (update)

**What:**
All destructive overrides ("Reset Pipeline", "Retry Phase") require explicit confirmation. Non-destructive ("Advance Phase") use optimistic UI with rollback on failure.

**Acceptance criteria:**
- [ ] "Reset Pipeline" requires typing "CONFIRM" in a dialog
- [ ] "Retry Phase" requires button hold (1s) or double-click
- [ ] All override actions logged
- [ ] tsc --noEmit passes

---

### Task 5: UI Animation Refinement

**Files:**
- `components/PhaseTimeline/PhaseTimeline.tsx` (update)
- `components/GateBadge/GateBadge.tsx` (update)
- `app/globals.css` (update)

**What:**
Ensure consistent animation durations (200ms for status transitions, 150ms for log entries). Add `prefers-reduced-motion` support.

**Acceptance criteria:**
- [ ] All color transitions use `transition: 200ms ease`
- [ ] Reduced motion: `transition: 0ms` when `prefers-reduced-motion: reduce`
- [ ] Log entries slide in with `150ms` animation
- [ ] tsc --noEmit passes

---

### Task 6: Responsive Layout Fix

**Files:**
- `app/page.tsx` (update)
- `components/PhaseTimeline/PhaseTimeline.tsx` (update)

**What:**
Fix tablet layout (pipeline and phase detail should stack vertically). Mobile view should show simplified status only.

**Acceptance criteria:**
- [ ] Tablet: single column, pipeline above phase detail
- [ ] Mobile (< 640px): phase number + status badge only
- [ ] No horizontal overflow on any viewport
- [ ] tsc --noEmit passes

---

### Task 7: Cron Job Setup Script

**Files:**
- `scripts/setup-cron.sh` (create)

**What:**
Create a shell script that installs the orchestrator cron job. Uses `crontab -e` or creates a user crontab entry.

**Acceptance criteria:**
- [ ] Script is idempotent (running twice doesn't duplicate)
- [ ] Cron schedule: `0 */4 * * *` (every 4h on the hour)
- [ ] Cron job calls `scripts/orchestrator.sh` (or equivalent)
- [ ] Script checks for existing job before adding
- [ ] Outputs next scheduled run time

---

### Task 8: Schedule Validation

**Files:**
- `lib/orchestrator.ts` (update)

**What:**
Validate that cron schedule in state.json matches actual cron job. If mismatch, warn in logs.

**Acceptance criteria:**
- [ ] Orchestrator reads `nextCronRun` from state.json on startup
- [ ] If `nextCronRun` is stale (> 5h overdue), log a warning
- [ ] If system time is significantly off (NTP check), warn
- [ ] tsc --noEmit passes

---

### Task 9: End-to-End Error Scenario Test

**Files:**
- `pipeline/phase-4/tests/error-handling.test.ts` (create)

**What:**
Write tests that simulate error conditions: agent timeout, invalid state transition, PID lock collision.

**Acceptance criteria:**
- [ ] Test agent timeout triggers retry logic
- [ ] Test invalid phase transition is rejected
- [ ] Test PID lock prevents double orchestrator
- [ ] All tests pass

---

### Task 10: Final Acceptance Testing

**Files:**
- `pipeline/phase-4/tests/acceptance.test.ts` (create)

**What:**
Run the full acceptance criteria for Phase 4.

**Acceptance criteria:**
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] All quality gates pass
- [ ] Phase 4 marked complete in state.json

---

## 4. Dependencies Summary

| Task | Depends On |
|------|-----------|
| 1 (orchestrator errors) | Phase 3 orchestrator.ts |
| 2 (spawner retry) | Phase 3 agent-spawner.ts |
| 3 (PID lock) | None |
| 4 (override confirm) | Phase 2 OverridePanel |
| 5 (UI animation) | Phase 2 components |
| 6 (responsive) | Phase 2 page layout |
| 7 (cron script) | None |
| 8 (schedule validation) | Task 7 |
| 9 (E2E error tests) | Tasks 1, 2, 3 |
| 10 (final acceptance) | Tasks 1-9 |

---

## 5. File Manifest

```
lib/
  orchestrator.ts                    [Task 1 - update]
  agent-spawner.ts                   [Task 2 - update]
scripts/
  plan-agent.sh                      [Task 3 - update]
  implement-agent.sh                 [Task 3 - update]
  test-agent.sh                      [Task 3 - update]
  orchestrator.sh                    [Task 3 - create/update]
  setup-cron.sh                      [Task 7]
components/
  OverridePanel/
    OverridePanel.tsx                [Task 4 - update]
  PhaseTimeline/
    PhaseTimeline.tsx                [Task 6 - update]
  GateBadge/
    GateBadge.tsx                    [Task 5 - update]
app/
  globals.css                        [Task 5 - update]
  page.tsx                           [Task 6 - update]
pipeline/
  phase-4/
    tests/
      error-handling.test.ts          [Task 9]
      acceptance.test.ts              [Task 10]
```

---

## 6. Acceptance Criteria — Phase 4 Completion

All of the following must be true to consider Phase 4 complete:

- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] `npm run dev` starts without errors
- [ ] Orchestrator has no unhandled promise rejections
- [ ] `spawnAgent` retry logic works (timeout → retry → success or max retries)
- [ ] PID lock prevents double orchestrator
- [ ] Override "Reset" requires "CONFIRM" dialog
- [ ] UI animations respect `prefers-reduced-motion`
- [ ] Responsive layout works on tablet and mobile
- [ ] `setup-cron.sh` installs cron job correctly
- [ ] All Phase 4 unit tests pass
- [ ] Phase 4 quality gates (lint, types, tests) all pass

---

## 7. Out of Scope (Phase 5)

- Production deployment
- External hosting / DNS
- SSL certificates
- Performance benchmarking
- Load testing
