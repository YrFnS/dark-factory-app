# ARCHON.md — Archon Workflows for Dark Factory App

> Archon is the execution engine. This file documents which workflows exist and when to use them.

## Workflows

### `dark-factory-phase-piv` (primary — use this for every phase)

The Plan → Implement → Validate loop. One subagent writes the phase spec, another implements it, a third tests and validates.

```
Phase N
  1. plan-agent    → writes specs/in-progress/PHASE-N.md
  2. implement-agent → reads PHASE-N.md, writes code to pipeline/phase-N/code/
  3. test-agent    → reads code, writes tests to pipeline/phase-N/tests/
  4. validate      → gate check: lint + type + test all pass → advance
```

Each iteration gets a **fresh Claude context** (context=fresh on implement and test nodes).

### `dark-factory-test-e2e`

Browser-based E2E regression using agent-browser. Runs after unit tests pass. Not needed until Phase 2 (dashboard exists).

### `dark-factory-fix`

Runs when a phase gate fails. Receives the error report and attempts fixes. Max 2 fix attempts per phase before escalation.

---

## Node Reference

| Node | Tool | Role | Key constraint |
|------|------|------|----------------|
| plan | Claude | orchestrator | Max 10 tool calls — delegate sub-tasks |
| implement | Claude | leaf | Fresh context per attempt |
| test | Claude | leaf | Holds out implement-agent's reasoning |
| validate | bash | — | Runs lint + type + test, gates on 0 failures |

---

## Holdout Principle (test-agent constraint)

The test-agent **MUST NOT** read:
- The implement-agent's scratch notes or plan documents
- The phase spec's internal notes
- Prior comments from implement-agent
- Commit messages beyond their title

The test-agent **MAY** read:
- The phase spec's acceptance criteria (what "done" means)
- The implementation code (pipeline/phase-N/code/)
- lint/type/test output

This prevents the test-agent from unconsciously going easy on the implement-agent.
