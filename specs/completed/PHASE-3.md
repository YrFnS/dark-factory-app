# Phase 3 — Agent Integration

> Metadata
> - Phase: 3
> - Status: in-progress
> - Parent: SPEC.md §7
> - Orchestrator: dispatched 2026-05-01

## 1. Goals

Phase 3 connects the dashboard to real agent execution. By the end of Phase 3:

- `agent-spawner.ts` spawns Claude Code subagents (plan/implement/test) as child processes
- Orchestrator coordinates multi-agent workflows
- Live log streaming from real agent processes to dashboard
- Quality gate execution (lint/type/test runners) triggered by orchestrator
- Dashboard reflects real-time agent activity

Phase 3 does NOT include real cron scheduling — that is Phase 4.

---

## 2. Implementation Order & Dependencies

```
[Agent Core]      agent-spawner.ts                          (Task 1)
                  agent-log-stream.ts                        (Task 2)

[Orchestrator]    Phase advancement with agent dispatch      (Task 3)
                  Gate execution runner                       (Task 4)

[Dashboard]      Real-time agent activity feed              (Task 5)
                  Live gate status updates                   (Task 6)

[Integration]     End-to-end agent run                      (Task 7)
                  Final acceptance                           (Task 8)
```

---

## 3. Task Details

---

### Task 1: agent-spawner.ts

**Files:**
- `lib/agent-spawner.ts` (create)

**What:**
Implement `agent-spawner.ts` that spawns Claude Code CLI as a child process for plan, implement, and test agents. Each agent gets a unique worktree directory (`pipeline/phase-N/work/plan/`, `pipeline/phase-N/work/implement/`, etc.). The spawner streams stdout/stderr to the orchestrator log and returns exit codes.

**Acceptance criteria:**
- [ ] `spawnAgent(type: 'plan' | 'implement' | 'test', phase: number, task: string): Promise<AgentResult>`
- [ ] AgentResult has: exitCode, stdout, stderr, duration
- [ ] Each agent runs in isolated directory
- [ ] stdout/stderr are streamed to log file in real-time
- [ ] Agent times out after configurable duration (default: 10 minutes)
- [ ] Node.js path is prefixed correctly for all spawned processes
- [ ] tsc --noEmit passes

**Risks:**
- Claude Code CLI must be available at `~/.local/bin/claude` or `/usr/local/bin/claude`
- Node.js path must be set correctly in spawned processes

---

### Task 2: agent-log-stream.ts

**Files:**
- `lib/agent-log-stream.ts` (create)

**What:**
Implement log streaming from agent child processes to the SSE endpoint. Each agent writes logs to `logs/{agent}.log`. The stream multiplexes from multiple agent log files into the single SSE stream.

**Acceptance criteria:**
- [ ] `AgentLogStream` class manages multiple file watchers
- [ ] Multiplexes logs from `logs/plan.log`, `logs/implement.log`, `logs/test.log`
- [ ] Parses log lines into LogEntry format
- [ ] Provides `addListener(callback)` interface for SSE route
- [ ] Handles agent log file creation/deletion gracefully
- [ ] tsc --noEmit passes

---

### Task 3: Orchestrator Agent Dispatch

**Files:**
- `lib/orchestrator.ts` (update)

**What:**
Update `lib/orchestrator.ts` to dispatch agents when advancing phases. When a phase transitions to `in-progress`, the orchestrator spawns a plan agent. When plan completes, it spawns implement agents for each task. When implement completes, it spawns test agent. Gate results are captured and written to state.json.

**Acceptance criteria:**
- [ ] Phase transition to `in-progress` triggers plan-agent dispatch
- [ ] Plan-agent output is written to `logs/plan.log`
- [ ] Implement-agent dispatched after plan succeeds (for each task)
- [ ] Test-agent dispatched after implement succeeds
- [ ] Gate results (lint output, type errors, test results) captured from agent output
- [ ] State transitions are atomic (phase stays `in-progress` until all agents complete)
- [ ] Error in any agent marks phase as `blocked` with error message
- [ ] tsc --noEmit passes

---

### Task 4: Gate Execution Runner

**Files:**
- `lib/gate-runner.ts` (create)

**What:**
Implement `gate-runner.ts` that executes quality gates (lint, types, tests) programmatically and returns structured results. Each gate runs in the phase's work directory.

**Acceptance criteria:**
- [ ] `runLint(dir: string): Promise<GateResult>` — runs ESLint or equivalent
- [ ] `runTypes(dir: string): Promise<GateResult>` — runs tsc --noEmit
- [ ] `runTests(dir: string): Promise<GateResult>` — runs vitest
- [ ] Each function captures: exitCode, stdout, stderr, duration, errorCount
- [ ] GateResult.status is 'pass' if exitCode 0, 'fail' otherwise
- [ ] Error count parsed from output where available
- [ ] tsc --noEmit passes

**Risks:**
- ESLint may need configuration for Next.js projects

---

### Task 5: Real-time Agent Activity Feed

**Files:**
- `components/AgentActivityFeed/index.tsx` (create)
- `components/AgentActivityFeed/AgentActivityFeed.tsx` (create)

**What:**
Implement `AgentActivityFeed` component that displays real-time agent activity. Shows which agent is currently running, its progress, stdout snippets, and completion status.

**Acceptance criteria:**
- [ ] Shows active agent: type, phase, status, start time
- [ ] Shows stdout output in real-time (scraped from agent log stream)
- [ ] Shows completion: exit code, duration, success/failure
- [ ] Auto-scrolls to latest output
- [ ] Color-coded: running=blue, success=green, failure=red
- [ ] tsc --noEmit passes

---

### Task 6: Live Gate Status Updates

**Files:**
- `components/QualityGates/QualityGates.tsx` (update)

**What:**
Update QualityGates component to reflect real gate execution status. When an agent is running, gates show 'running' state. When complete, show 'pass' or 'fail' based on gate-runner results.

**Acceptance criteria:**
- [ ] Gate badges update to 'running' when corresponding gate starts
- [ ] Gate badges update to 'pass'/'fail' when gate completes
- [ ] Error count displayed on 'fail' badges
- [ ] Last run timestamp updated after each run
- [ ] tsc --noEmit passes

---

### Task 7: End-to-End Agent Run

**Files:**
- All above files (integration)

**What:**
Run a complete agent cycle for Phase 3:
1. Trigger plan-agent for Phase 3
2. Plan-agent writes detailed Phase 3 spec
3. Implement agents build agent-spawner, agent-log-stream, gate-runner
4. Test agent runs gate execution
5. Dashboard reflects all activity in real-time

**Acceptance criteria:**
- [ ] Dashboard shows plan-agent running
- [ ] Dashboard shows implement agents running sequentially
- [ ] Dashboard shows test agent running
- [ ] Dashboard shows all 3 gates pass/fail in real-time
- [ ] Phase 3 marked complete when all gates pass

---

### Task 8: Final Acceptance Testing

**Files:**
- `pipeline/phase-3/tests/` (create)

**What:**
Create integration tests for the agent pipeline and update phase acceptance.

**Acceptance criteria:**
- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] `npm run dev` starts without errors
- [ ] `GET /api/state` returns valid PipelineState
- [ ] Agent spawner successfully spawns a test agent and captures output
- [ ] Gate runner executes lint/types/tests and returns results
- [ ] Dashboard SSE endpoint streams logs in real-time
- [ ] All Phase 3 quality gates pass
- [ ] Phase 3 marked complete in state.json

---

## 4. Dependencies Summary

| Task | Depends On |
|------|-----------|
| 1 (agent-spawner) | None (Phase 1 lib files) |
| 2 (agent-log-stream) | Task 1 |
| 3 (orchestrator update) | Task 1, Task 2 |
| 4 (gate-runner) | None |
| 5 (AgentActivityFeed) | Task 2, Task 3 |
| 6 (QualityGates update) | Task 4 |
| 7 (E2E run) | Tasks 1-6 |
| 8 (final acceptance) | Task 7 |

---

## 5. File Manifest

```
lib/
  agent-spawner.ts                    [Task 1]
  agent-log-stream.ts                 [Task 2]
  gate-runner.ts                      [Task 4]
  orchestrator.ts                     [Task 3 - update]
components/
  AgentActivityFeed/
    index.tsx                         [Task 5]
    AgentActivityFeed.tsx             [Task 5]
    styles.css                        [Task 5]
  QualityGates/
    QualityGates.tsx                  [Task 6 - update]
pipeline/
  phase-3/
    code/                             [Tasks 1-6]
    tests/                            [Task 8]
```

---

## 6. Acceptance Criteria — Phase 3 Completion

All of the following must be true to consider Phase 3 complete:

- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] `npm run dev` starts without errors
- [ ] `GET /api/state` returns valid `PipelineState` JSON
- [ ] `spawnAgent()` successfully spawns Claude Code and captures output
- [ ] `AgentLogStream` multiplexes logs from multiple agents
- [ ] `gate-runner` executes lint/types/tests and returns structured results
- [ ] Orchestrator dispatches agents on phase advancement
- [ ] Dashboard SSE streams real-time agent logs
- [ ] `AgentActivityFeed` shows real-time agent activity
- [ ] `QualityGates` reflects live gate execution status
- [ ] Phase 3 quality gates (lint, types, tests) all pass

---

## 7. Out of Scope (Phase 4)

- Cron job setup and scheduling
- Real-time cron triggers
- Production hardening
- Error recovery and retry logic
- Override safety enhancements
