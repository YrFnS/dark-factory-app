#!/usr/bin/env bash
# implement-agent.sh — Spawned by orchestrator to implement a phase.
# Usage: ./implement-agent.sh <phase_number>

set -euo pipefail

PHASE_NUM="${1:?Usage: $0 <phase_number>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SPEC_FILE="$APP_DIR/specs/in-progress/PHASE-${PHASE_NUM}.md"
CODE_DIR="$APP_DIR/pipeline/phase-${PHASE_NUM}/code"
ORCHESTRATOR_PID_FILE="/tmp/dark-factory-orchestrator.pid"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [IMPLEMENT-AGENT] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [IMPLEMENT-AGENT] ERROR: $1" >&2
}

# Check orchestrator PID lock — ensure orchestrator is running before starting
check_orchestrator_lock() {
    if [ -f "$ORCHESTRATOR_PID_FILE" ]; then
        OLD_PID=$(cat "$ORCHESTRATOR_PID_FILE" 2>/dev/null || echo "")
        if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
            log "Orchestrator is running (PID $OLD_PID). Implement agent waiting..."
            # Wait for orchestrator to finish
            while [ -f "$ORCHESTRATOR_PID_FILE" ]; do
                sleep 1
            done
            log "Orchestrator finished. Proceeding with implement agent."
        fi
    fi
}

check_orchestrator_lock

log "Implement agent started for phase $PHASE_NUM"

if [ ! -f "$SPEC_FILE" ]; then
    log "ERROR: Spec file not found: $SPEC_FILE — run plan-agent first"
    exit 1
fi

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

log "Calling $CLAUDE_CMD to implement phase $PHASE_NUM..."

# Build the prompt via Python to avoid shell escaping nightmares
python3 -c "
import sys, os, subprocess

phase = '$PHASE_NUM'
app_dir = '$APP_DIR'
spec_file = '$SPEC_FILE'

spec_content = open(spec_file).read()
master_spec = open(os.path.join(app_dir, 'SPEC.md')).read()
rules_content = open(os.path.join(app_dir, 'rules.md')).read()
deliverables = ''
try:
    idx = spec_content.find('## 3. Deliverables')
    if idx >= 0:
        deliverables = spec_content[idx:idx+3000]
except:
    deliverables = spec_content[:2000]

prompt = f'''You are the Implement Agent for Dark Factory (dark-factory-app). Your job is to write code.

## Your Task
Implement Phase {phase} according to the spec at: {spec_file}

## Context
- The Dark Factory App source code goes in: {app_dir}
- The app is a Next.js 14 App Router project with TypeScript
- Follow SPEC.md design language: industrial noir, dark theme (#0d0d0f base), JetBrains Mono, amber (#f59e0b) accents
- Follow rules.md: no TODO/FIXME placeholders, docstrings on public APIs, no hardcoded secrets

## Instructions
1. Read {spec_file} carefully
2. Read {app_dir}/SPEC.md for the overall project vision
3. Read {app_dir}/rules.md for the rules of operation
4. Implement ALL deliverables listed in the spec — write to the actual project directories
5. Ensure all code compiles/runs without errors
6. After writing code, verify it with a dry-run or type check
7. Commit each logical unit of work

## Constraints
- Use the existing project structure where applicable
- Match code style of existing files
- No placeholder or stub code
- All files must be production-ready

## Deliverables from spec:
{deliverables}

Implement the code now. Write all files directly to {app_dir}. Do not stop until all files are written and verified.'''

print(prompt)
" > /tmp/implement-prompt-${PHASE_NUM}.txt

cd "$APP_DIR"
$CLAUDE_CMD --print "$(cat /tmp/implement-prompt-${PHASE_NUM}.txt)" 2>/dev/null

rm -f /tmp/implement-prompt-${PHASE_NUM}.txt

log "Implementation complete for phase $PHASE_NUM"
exit 0
