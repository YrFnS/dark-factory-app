@AGENTS.md

# Dark Factory App — Project Context

## What This Is

Dark Factory App is a meta-level autonomous development pipeline tool — it coordinates AI agents to plan, implement, test, and validate software with **zero human intervention** in the execution loop. It is itself built using the principles it embodies.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Next.js 14 App Router, TypeScript (strict)
- **Styling**: Tailwind CSS + CSS custom properties
- **State**: React Context + `useReducer`, filesystem (`pipeline/state.json`) as source of truth
- **Real-time**: SSE (Server-Sent Events)
- **Agent execution**: `child_process.spawn` calling Claude Code CLI
- **Pipeline orchestration**: Archon CLI workflows + custom bash agent scripts

## Commands

```bash
# Orchestrator (checks state, advances phases)
bash scripts/orchestrator.sh

# Single agents
bash scripts/plan-agent.sh <phase_num>
bash scripts/implement-agent.sh <phase_num>
bash scripts/test-agent.sh <phase_num>

# Archon workflows
archon workflow list
archon workflow run archon-piv-loop --cwd .

# Cron: dark-factory-phase-runner every 4h (0 */4 * * *)

# Quality gates (run manually)
npm run lint     # ESLint, 0 errors required
npm run type    # TypeScript, 0 errors required
npm run test    # Vitest, 100% pass required
```

## Layout

```
dark-factory-app/
├── SPEC.md                   ← Master spec (source of truth)
├── rules.md                  ← Operation rules (6-phase model)
├── AGENTS.md                 ← Agent operating instructions
├── pipeline/
│   └── state.json            ← Phase state machine
├── scripts/
│   ├── orchestrator.sh       ← Phase dispatcher (PID lock)
│   ├── plan-agent.sh         ← Spawns Claude to write phase SPEC.md
│   ├── implement-agent.sh     ← Spawns Claude to write code
│   └── test-agent.sh         ← Lint → typecheck → test → gate report
├── specs/
│   ├── templates/PHASE-TEMPLATE.md
│   ├── in-progress/          ← Active phase specs
│   └── completed/           ← Archived phase specs
├── app/                      ← Next.js App Router
├── components/               ← React components
├── lib/                      ← Core logic (orchestrator, agent-spawner, state-store)
└── .archon/                  ← Archon workflow definitions
```

## Design Language

- **Aesthetic**: Industrial noir — factory floor control panel
- **Colors**: `--bg-primary: #0d0d0f`, `--accent-amber: #f59e0b`, `--accent-red: #ef4444`, `--accent-green: #22c55e`
- **Fonts**: JetBrains Mono (headings/data), Inter (body)
- **Corners**: Sharp (2px radius max)

See `SPEC.md` §2 Design Language for full palette and motion philosophy.

## Key Conventions

- Phase specs live in `specs/in-progress/PHASE-N.md`
- Agent logs are append-only in `logs/`
- Quality gates must all be GREEN before advancing: lint (0 errors), typecheck (0 errors), tests (100% pass)
- Archon workflows available for sub-tasks (PIV loop, adversarial dev, etc.)
- All agent work in `pipeline/phase-N/` subdirectories
- Specs are the only human-authored input — cron never modifies specs

## Rules (Source of Truth)

See `rules.md` for the complete operation rules. The pipeline model:

| Phase | Name | Agent |
|-------|------|-------|
| 0 | Init | orchestrator |
| 1 | Plan | plan-agent |
| 2 | Implement | implement-agent |
| 3 | Test | test-agent |
| 4 | Validate | test-agent |
| 5 | Finalize | orchestrator |

Max 3 fix iterations before marking `blocked`. Cron fires every 4h.

## Project Learnings

- (empty — accumulate corrections here)
