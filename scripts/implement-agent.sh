#!/usr/bin/env bash
# implement-agent.sh — Spawned by orchestrator to implement a phase.
# Usage: ./implement-agent.sh <phase_number>

set -euo pipefail

PHASE_NUM="${1:?Usage: $0 <phase_number>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SPEC_FILE="$APP_DIR/specs/in-progress/PHASE-${PHASE_NUM}.md"
CODE_DIR="$APP_DIR/pipeline/phase-${PHASE_NUM}/code"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [IMPLEMENT-AGENT] INFO: $1"
}

log "Implement agent started for phase $PHASE_NUM"

if [ ! -f "$SPEC_FILE" ]; then
    log "ERROR: Spec file not found: $SPEC_FILE — run plan-agent first"
    exit 1
fi

SPEC_CONTENT=$(cat "$SPEC_FILE")

# Check for Claude CLI
if command -v claude &>/dev/null; then
    CLAUDE_CMD="claude"
elif command -v claude-code &>/dev/null; then
    CLAUDE_CMD="claude-code"
else
    log "ERROR: Neither claude nor claude-code CLI found in PATH"
    exit 1
fi

# Create branch for this phase
cd "$APP_DIR"
git checkout -b "phase-${PHASE_NUM}/" 2>/dev/null || git checkout "phase-${PHASE_NUM}/" 2>/dev/null || true

IMPLEMENT_PROMPT="You are the Implement Agent for Dark Factory (dark-factory-app). Your job is to write code.

## Your Task
Implement Phase $PHASE_NUM according to the spec at: $SPEC_FILE

## Context
- The Dark Factory App source code goes in: $APP_DIR
- Your implementation goes in: $CODE_DIR
- The app is a Next.js 14 App Router project with TypeScript
- Follow the SPEC.md design language (industrial noir, dark theme, JetBrains Mono, amber accents)
- Follow rules.md: no TODO/FIXME placeholders, docstrings on public APIs, no hardcoded secrets

## Instructions
1. Read $SPEC_FILE carefully
2. Read $APP_DIR/SPEC.md for the overall project vision
3. Read $APP_DIR/rules.md for the rules of operation
4. Implement ALL deliverables listed in the spec
5. Write code directly to the actual project directories (not a separate code/ subdirectory — write to the real paths)
6. Ensure all code compiles/runs without errors
7. After writing code, verify it with a dry-run or type check

## Constraints
- Use the existing project structure where applicable
- Match code style of existing files
- No placeholder or stub code
- All files must be production-ready

## Deliverables to implement (from spec):
$(cat "$SPEC_FILE" | grep -A 50 "## 3. Deliverables" | head -60)

Implement the code now. Do not stop until all files are written and verified."
}

log "Calling $CLAUDE_CMD to implement phase $PHASE_NUM..."

cd "$APP_DIR"
$CLAUDE_CMD --print "$IMPLEMENT_PROMPT" 2>/dev/null

log "Implementation complete for phase $PHASE_NUM"
exit 0
