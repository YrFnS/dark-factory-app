#!/usr/bin/env bash
# orchestrator.sh — Dark Factory Phase Orchestrator
# Called by cron every 4 hours or manually to advance phases.
# Reads pipeline/state.json, determines current work, dispatches agents.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$APP_DIR/pipeline/state.json"
LOG_FILE="$APP_DIR/logs/orchestrator.log"
PHASE_DIR="$APP_DIR/pipeline/phase-\$PHASE"

mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [ORCHESTRATOR] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [ORCHESTRATOR] ERROR: $1" | tee -a "$LOG_FILE"
}

get_phase() {
    python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['currentPhase'])"
}

get_phase_status() {
    local p=$1
    python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['phases']['$p']['status'])"
}

set_phase_status() {
    local p=$1
    local status=$2
    local ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    python3 -c "
import json
with open('$STATE_FILE', 'r') as f:
    d = json.load(f)
d['phases']['$p']['status'] = '$status'
if '$status' == 'in-progress':
    d['phases']['$p']['startedAt'] = '$ts'
with open('$STATE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
"
}

advance_phase() {
    local next=$1
    python3 -c "
import json
with open('$STATE_FILE', 'r') as f:
    d = json.load(f)
d['currentPhase'] = $next
with open('$STATE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
"
    log "Advanced to phase $next"
}

# Check PID lock to prevent concurrent runs
PID_FILE="/tmp/dark-factory-orchestrator.pid"
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        log "Orchestrator already running (PID $OLD_PID), exiting."
        exit 0
    fi
    log "Stale PID file found (PID $OLD_PID), removing."
fi
echo $$ > "$PID_FILE"
trap "rm -f $PID_FILE" EXIT

log "Starting orchestrator run"

CURRENT=$(get_phase)
STATUS=$(get_phase_status "$CURRENT")

log "Current phase: $CURRENT, status: $STATUS"

if [ "$STATUS" == "complete" ]; then
    NEXT=$((CURRENT + 1))
    if [ "$NEXT" -gt 5 ]; then
        log "All phases complete. Dark Factory v1.0.0 built successfully."
        exit 0
    fi
    advance_phase "$NEXT"
    CURRENT=$NEXT
    STATUS="pending"
fi

if [ "$STATUS" == "blocked" ]; then
    log_error "Phase $CURRENT is blocked. Manual intervention required."
    log "Check logs/orchestrator.log for details."
    exit 1
fi

if [ "$STATUS" != "pending" ] && [ "$STATUS" != "in-progress" ]; then
    log "Phase $CURRENT has status $STATUS, nothing to do."
    exit 0
fi

# Execute phase
set_phase_status "$CURRENT" "in-progress"
PHASE_NUM="$CURRENT"

log "=== PHASE $PHASE_NUM: Starting ==="

# Create phase directory
mkdir -p "$APP_DIR/pipeline/phase-$PHASE_NUM/code"
mkdir -p "$APP_DIR/pipeline/phase-$PHASE_NUM/tests"

# Dispatch PLAN agent (subagent)
log "[PHASE $PHASE_NUM] Dispatching PLAN agent..."
PLAN_LOG="$APP_DIR/logs/plan-$PHASE_NUM.log"
bash "$APP_DIR/scripts/plan-agent.sh" "$PHASE_NUM" > "$PLAN_LOG" 2>&1 &
PLAN_PID=$!
log "[PHASE $PHASE_NUM] Plan agent running (PID $PLAN_PID), waiting..."
wait $PLAN_PID
PLAN_EXIT=$?
if [ $PLAN_EXIT -ne 0 ]; then
    log_error "[PHASE $PHASE_NUM] Plan agent failed with exit code $PLAN_EXIT"
    set_phase_status "$CURRENT" "blocked"
    exit 1
fi
log "[PHASE $PHASE_NUM] Plan agent completed successfully"

# Dispatch IMPLEMENT agent (subagent)
log "[PHASE $PHASE_NUM] Dispatching IMPLEMENT agent..."
IMPLEMENT_LOG="$APP_DIR/logs/implement-$PHASE_NUM.log"
bash "$APP_DIR/scripts/implement-agent.sh "$PHASE_NUM" > "$IMPLEMENT_LOG" 2>&1 &
IMPLEMENT_PID=$!
log "[PHASE $PHASE_NUM] Implement agent running (PID $IMPLEMENT_PID), waiting..."
wait $IMPLEMENT_PID
IMPLEMENT_EXIT=$?
if [ $IMPLEMENT_EXIT -ne 0 ]; then
    log_error "[PHASE $PHASE_NUM] Implement agent failed with exit code $IMPLEMENT_EXIT"
    set_phase_status "$CURRENT" "blocked"
    exit 1
fi
log "[PHASE $PHASE_NUM] Implement agent completed successfully"

# Dispatch TEST agent (subagent)
log "[PHASE $PHASE_NUM] Dispatching TEST agent..."
TEST_LOG="$APP_DIR/logs/test-$PHASE_NUM.log"
bash "$APP_DIR/scripts/test-agent.sh "$PHASE_NUM" > "$TEST_LOG" 2>&1 &
TEST_PID=$!
log "[PHASE $PHASE_NUM] Test agent running (PID $TEST_PID), waiting..."
wait $TEST_PID
TEST_EXIT=$?
if [ $TEST_EXIT -ne 0 ]; then
    log_error "[PHASE $PHASE_NUM] Test agent failed with exit code $TEST_EXIT"
    set_phase_status "$CURRENT" "blocked"
    exit 1
fi
log "[PHASE $PHASE_NUM] Test agent completed successfully"

# Validate quality gates
log "[PHASE $PHASE_NUM] Validating quality gates..."

LINT_RESULT=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['phases']['$PHASE_NUM']['gates']['lint']['status'])")
TYPE_RESULT=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['phases']['$PHASE_NUM']['gates']['types']['status'])")
TEST_RESULT=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['phases']['$PHASE_NUM']['gates']['tests']['status'])")

if [ "$LINT_RESULT" == "pass" ] && [ "$TYPE_RESULT" == "pass" ] && [ "$TEST_RESULT" == "pass" ]; then
    set_phase_status "$CURRENT" "complete"
    # Archive spec
    if [ -f "$APP_DIR/specs/in-progress/PHASE-$PHASE_NUM.md" ]; then
        mv "$APP_DIR/specs/in-progress/PHASE-$PHASE_NUM.md" "$APP_DIR/specs/completed/PHASE-$PHASE_NUM.md"
    fi
    log "=== PHASE $PHASE_NUM: COMPLETE — All gates passed ==="
else
    log_error "[PHASE $PHASE_NUM] Quality gates failed: lint=$LINT_RESULT types=$TYPE_RESULT tests=$TEST_RESULT"
    set_phase_status "$CURRENT" "blocked"
    exit 1
fi

log "Orchestrator run complete."
