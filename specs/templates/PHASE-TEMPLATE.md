# Phase N — [Phase Name]

> Copy this template to `specs/in-progress/PHASE-N.md` to begin a phase.

## Metadata
- Phase: N
- Created: YYYY-MM-DD
- Status: in-progress
- Parent: SPEC.md

## 1. Goals
What must this phase accomplish? (2-4 bullet points, concrete and verifiable)

## 2. Scope
### In Scope
- Item 1
- Item 2

### Out of Scope
- Item 1
- Item 2

## 3. Deliverables
Exact files to be created or modified:

| File | Action | Description |
|------|--------|-------------|
| `path/to/file` | create/modify | Description |

## 4. Dependencies
- External: None / List external deps
- Internal: What preceding phases/files are required

## 5. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Risk 1 | high/med/low | high/med/low | Mitigation |

## 6. Acceptance Criteria
- [ ] Criterion 1 (verifiable, concrete)
- [ ] Criterion 2

## 7. Agent Instructions
### Plan Agent
- [ ] Read SPEC.md
- [ ] Analyze previous phase outputs
- [ ] Write this spec

### Implement Agent
- [ ] Read `specs/in-progress/PHASE-N.md`
- [ ] Create branch `phase-N/`
- [ ] Implement all deliverables
- [ ] Ensure code compiles/runs without errors
- [ ] No placeholder code

### Test Agent
- [ ] Read `pipeline/phase-N/code/`
- [ ] Write tests in `pipeline/phase-N/tests/`
- [ ] Run linter — 0 errors
- [ ] Run type checker — 0 errors
- [ ] Run tests — 100% pass, 80% coverage
- [ ] Generate reports

## 8. Quality Gates
| Gate | Tool | Threshold |
|------|------|-----------|
| Lint | ESLint / ruff | 0 errors |
| Types | TypeScript / mypy | 0 errors |
| Tests | Vitest / pytest | 100% pass, 80% coverage |

## 9. Notes
Any additional context, edge cases, or special instructions.
