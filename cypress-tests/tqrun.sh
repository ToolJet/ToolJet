#!/bin/bash
# Serialised cypress runner for tableQA: one run at a time (parallel runs corrupt node_modules/.cache).
# Usage: ./tqrun.sh <spec path>  -> prints compact pass/fail summary; full log in /tmp-ish log file.
cd "$(dirname "$0")"
LOCK=/tmp/tqrun.lock
until mkdir "$LOCK" 2>/dev/null; do sleep 5; done
trap 'rmdir "$LOCK"' EXIT
LOG="cypress/e2e/happyPath/appbuilder/tableQA/logs/$(basename "$1" .qa.js).log"
mkdir -p "$(dirname "$LOG")"
npx cypress run --config-file cypress-tableqa.config.js --spec "$1" > "$LOG" 2>&1 &
CPID=$!
# hang guard: kill the run after ${TQ_MAX:-1200}s
( sleep "${TQ_MAX:-1200}"; if kill -0 $CPID 2>/dev/null; then echo "HANG GUARD: killed after ${TQ_MAX:-1200}s" >> "$LOG"; pkill -P $CPID; kill $CPID; pkill -f "cypress run --config-file cypress-tableqa"; fi ) &
GPID=$!
wait $CPID; kill $GPID 2>/dev/null
grep -E '^\s+(✓|[0-9]+\))|passing|failing|pending' "$LOG" | head -80
echo "--- failure details (trimmed) ---"
awk '/^  [0-9]+\) /,0' "$LOG" | grep -vE '^\s+at |node_modules|^\s*$' | head -120
