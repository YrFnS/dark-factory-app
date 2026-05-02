#!/usr/bin/env bash
# setup-cron.sh — Installs the Dark Factory cron job for automated phase execution.
# Runs every 4 hours on the hour. Idempotent — safe to run multiple times.
# Usage: ./setup-cron.sh [--remove]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ORCHESTRATOR_SCRIPT="$SCRIPT_DIR/orchestrator.sh"
CRON_JOB_LINE="0 */4 * * * cd \"$APP_DIR\" && bash \"$ORCHESTRATOR_SCRIPT\" >> \"$APP_DIR/logs/cron.log\" 2>&1"
CRON_JOB_DESC="dark-factory-phase-runner"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [SETUP-CRON] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%SZ')] [SETUP-CRON] ERROR: $1" >&2
}

# Ensure logs directory exists
mkdir -p "$APP_DIR/logs"

# Check for --remove flag
if [[ "${1:-}" == "--remove" ]]; then
    log "Removing Dark Factory cron job..."

    # Get current crontab, filter out our job, and replace
    crontab -l 2>/dev/null | grep -v "dark-factory-phase-runner" | grep -v "$ORCHESTRATOR_SCRIPT" > /tmp/current-cron.tmp

    if crontab /tmp/current-cron.tmp 2>/dev/null; then
        log "Cron job removed successfully."
    else
        log "No existing cron job found to remove."
    fi
    rm -f /tmp/current-cron.tmp
    exit 0
fi

log "Setting up Dark Factory cron job..."
log "Schedule: 0 */4 * * * (every 4 hours on the hour)"
log "Script: $ORCHESTRATOR_SCRIPT"

# Verify orchestrator script exists and is executable
if [[ ! -x "$ORCHESTRATOR_SCRIPT" ]]; then
    log_error "Orchestrator script not found or not executable: $ORCHESTRATOR_SCRIPT"
    log "Make it executable with: chmod +x $ORCHESTRATOR_SCRIPT"
    exit 1
fi

# Get current crontab
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")

# Check if our cron job is already installed
if echo "$CURRENT_CRONTAB" | grep -q "dark-factory-phase-runner"; then
    log "Cron job already installed. Idempotent — no changes made."
    echo "Next scheduled run: $(next-cron-run 2>/dev/null || echo 'See cron table')"
    exit 0
fi

# Append our cron job to the crontab
if [[ -n "$CURRENT_CRONTAB" ]]; then
    # Add newline + our job to existing crontab
    (echo ""; echo "# $CRON_JOB_DESC"; echo "$CRON_JOB_LINE") | crontab -
else
    # No existing crontab, create one with our job
    (echo "# $CRON_JOB_DESC"; echo "$CRON_JOB_LINE") | crontab -
fi

log "Cron job installed successfully."

# Calculate and display next run time
NEXT_RUN=$(date -d "next hour" -u '+%Y-%m-%d %H:00 UTC' 2>/dev/null || echo "next 4h interval")
# Find the next 4-hour boundary
CURRENT_HOUR=$(date -u '+%H' | sed 's/^0//')
NEXT_4H=$(( (CURRENT_HOUR / 4 + 1) * 4 % 24 ))
if [[ $NEXT_4H -eq 0 ]]; then
    NEXT_4H=0
    NEXT_DATE=$(date -d "tomorrow" -u '+%Y-%m-%d')
else
    NEXT_DATE=$(date -u '+%Y-%m-%d')
fi
log "Next scheduled run: ${NEXT_DATE} ${NEXT_4H}:00 UTC"

# Verify installation
VERIFY=$(crontab -l 2>/dev/null | grep "dark-factory-phase-runner" | head -1)
if [[ -n "$VERIFY" ]]; then
    log "Verification: cron job is installed."
else
    log_error "Verification failed: cron job not found after installation."
    exit 1
fi

log "Setup complete."
exit 0
