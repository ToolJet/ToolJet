#!/bin/bash
# Run e2e tests in batches to avoid OOM.
# Usage: ./test/run-e2e-batches.sh [batch_size]
# Default batch size: 5

set -o pipefail

BATCH_SIZE=${1:-5}
SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SERVER_DIR"

FILES=($(find test/modules -path '*/e2e/*.spec.ts' | sort))
TOTAL=${#FILES[@]}
PASSED=0
FAILED=0
FAILED_FILES=()

echo "=== Running $TOTAL e2e files in batches of $BATCH_SIZE ==="
echo ""

for ((i=0; i<TOTAL; i+=BATCH_SIZE)); do
  BATCH=("${FILES[@]:i:BATCH_SIZE}")
  BATCH_NUM=$(( (i / BATCH_SIZE) + 1 ))
  BATCH_TOTAL=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))

  echo "--- Batch $BATCH_NUM/$BATCH_TOTAL (files $((i+1))-$((i+${#BATCH[@]}))/$TOTAL) ---"

  OUTPUT=$(NODE_ENV=test NODE_OPTIONS='--max-old-space-size=8192' npx jest \
    --config test/jest-e2e.json \
    --runInBand \
    --verbose \
    --forceExit \
    --no-coverage \
    "${BATCH[@]}" 2>&1)

  EXIT_CODE=$?

  # Extract pass/fail counts from output (macOS-compatible — no grep -P)
  BATCH_PASSED=$(echo "$OUTPUT" | awk '/Tests:.*passed/{for(i=1;i<=NF;i++) if($i=="passed") print $(i-1)}' | tail -1)
  BATCH_PASSED=${BATCH_PASSED:-0}
  BATCH_FAILED_SUITES=$(echo "$OUTPUT" | grep -c 'FAIL ' || true)

  if [ $EXIT_CODE -eq 0 ]; then
    echo "  ✓ All passed ($BATCH_PASSED tests)"
  else
    echo "  ✗ $BATCH_FAILED_SUITES suite(s) failed"
    # Capture failed file names
    while IFS= read -r line; do
      FAILED_FILES+=("$line")
    done < <(echo "$OUTPUT" | grep 'FAIL ' | sed 's/.*FAIL //')
  fi

  PASSED=$((PASSED + BATCH_PASSED))
  FAILED=$((FAILED + BATCH_FAILED_SUITES))
  echo ""
done

echo "=== Summary ==="
echo "Total files: $TOTAL"
echo "Passed tests: $PASSED"
echo "Failed suites: $FAILED"

if [ ${#FAILED_FILES[@]} -gt 0 ]; then
  echo ""
  echo "Failed files:"
  for f in "${FAILED_FILES[@]}"; do
    echo "  - $f"
  done
  exit 1
fi

exit 0
