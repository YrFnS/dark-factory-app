#!/usr/bin/env bash
# plan-agent.sh — Spawned by orchestrator to create a phase spec.
# Usage: ./plan-agent.sh <phase_number>

set -euo pipefail

PHASE_NUM="${1:?Usage: $0 <phase_number>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SPEC_FILE="$APP_DIR/specs/in-progress/PHASE-${PHASE_NUM}.md"
STATE_FILE="$APP_DIR/pipeline/state.json"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [PLAN-AGENT] INFO: $1"
}

log "Plan agent started for phase $PHASE_NUM"

# Load SPEC.md and current state to understand context
SPEC_CONTENT=$(cat "$APP_DIR/SPEC.md" 2>/dev/null || echo "")
STATE_CONTENT=$(cat "$STATE_FILE" 2>/dev/null || echo "{}")

# Determine what this phase should do based on SPEC.md phases section
# Use Claude Code CLI to generate the phase spec
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-opus-4-6}"

PLAN_PROMPT="You are the Plan Agent for Dark Factory (dark-factory-app). Your job is to write a detailed phase spec.

## Your Task
Write SPEC.md for Phase $PHASE_NUM of the Dark Factory App. The project SPEC.md is at $APP_DIR/SPEC.md.

## Context
- Current pipeline state: $STATE_CONTENT
- The app directory is at: $APP_DIR
- Phase specs are saved at: $APP_DIR/specs/in-progress/PHASE-${PHASE_NUM}.md
- The master spec (SPEC.md) defines 6 phases: 0=Init, 1=Core Orchestrator, 2=Dashboard UI, 3=Agent Integration, 4=Polish, 5=Finalize

## Instructions
1. Read the master SPEC.md carefully
2. Determine what Phase $PHASE_NUM requires based on the phases section
3. Write the phase spec to: $SPEC_FILE
4. Use the template at: $APP_DIR/specs/templates/PHASE-TEMPLATE.md
5. Make the spec concrete: exact files, exact acceptance criteria, exact deliverables
6. No vague goals — every criterion must be verifiable

## Phase $PHASE_NUM Details
$(cat "$APP_DIR/SPEC.md" | grep -A 20 "Phase $PHASE_NUM")

## Rules
- Follow rules.md (no human in loop, spec is law, phase gates, full traceability)
- Use the PHASE-TEMPLATE.md format exactly
- Output only the spec file — no commentary

Write the spec now. Save to: $SPEC_FILE"

# Check if claude or claude-code is available
if command -v claude &>/dev/null; then
    CLAUDE_CMD="claude"
elif command -v claude-code &>/dev/null; then
    CLAUDE_CMD="claude-code"
else
    log "ERROR: Neither claude nor claude-code CLI found in PATH"
    log "Install Claude CLI: https://docs.anthropic.com/en/docs/claude-code"
    exit 1
fi

log "Calling $CLAUDE_CMD to generate phase spec..."

# Write the spec using Claude CLI
$CLAUDE_CMD --print "$PLAN_PROMPT" 2>/dev/null > "$SPEC_FILE" || {
    log "ERROR: Claude CLI failed"
    exit 1
}

if [ ! -f "$SPEC_FILE" ] || [ ! -s "$SPEC_FILE" ]; then
    log "ERROR: Spec file not created or empty"
    exit 1
fi

log "Phase $PHASE_NUM spec written to: $SPEC_FILE"
exit 0
