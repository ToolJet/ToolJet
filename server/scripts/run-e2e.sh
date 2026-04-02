#!/usr/bin/env bash
# Runs the e2e suite in sequential shards to prevent V8 OOM.
# Each shard runs in its own Node.js process — memory resets between shards.
# All output streams to stdout; a combined summary prints at the end.
#
# Usage:
#   npm run test:e2e                              # run all 30 specs
#   npm run test:e2e -- --testPathPatterns "auth"  # run only auth specs
#   npm run test:e2e -- --group=platform           # run only @group platform

set -o pipefail

SHARDS=3
JEST_CONFIG="./test/jest-e2e.config.ts"
NODE_OPTS="--max-old-space-size=8192"
JEST_ARGS="--runInBand --colors"

# Detect --coverage in args so we can route each shard to its own directory
HAS_COVERAGE=false
for arg in "$@"; do
  [ "$arg" = "--coverage" ] && HAS_COVERAGE=true
done

total_passed=0
total_failed=0
total_suites=0
tests_passed=0
tests_failed=0
failed_suites=""
exit_code=0
start_time=$SECONDS

extract_num() { echo "$1" | grep -Eo "[0-9]+ $2" | awk '{print $1}'; }

fmt_duration() {
  local secs=$1
  if [ $secs -ge 3600 ]; then
    printf "%dh %dm %ds" $((secs/3600)) $((secs%3600/60)) $((secs%60))
  elif [ $secs -ge 60 ]; then
    printf "%dm %ds" $((secs/60)) $((secs%60))
  else
    printf "%ds" "$secs"
  fi
}

for s in $(seq 1 $SHARDS); do
  printf "\n\033[1m━━━ Shard %d/%d ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n" "$s" "$SHARDS"

  COV_ARGS=""
  if [ "$HAS_COVERAGE" = true ]; then
    COV_ARGS="--coverageDirectory=.coverage/shard-$s"
  fi

  NODE_ENV=test NODE_OPTIONS="$NODE_OPTS" npx jest --config "$JEST_CONFIG" \
    --shard="$s/$SHARDS" $JEST_ARGS $COV_ARGS "$@" 2>&1 | tee /tmp/e2e-shard-$s.log

  shard_exit=${PIPESTATUS[0]}
  [ $shard_exit -ne 0 ] && exit_code=1

  suites_line=$(grep "Test Suites:" /tmp/e2e-shard-$s.log | tail -1)
  tests_line=$(grep "Tests:" /tmp/e2e-shard-$s.log | tail -1)

  if [ -n "$suites_line" ]; then
    n=$(extract_num "$suites_line" "passed"); total_passed=$((total_passed + ${n:-0}))
    n=$(extract_num "$suites_line" "failed"); total_failed=$((total_failed + ${n:-0}))
    n=$(extract_num "$suites_line" "total");  total_suites=$((total_suites + ${n:-0}))
  fi

  if [ -n "$tests_line" ]; then
    n=$(extract_num "$tests_line" "passed"); tests_passed=$((tests_passed + ${n:-0}))
    n=$(extract_num "$tests_line" "failed"); tests_failed=$((tests_failed + ${n:-0}))
  fi

  shard_failed=$(grep "FAIL " /tmp/e2e-shard-$s.log | head -20)
  [ -n "$shard_failed" ] && failed_suites="$failed_suites$shard_failed"$'\n'
done

# Merge per-shard coverage into a single report
if [ "$HAS_COVERAGE" = true ]; then
  printf "\n\033[1m━━━ Merging coverage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n"
  mkdir -p .coverage/merged
  npx nyc merge .coverage .coverage/merged/coverage-final.json 2>/dev/null
  npx nyc report \
    --temp-dir .coverage/merged \
    --reporter=text --reporter=html --reporter=lcov \
    --report-dir=coverage 2>/dev/null
  cp .coverage/merged/coverage-final.json coverage/coverage-final.json
  printf "\033[32mCoverage report written to coverage/\033[0m\n"
  printf "\033[2mOpen coverage/index.html in a browser for the full report.\033[0m\n"
  rm -rf .coverage
fi

total_tests=$((tests_passed + tests_failed))
elapsed=$((SECONDS - start_time))

printf "\n\033[1m━━━ Results ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n"

if [ $total_failed -eq 0 ]; then
  printf "\033[32mTest Suites: %d passed, %d total\033[0m\n" "$total_passed" "$total_suites"
  printf "\033[32mTests:       %d passed, %d total\033[0m\n" "$tests_passed" "$total_tests"
else
  printf "\033[31mTest Suites: %d failed\033[0m, \033[32m%d passed\033[0m, %d total\n" "$total_failed" "$total_passed" "$total_suites"
  printf "\033[31mTests:       %d failed\033[0m, \033[32m%d passed\033[0m, %d total\n" "$tests_failed" "$tests_passed" "$total_tests"
  printf "\n\033[31mFailed:\033[0m\n"
  echo "$failed_suites" | sort -u | grep -v '^$' | sed 's/^/  /'
fi

printf "\033[2mTime:        %s\033[0m\n" "$(fmt_duration $elapsed)"
echo ""
exit $exit_code
