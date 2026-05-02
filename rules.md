# Dark Factory — Rules of Operation

> The machine that runs the machine. Zero human touch in the implementation loop.
> AI writes the code. AI tests it. AI validates it. Humans define *what* and *why*, never *how*.

---

## 1. Core Philosophy

### 1.1 Autonomy First
- The factory runs without human intervention. Once a phase spec is written, the execution loop (plan → implement → test → validate) is fully autonomous.
- Humans only touch the spec before a phase starts, never during execution.
- If a human intervenes mid-phase, the phase is invalidated and must restart.

### 1.2 Spec Is Law
- All implementation proceeds from a phase spec. No ad-hoc changes, no "quick fixes" outside the spec.
- A phase spec MUST be concrete and implementable — no vague goals, no ambiguous acceptance criteria.
- If the spec is wrong, fix the spec first. Never bend the implementation to compensate.

### 1.3 Phase Gates Are Absolute
- Each phase must pass all quality gates before the next phase begins.
- Gates are not advisory. A single failing gate blocks advancement.
- Gates run in order: lint → types → tests. A gate must pass before the next runs.

### 1.4 Full Traceability
- Every action, decision, and result is logged with timestamp, agent, and phase.
- Every line of code must be traceable to a spec item.
- Logs are append-only. They are the audit trail.

### 1.5 Idempotent Phases
- Re-running a phase produces the same outcome.
- Phases do not accumulate state — each phase run is clean.
- Retries start from the spec, not from the previous attempt's partial state.

### 1.6 Self-Implication
- The Dark Factory App must follow its own rules.
- A violation of `rules.md` by the system is a bug in the system.
- The factory is allowed to improve `SPEC.md` and `rules.md` only via a formal phase (Phase 5 retrospectives), never ad-hoc.

---

## 2. The 6-Phase Model

```
Phase 0 — Init
Phase 1 — Core Orchestrator        (plan → implement → test → validate)
Phase 2 — Dashboard UI             (plan → implement → test → validate)
Phase 3 — Agent Integration        (plan → implement → test → validate)
Phase 4 — Polish & Hardening      (plan → implement → test → validate)
Phase 5 — Finalize                 (self-audit → merge → tag)
```

Each of phases 1–4 follows the Archon PIV loop:
```
plan-agent → writes SPEC.md in specs/in-progress/PHASE-N.md
implement-agent → reads PHASE-N.md, writes code to pipeline/phase-N/code/
test-agent → reads code, writes tests to pipeline/phase-N/tests/
validate → lint + type + test gates → pass = advance, fail = retry
```

Phase 5 follows:
```
retrospective-agent → reviews all phase outputs, writes self-audit
merge-agent → merges phase branch to main
tag-agent → tags v1.0.0, writes release notes
```

### Phase 0 — Init
- [x] Create project structure
- [x] Write SPEC.md (full project vision, goals, constraints)
- [x] Write rules.md (this file)
- [x] Init git repo
- [x] Create `pipeline/state.json` with phase 0 complete
- [x] Create `specs/templates/PHASE-TEMPLATE.md`

### Phase 1 — Core Orchestrator
- Implement `orchestrator.ts` (phase state machine)
- Implement `state-store.ts` (read/write `pipeline/state.json`)
- Implement `log-writer.ts`
- Implement `scripts/plan-agent.sh`, `implement-agent.sh`, `test-agent.sh`
- Implement `pipeline/state.json` initial state

### Phase 2 — Dashboard UI
- Implement all React components
- Implement Next.js pages and API routes
- Implement SSE log stream endpoint
- Wire up frontend to `pipeline/state.json`

### Phase 3 — Agent Integration
- Implement `agent-spawner.ts`
- Connect agents to orchestrator
- Implement live log streaming to dashboard
- Implement quality gate execution

### Phase 4 — Polish & Hardening
- Error handling and edge cases
- Timeout and retry logic
- Override safety checks
- UI polish

### Phase 5 — Finalize
- Self-audit: does the app pass its own quality gates?
- Documentation review
- Git branch merge to main
- Tag v1.0.0

---

## 3. Agent Specifications

### 3.1 Plan Agent
| Property | Value |
|---|---|
| Role | `orchestrator` |
| Inputs | `SPEC.md`, all completed phase specs |
| Output | `specs/in-progress/PHASE-N.md` |
| Tools | `terminal`, `file`, `delegation` |
| Max iterations | 10 tool calls — delegate sub-tasks |

**Responsibilities:**
- Decompose the phase goal into concrete, implementable tasks
- List exact files to create/modify with line-level scope
- Define clear, testable acceptance criteria for each task
- Identify dependencies (npm packages, system packages, env vars)
- Identify risks and their mitigations
- Flag any task that would require modifying a protected file

**Output format for each task:**
```markdown
### Task N: <name>
- **Files**: `<path>`, `<path>`
- **What**: <concrete description>
- **Acceptance criteria**:
  - [ ] <criterion 1>
  - [ ] <criterion 2>
- **Risks**: <risk or "none">
```

### 3.2 Implement Agent
| Property | Value |
|---|---|
| Role | `leaf` |
| Inputs | `specs/in-progress/PHASE-N.md` |
| Output | Code in `pipeline/phase-N/code/` |
| Tools | `terminal`, `file`, `delegation` |
| Context | Fresh (no carry-over from previous attempts) |

**Responsibilities:**
- Read the phase spec completely before writing any code
- Implement each task exactly as specified
- Match the existing code style of the project (enforced by linter)
- Write docstrings for all public APIs
- No placeholder code (`// TODO`, `// FIXME`, `pass`, `...`)
- Verify each file compiles/runs without errors before marking done
- Commit after each logical unit with a meaningful commit message

**Quality requirements per file:**
- 0 linter errors
- 0 type errors
- All imports resolve
- All tests for this file pass before moving to next file

### 3.3 Test Agent
| Property | Value |
|---|---|
| Role | `leaf` |
| Inputs | `pipeline/phase-N/code/`, acceptance criteria from spec |
| Output | Tests in `pipeline/phase-N/tests/`, reports |
| Tools | `terminal`, `file`, `browser` (if applicable) |
| Context | Fresh + isolated from implement-agent reasoning |

**Responsibilities:**
- Generate tests that cover the acceptance criteria
- Minimum 80% code coverage for new code
- All tests must be deterministic (no flaky tests, no network dependencies)
- Run linter and type checker before running any tests
- Generate three reports: `lint-report.txt`, `type-report.txt`, `test-report.txt`
- Never modify source code to make tests pass — fix the source, not the test

### 3.4 Validate Agent
| Property | Value |
|---|---|
| Role | `bash` |
| Input | Gate reports from test-agent |
| Output | Pass/fail decision + gate report |
| Gate order | lint → types → tests |

**Gate thresholds:**
| Gate | Tool | Threshold |
|---|---|---|
| Lint | ESLint | 0 errors |
| Types | TypeScript (`tsc --noEmit`) | 0 errors |
| Tests | Vitest | 100% pass, 80% coverage |
| Formatting | Prettier | 0 unformatted files |
| Secrets | `detect-secrets` or equivalent | 0 findings |

If any gate fails → return to implement-agent with the specific error report.
After 3 consecutive failures on the same gate → mark phase as `blocked`.

---

## 4. The Holdout Principle (Test-Agent Constraint)

This is the most important safety property in the factory.

**The test-agent MUST NOT read:**
- The implement-agent's scratch notes, plans, or reasoning traces
- The phase spec's internal planning notes (only acceptance criteria)
- Prior comments from the implement-agent
- Commit messages beyond their plain title

**The test-agent MAY read:**
- The phase spec's acceptance criteria (what "done" means)
- The implementation code in `pipeline/phase-N/code/`
- lint/type/test output from gate checks

This ensures the test-agent validates outcomes against the spec, not against the implement-agent's self-assessment.

---

## 5. Protected Files (Auto-Reject)

Any phase that touches these files is immediately rejected and marked `blocked`. The factory cannot modify the constitution.

### Governance
- `SPEC.md`
- `rules.md`
- `AGENTS.md`
- `ARCHON.md`
- `CLAUDE.md`

### Infrastructure and Deployment
- `.archon/config.yaml`
- Any file under `deploy/`, `infra/`, or equivalent top-level deploy directories

### Git Configuration
- `.github/**` (workflows, issue templates, PR templates)
- `.gitignore`, `.gitattributes`

### Dependency Management
- `package.json` (for dependency changes — requires explicit justification in spec)
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `requirements.txt`, `Pipfile`, `poetry.lock`

### State and Lock Files
- `pipeline/state.json` (written by orchestrator only)
- Any `.lock` file

### Environment
- `.env`, `.env.local`, `.env.example` (patterns only — `.env.example` documents required vars)

If the factory needs to touch a protected file to complete a phase, that phase is escalated to `blocked` and the spec must be revised before proceeding.

---

## 6. Escalation Rules

The factory stops trying and escalates when:
- A phase gate fails **3 consecutive times** on the same iteration
- The implement-agent or test-agent exits with a non-zero code and no actionable error
- The test-agent finds a fundamental mismatch between the spec and implementation that requires spec revision

**Escalation**: mark phase as `blocked` in `pipeline/state.json`, log the reason, and halt factory activity on that phase until the spec is revised.

### Auto-Reject Triggers (no fix attempt, immediate rejection)
- Any modification to a protected file
- Security findings: hardcoded secrets, injection vulnerabilities, auth bypass attempts
- Implementation that has no causal relationship to the phase spec
- Test code modified to make tests pass (never modify tests — fix the source)
- Circular dependencies introduced by the implementation

---

## 7. Quality Standards for AI-Generated Code

### 7.1 Code Quality
- No `// TODO`, `// FIXME`, `// HACK`, `// XXX` comments
- No placeholder implementations (`pass`, `...`, `return None` in production code)
- No commented-out blocks of code
- No dead code (unused functions, variables, imports)
- All public APIs must have docstrings (JSDoc for JS/TS, docstrings for Python)
- Max function length: 50 lines (refactor longer functions)
- Max cyclomatic complexity: 10 (enforced by linter rule)

### 7.2 Type Safety
- TypeScript: strict mode enabled, no `any` type, no non-null assertions without justification
- Python: `mypy` strict mode, no `type: ignore` without justification
- All external API responses must have typed interfaces

### 7.3 Security
- No hardcoded secrets, API keys, or credentials
- All secrets loaded from environment variables only
- Input validation on all external inputs
- SQL/command injection prevention (parameterized queries, shell-safe escaping)
- No `eval()`, no `exec()`, no `new Function()` with dynamic content
- Dependency audit: `npm audit` / `pip audit` must pass with 0 high/critical vulnerabilities

### 7.4 Testing Standards
- Tests are first-class artifacts — same review bar as production code
- Each test must have a meaningful name describing the scenario it covers
- Test names follow: `<subject>_<action>_<expected_outcome>`
- Happy path + at least 2 edge cases per feature
- No test should depend on execution order
- No test should share mutable state with another test
- Mock external dependencies (network, filesystem, time)
- Coverage thresholds enforced in CI: 80% line, 70% branch

### 7.5 Git Commit Standards
- One logical unit per commit
- Commit message format:
  ```
  <type>(<scope>): <short description>

  <optional body with details>

  <optional footer with ticket/issue ref>
  ```
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- Commits must pass pre-commit hooks before being considered complete

---

## 8. Project Structure

```
dark-factory-app/
├── SPEC.md                     ← Master specification (source of truth)
├── rules.md                    ← This file (the constitution)
├── ARCHON.md                   ← Workflow definitions
├── CLAUDE.md                   ← Claude Code integration hints
├── AGENTS.md                   ← Agent prompts and constraints
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .eslintrc.js
├── .prettierrc
├── specs/
│   ├── templates/
│   │   └── PHASE-TEMPLATE.md    ← Phase spec template
│   ├── in-progress/            ← Active phase specs
│   └── completed/              ← Archived phase specs
├── scripts/
│   ├── plan-agent.sh           ← Spawns plan-agent subagent
│   ├── implement-agent.sh      ← Spawns implement-agent subagent
│   ├── test-agent.sh           ← Spawns test-agent subagent
│   └── audit.sh                ← Phase 5 final audit
├── pipeline/
│   └── phase-N/
│       ├── SPEC.md             ← Phase spec (copy from specs/in-progress/)
│       ├── code/               ← Generated implementation
│       ├── tests/              ← Generated tests
│       ├── lint-report.txt
│       ├── type-report.txt
│       └── test-report.txt
└── logs/
    ├── orchestrator.log
    ├── plan.log
    ├── implement.log
    └── test.log
```

---

## 9. Logging Specification

All log files are append-only. Format per entry:
```
[YYYY-MM-DD HH:MM:SS] [AGENT] [PHASE-N] LEVEL: message
```

| Level | Meaning |
|---|---|
| `INFO` | Normal operation events (phase started, gate passed, etc.) |
| `WARN` | Recoverable issues (retry will be attempted automatically) |
| `ERROR` | Non-recoverable issues (escalation required) |
| `DEBUG` | Verbose detail (only when `DEBUG=1` env var is set) |

The orchestrator maintains a PID lock file at `pipeline/.lock` to ensure only one instance runs at a time.

---

## 10. Cron Job Specification

- **Schedule**: Every 4 hours (`0 */4 * * *`)
- **Name**: `dark-factory-phase-runner`
- **Behavior**:
  1. Read `pipeline/state.json` to find current phase
  2. If current phase is `complete` → advance to next phase
  3. If current phase is `in-progress` and not stale (< 5h since last activity) → continue
  4. If current phase is `in-progress` and stale (no activity > 5h) → retry or mark blocked
  5. If current phase is `blocked` → log and wait
- **Skills attached**: `autonomous-ai-agents`, `subagent-driven-development`
- **Delivery**: `local` (save to log, no duplicate notifications)
- **Cron NEVER modifies specs** — only executes what specs define

---

## 11. Secrets Management

- API keys and credentials live in environment variables only, never in code
- `.env.example` documents all required environment variables (no real values)
- `.gitignore` excludes `.env`, `.env.local`, `secrets.env`
- All secret access is logged (read-only, no write of secrets to logs)
- Secrets are injected at runtime via the orchestrator's environment

---

## 12. Acceptance Criteria for Dark Factory App Itself

Since this tool IS the Dark Factory:

1. It must be fully autonomous — no human to implement or test
2. It must follow its own rules — a violation of `rules.md` by the system is a bug
3. It must document its own state — `pipeline/state.json` always reflects reality
4. It must be self-improving — post-phase retrospectives go into `SPEC.md` as improvements
5. It must never skip quality gates — not even for "just one small thing"
6. It must never modify a protected file
7. It must enforce the holdout principle on test-agent — violations are bugs

---

## 13. Version

- Version: 1.1.0
- Last updated: 2026-05-01
- Based on: Forge (ibuzzardo/forge), Dark Factory (HWallaballa/dark-factory), FSPEC (sengac/fspec), ColeAM00 Dark Factory Experiment (coleam00/dark-factory-experiment)
