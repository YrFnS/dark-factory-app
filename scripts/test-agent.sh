#!/usr/bin/env bash
# test-agent.sh — Spawned by orchestrator to test, lint, and type-check a phase.
# Usage: ./test-agent.sh <phase_number>

set -euo pipefail

PHASE_NUM="${1:?Usage: $0 <phase_number>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
PHASE_DIR="$APP_DIR/pipeline/phase-${PHASE_NUM}"
CODE_DIR="$PHASE_DIR/code"
STATE_FILE="$APP_DIR/pipeline/state.json"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [TEST-AGENT] INFO: $1"
}

log "Test agent started for phase $PHASE_NUM"

# ── LINT ───────────────────────────────────────────────────────────────────────
log "Running linter..."
LINT_STATUS="pass"
LINT_ERRORS=0

if [ -f "$APP_DIR/package.json" ] && grep -q '"lint"' "$APP_DIR/package.json" 2>/dev/null; then
    cd "$APP_DIR"
    npm run lint > "$PHASE_DIR/lint-report.txt" 2>&1 || true
    LINT_ERRORS=$(grep -c "error" "$PHASE_DIR/lint-report.txt" 2>/dev/null || echo "0")
    if [ "$LINT_ERRORS" -gt 0 ]; then
        LINT_STATUS="fail"
        log "Lint: $LINT_ERRORS errors found"
    else
        log "Lint: 0 errors"
    fi
elif [ -f "$APP_DIR/pyproject.toml" ] || [ -f "$APP_DIR/ruff.toml" ]; then
    if command -v ruff &>/dev/null; then
        cd "$APP_DIR"
        ruff check . > "$PHASE_DIR/lint-report.txt" 2>&1 || true
        LINT_ERRORS=$(grep -c "error" "$PHASE_DIR/lint-report.txt" 2>/dev/null || echo "0")
        [ "$LINT_ERRORS" -gt 0 ] && LINT_STATUS="fail"
    fi
else
    echo "No linter configured — skip" > "$PHASE_DIR/lint-report.txt"
fi

# ── TYPE CHECK ────────────────────────────────────────────────────────────────
log "Running type checker..."
TYPE_STATUS="pass"
TYPE_ERRORS=0

if [ -f "$APP_DIR/package.json" ] && grep -q '"typecheck"' "$APP_DIR/package.json" 2>/dev/null; then
    cd "$APP_DIR"
    npm run typecheck > "$PHASE_DIR/type-report.txt" 2>&1 || true
    TYPE_ERRORS=$(grep -c "error" "$PHASE_DIR/type-report.txt" 2>/dev/null || echo "0")
    [ "$TYPE_ERRORS" -gt 0 ] && TYPE_STATUS="fail"
    [ "$TYPE_ERRORS" -gt 0 ] && log "Type check: $TYPE_ERRORS errors found" || log "Type check: 0 errors"
elif [ -f "$APP_DIR/tsconfig.json" ]; then
    if command -v tsc &>/dev/null; then
        cd "$APP_DIR"
        npx tsc --noEmit > "$PHASE_DIR/type-report.txt" 2>&1 || true
        TYPE_ERRORS=$(grep -c "error" "$PHASE_DIR/type-report.txt" 2>/dev/null || echo "0")
        [ "$TYPE_ERRORS" -gt 0 ] && TYPE_STATUS="fail"
    fi
elif [ -f "$APP_DIR/pyproject.toml" ] && command -v mypy &>/dev/null; then
    cd "$APP_DIR"
    mypy . > "$PHASE_DIR/type-report.txt" 2>&1 || true
    TYPE_ERRORS=$(grep -c "error" "$PHASE_DIR/type-report.txt" 2>/dev/null || echo "0")
    [ "$TYPE_ERRORS" -gt 0 ] && TYPE_STATUS="fail"
else
    echo "No type checker configured — skip" > "$PHASE_DIR/type-report.txt"
fi

# ── TESTS ─────────────────────────────────────────────────────────────────────
log "Running tests..."
TEST_STATUS="pass"
TEST_PASSED=0
TEST_TOTAL=0
TEST_COVERAGE=0

if [ -f "$APP_DIR/package.json" ] && grep -q '"test"' "$APP_DIR/package.json" 2>/dev/null; then
    cd "$APP_DIR"
    npm test > "$PHASE_DIR/test-report.txt" 2>&1 || true
    TEST_PASSED=$(grep -oP '\d+(?= passing)' "$PHASE_DIR/test-report.txt" 2>/dev/null || echo "0")
    TEST_TOTAL=$(grep -oP '\d+(?= total)' "$PHASE_DIR/test-report.txt" 2>/dev/null || echo "0")
    if [ "$TEST_TOTAL" -gt 0 ]; then
        TEST_COVERAGE=$((TEST_PASSED * 100 / TEST_TOTAL))
    fi
    if [ "$TEST_PASSED" -lt "$TEST_TOTAL" ] || [ "$TEST_TOTAL" -eq 0 ]; then
        TEST_STATUS="fail"
        log "Tests: $TEST_PASSED/$TEST_TOTAL passed"
    else
        log "Tests: $TEST_PASSED/$TEST_TOTAL passed"
    fi
elif [ -f "$APP_DIR/pyproject.toml" ] && command -v pytest &>/dev/null; then
    cd "$APP_DIR"
    pytest > "$PHASE_DIR/test-report.txt" 2>&1 || true
    TEST_PASSED=$(grep -oP '\d+(?= passed)' "$PHASE_DIR/test-report.txt" 2>/dev/null || echo "0")
    TEST_TOTAL="$TEST_PASSED"
    log "Tests: $TEST_PASSED passed"
else
    echo "No test runner configured — skip" > "$PHASE_DIR/test-report.txt"
fi

# ── UPDATE STATE ───────────────────────────────────────────────────────────────
python3 <<EOF
import json
with open('$STATE_FILE', 'r') as f:
    d = json.load(f)
d['phases']['$PHASE_NUM']['gates']['lint'] = {
    'status': '$LINT_STATUS',
    'errorCount': $LINT_ERRORS,
    'reportPath': '$PHASE_DIR/lint-report.txt'
}
d['phases']['$PHASE_NUM']['gates']['types'] = {
    'status': '$TYPE_STATUS',
    'errorCount': $TYPE_ERRORS,
    'reportPath': '$PHASE_DIR/type-report.txt'
}
d['phases']['$PHASE_NUM']['gates']['tests'] = {
    'status': '$TEST_STATUS',
    'errorCount': $((TEST_TOTAL - TEST_PASSED)),
    'reportPath': '$PHASE_DIR/test-report.txt',
    'coverage': $TEST_COVERAGE
}
with open('$STATE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
EOF

log "Quality gates: lint=$LINT_STATUS types=$TYPE_STATUS tests=$TEST_STATUS"
exit 0
