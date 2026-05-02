# Dark Factory — Rules of Operation

> Zero human touch in the implementation loop. AI writes, AI tests, AI validates.

---

## Core Philosophy

- **Autonomy first**: The machine runs. Humans define *what* and *why*, never *how*.
- **Spec is law**: Implementation begins only from a approved SPEC.md. No ad-hoc changes.
- **Phase gates**: Each phase must pass its quality gates before the next begins.
- **Full traceability**: Every action, decision, and result is logged.
- **Idempotent phases**: Re-running a phase produces the same outcome.

---

## Project Structure

```
dark-factory-app/
├── SPEC.md              ← Master specification (single source of truth)
├── rules.md              ← This file
├── specs/
│   ├── templates/        ← Phase spec template (copy to start)
│   ├── in-progress/      ← Active phase specs live here
│   └── completed/         ← Archived phase specs after completion
├── scripts/
│   ├── orchestrator.sh   ← Main pipeline runner (checks, dispatches, logs)
│   ├── plan-agent.sh      ← Subagent: creates phase SPEC.md
│   ├── implement-agent.sh  ← Subagent: implements code from phase SPEC.md
│   ├── test-agent.sh      ← Subagent: tests, lints, type-checks, validates
│   └── audit.sh           ← Final audit: coverage, security, deps
├── pipeline/              ← Generated artifacts per phase
│   └── phase-N/
│       ├── SPEC.md
│       ├── code/          ← Generated implementation
│       ├── tests/         ← Generated tests
│       ├── lint-report.txt
│       ├── type-report.txt
│       └── test-report.txt
└── logs/
    ├── orchestrator.log  ← Timestamped by run
    ├── plan.log
    ├── implement.log
    └── test.log
```

---

## The Pipeline (6-Phase Model)

Each phase is a discrete, verifiable unit of work.

### Phase 0 — Init
- Create repo structure
- Write SPEC.md with full project vision, goals, and constraints
- Verify directory structure matches spec

### Phase 1 — Plan
- Read SPEC.md
- Spawn **plan-agent** subagent
- Plan-agent writes `specs/in-progress/PHASE-1.md` with:
  - Goals, scope, deliverables
  - File list (new + modified)
  - Dependencies
  - Risks and mitigations
  - Acceptance criteria
- Plan reviewed (auto-reviewed by implement-agent for feasibility)
- On rejection: plan-agent iterates until accepted

### Phase 2 — Implement
- Spawn **implement-agent** subagent
- Reads `specs/in-progress/PHASE-1.md`
- Generates code in `pipeline/phase-1/code/`
- Uses branch `phase-1/` for all changes
- No human review step — AI validates AI

### Phase 3 — Test
- Spawn **test-agent** subagent
- Reads implementation from `pipeline/phase-1/code/`
- Generates tests in `pipeline/phase-1/tests/`
- Runs: unit tests, integration tests (if applicable)
- Runs: linter (ESLint/ruff), type checker (TypeScript/mypy)
- Generates reports: `lint-report.txt`, `type-report.txt`, `test-report.txt`

### Phase 4 — Validate
- All quality gates must be GREEN:
  - Lint: 0 errors
  - Type check: 0 errors
  - Tests: 100% pass
- If any gate fails: implement-agent fixes and test-agent re-runs
- Max 3 fix iterations per phase before escalation (mark as blocked)

### Phase 5 — Finalize
- Move spec to `specs/completed/`
- Tag phase as complete in orchestrator state
- If last phase: merge to main, tag release
- If more phases: trigger next phase

---

## Agent Specifications

### Plan Agent
- Role: `orchestrator`
- Inputs: `SPEC.md`, previous phases' completed specs
- Output: `specs/in-progress/PHASE-N.md`
- Tools: `terminal`, `file`, `delegation`
- Constraints:
  - Must produce concrete, implementable spec (no vague goals)
  - Must list exact files to create/modify
  - Must define clear acceptance criteria
  - Must complete within 10 tool calls (use delegation for sub-tasks)

### Implement Agent
- Role: `leaf`
- Inputs: `specs/in-progress/PHASE-N.md`
- Output: Code in `pipeline/phase-N/code/`
- Tools: `terminal`, `file`, `delegation`
- Constraints:
  - Use `claude` or `claude-code` for code generation
  - Each file must compile/run without errors (dry-run check)
  - No placeholder code (// TODO, // FIXME must be explicit or absent)
  - Match existing code style of the project
  - Write docstrings for all public APIs

### Test Agent
- Role: `leaf`
- Inputs: `pipeline/phase-N/code/`
- Output: Tests in `pipeline/phase-N/tests/`, reports
- Tools: `terminal`, `file`, `browser` (if applicable)
- Constraints:
  - Minimum 80% code coverage for new code
  - All tests must be deterministic (no flaky tests)
  - Lint/type pass before tests run (enforce this order)
  - Must generate human-readable test report

---

## Quality Gates (per phase)

| Gate | Tool | Threshold |
|------|------|-----------|
| Lint | ESLint / ruff | 0 errors, 0 warnings (configurable) |
| Types | TypeScript / mypy | 0 errors |
| Tests | Vitest / pytest | 100% pass, 80% coverage |
| Security | no secrets in code, deps audited | pass |
| Formatting | Prettier / black | auto-fixed if possible |

If gate fails → return to Implement with specific error report.
After 3 failures → mark phase as `blocked` and notify (log + cron alert).

---

## Cron Job Specification

- Schedule: Every 4 hours (`0 */4 * * *`)
- Name: `dark-factory-phase-runner`
- Prompt: Read current phase state → check if phase is complete → if complete, trigger next phase → if blocked, log and wait → if in-progress, check for stale work (5h timeout = mark stalled)
- Skills: `autonomous-ai-agents`, `subagent-driven-development`
- Deliver: `local` (save to log, no duplicate notifications)

**Cron never modifies specs** — only executes what specs define.

---

## Git Workflow

- Every phase works on a dedicated branch: `phase-N/`
- Branch is created at start of implement phase
- Commits are made incrementally (per logical unit)
- On phase complete: PR opened (if GitHub integration) or branch merged to main
- Main branch is protected: only phase PRs can merge

---

## Logging

All log files are append-only. Format per entry:
```
[TIMESTAMP] [AGENT] [PHASE-N] LEVEL: message
```

- `INFO`: Normal operation events
- `WARN`: Recoverable issues (will retry)
- `ERROR`: Non-recoverable, requires human attention (but humans don't intervene — logged for audit)
- `DEBUG`: Verbose detail (only in DEBUG mode)

---

## Secrets Management

- API keys live in environment variables, never in code
- `.env.example` documents required env vars
- `.gitignore` excludes `.env`, `.env.local`, `secrets.env`
- No hardcoded credentials — always via `$VARIABLE_NAME`

---

## What Triggers a New Phase

1. Cron job fires (every 4h)
2. Orchestrator checks `pipeline/state.json` for current phase
3. If current phase is `complete` → increment and start next
4. If current phase is `in-progress` but stale (no activity > 5h) → retry or mark blocked
5. If current phase is `blocked` → log, notify, wait for manual spec update

---

## Acceptance Criteria for Dark Factory App Itself

Since this is the Dark Factory app (the meta-level tool that runs Dark Factory):

1. It must be fully autonomous — no human to implement or test
2. It must follow its own rules — a violation of rules.md by the system is a bug
3. It must document its own state — `pipeline/state.json` always reflects reality
4. It must be self-improving — post-phase retrospectives go into `SPEC.md` as improvements
5. It must never skip quality gates — not even for "just one small thing"

---

## Version

- Version: 1.0.0
- Last updated: 2026-05-01
- Based on: Forge (ibuzzardo/forge), Dark Factory (HWallaballa/dark-factory), FSPEC (sengac/fspec)
