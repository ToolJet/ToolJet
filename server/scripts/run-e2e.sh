#!/usr/bin/env bash
# Unified e2e test runner.
#
# Default: sequential (--runInBand) with live output — ideal for local dev.
# --parallel: parallel shards with per-shard output — ideal for full suite.
# --coverage: implies --parallel, adds coverage collection + merge.
#
# Usage:
#   npm run test:e2e                                  # sequential, live output
#   npm run test:e2e -- --parallel                    # parallel shards
#   npm run test:e2e -- --testPathPatterns "auth"     # single spec, live output
#   npm run test:e2e:cov                              # parallel + coverage + merge

set -o pipefail

JEST_CONFIG="./test/jest-e2e.config.ts"
NODE_OPTS="--max-old-space-size=8192"
SHARDS=3

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

# ---------------------------------------------------------------------------
# Parse flags: extract --parallel and --coverage, pass rest to jest
# ---------------------------------------------------------------------------
parallel=false
coverage=false
jest_extra_args=()

for arg in "$@"; do
  case "$arg" in
    --parallel) parallel=true ;;
    --coverage) coverage=true; parallel=true ;;
    *) jest_extra_args+=("$arg") ;;
  esac
done

# ---------------------------------------------------------------------------
# Sequential mode (default): single jest process, live output
# ---------------------------------------------------------------------------
if [ "$parallel" = false ]; then
  NODE_ENV=test NODE_OPTIONS="$NODE_OPTS" npx jest \
    --config "$JEST_CONFIG" --runInBand --colors \
    "${jest_extra_args[@]}"
  exit $?
fi

# ---------------------------------------------------------------------------
# Parallel mode: pre-reset DB, launch shards, collect results
# ---------------------------------------------------------------------------
printf "\033[1m━━━ Pre-reset database ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n"
NODE_ENV=test npx ts-node -r tsconfig-paths/register --transpile-only scripts/truncate-test-db.ts
printf "\n"

# Build shard jest args as an array for safe expansion
SHARD_JEST_ARGS=(--runInBand --colors --passWithNoTests)
[ "$coverage" = true ] && SHARD_JEST_ARGS+=(--coverage)

# Temp dir for shard logs (avoids collisions on shared CI machines)
SHARD_LOG_DIR=$(mktemp -d)
trap 'rm -rf "$SHARD_LOG_DIR"' EXIT

total_passed=0; total_failed=0; total_suites=0
tests_passed=0; tests_failed=0
failed_suites=""
exit_code=0

# Run shards sequentially — suite TX uses a shared DB, so parallel shards
# would block on unique constraints. Sequential shards keep peak memory low
# (each shard's Jest process exits before the next starts).
for s in $(seq 1 $SHARDS); do
  printf "\033[1m━━━ Running shard %d/%d ━━━\033[0m\n" "$s" "$SHARDS"

  SKIP_GLOBAL_SETUP=1 NODE_ENV=test NODE_OPTIONS="$NODE_OPTS" npx jest \
    --config "$JEST_CONFIG" --shard="$s/$SHARDS" \
    --coverageDirectory=.coverage/shard-$s \
    "${SHARD_JEST_ARGS[@]}" "${jest_extra_args[@]}" 2>&1 | tee "$SHARD_LOG_DIR/shard-$s.log"

  shard_exit=${PIPESTATUS[0]}
  [ $shard_exit -ne 0 ] && exit_code=1

  suites_line=$(grep "Test Suites:" "$SHARD_LOG_DIR/shard-$s.log" | tail -1)
  tests_line=$(grep "Tests:" "$SHARD_LOG_DIR/shard-$s.log" | tail -1)

  if [ -n "$suites_line" ]; then
    n=$(extract_num "$suites_line" "passed"); total_passed=$((total_passed + ${n:-0}))
    n=$(extract_num "$suites_line" "failed"); total_failed=$((total_failed + ${n:-0}))
    n=$(extract_num "$suites_line" "total");  total_suites=$((total_suites + ${n:-0}))
  fi

  if [ -n "$tests_line" ]; then
    n=$(extract_num "$tests_line" "passed"); tests_passed=$((tests_passed + ${n:-0}))
    n=$(extract_num "$tests_line" "failed"); tests_failed=$((tests_failed + ${n:-0}))
  fi

  shard_failed=$(grep "FAIL " "$SHARD_LOG_DIR/shard-$s.log" | head -20)
  [ -n "$shard_failed" ] && failed_suites="$failed_suites$shard_failed"$'\n'
done

# Merge coverage if requested
if [ "$coverage" = true ]; then
  printf "\033[1m━━━ Merging coverage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n"
  mkdir -p .coverage/merged
  npx nyc merge .coverage .coverage/merged/coverage-final.json 2>/dev/null
  npx nyc report \
    --temp-dir .coverage/merged \
    --reporter=html --reporter=lcov --reporter=json \
    --report-dir=coverage-e2e 2>/dev/null
  cp .coverage/merged/coverage-final.json coverage-e2e/coverage-final.json 2>/dev/null
  printf "\033[32mCoverage report written to coverage-e2e/\033[0m\n"
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
