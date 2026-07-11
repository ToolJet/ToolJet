#!/usr/bin/env bash
# Unified e2e test runner — always uses shards.
#
# Default: sequential shards (~9min local).
# --ci: parallel shards with per-shard databases (~3min on CI hardware).
# --coverage: adds coverage collection + merge to either mode.
#
# Usage:
#   npm run test:e2e                                  # sequential shards
#   npm run test:e2e -- --testPathPatterns "auth"     # sequential shards, filtered
#   npm run test:e2e -- --ci                          # parallel per-shard DBs (CI)
#   npm run test:e2e:cov                              # sequential shards + coverage
#   npm run test:e2e:cov -- --ci                      # parallel + coverage (CI)

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
# Parse flags
# ---------------------------------------------------------------------------
mode="sequential"   # sequential | ci
coverage=false
jest_extra_args=()

for arg in "$@"; do
  case "$arg" in
    --ci)       mode="ci" ;;
    --coverage) coverage=true ;;
    *) jest_extra_args+=("$arg") ;;
  esac
done

# ---------------------------------------------------------------------------
# Load DB config from .env.test
# ---------------------------------------------------------------------------
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/../.env.test"
if [ -f "$ENV_FILE" ]; then
  set -a
  eval "$(grep -E '^(PG_|TOOLJET_DB)' "$ENV_FILE" | grep -v '^#')"
  set +a
fi

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-postgres}"
PG_PASS="${PG_PASS:-postgres}"
PG_DB="${PG_DB:-tooljet_ee_test}"
TOOLJET_DB_NAME="${TOOLJET_DB:-tooljet_db_test}"

export PGPASSWORD="$PG_PASS"

psql_cmd() {
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -v ON_ERROR_STOP=1 "$@" 2>&1
}

# ---------------------------------------------------------------------------
# Pre-reset database
# ---------------------------------------------------------------------------
printf "\033[1m━━━ Pre-reset database ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n"
NODE_ENV=test npx ts-node -r tsconfig-paths/register --transpile-only scripts/truncate-test-db.ts
printf "\n"

# ---------------------------------------------------------------------------
# Shared shard config
# ---------------------------------------------------------------------------
SHARD_JEST_ARGS=(--runInBand --colors --passWithNoTests --forceExit)
[ "$coverage" = true ] && SHARD_JEST_ARGS+=(--coverage)

SHARD_LOG_DIR=$(mktemp -d)
trap 'rm -rf "$SHARD_LOG_DIR"' EXIT

total_passed=0; total_failed=0; total_suites=0
tests_passed=0; tests_failed=0
failed_suites=""
exit_code=0

collect_shard_results() {
  local s=$1
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
}

# ---------------------------------------------------------------------------
# Sequential mode (default): one shard at a time, shared DB
# ---------------------------------------------------------------------------
if [ "$mode" = "sequential" ]; then
  for s in $(seq 1 $SHARDS); do
    printf "\033[1m━━━ Running shard %d/%d ━━━\033[0m\n" "$s" "$SHARDS"

    SKIP_GLOBAL_SETUP=1 NODE_ENV=test NODE_OPTIONS="$NODE_OPTS" npx jest \
      --config "$JEST_CONFIG" --shard="$s/$SHARDS" \
      --coverageDirectory=.coverage/shard-$s \
      "${SHARD_JEST_ARGS[@]}" "${jest_extra_args[@]}" 2>&1 | tee "$SHARD_LOG_DIR/shard-$s.log"

    shard_exit=${PIPESTATUS[0]}
    [ $shard_exit -ne 0 ] && exit_code=1
    collect_shard_results "$s"
  done
fi

# ---------------------------------------------------------------------------
# CI mode: per-shard databases, parallel execution
# ---------------------------------------------------------------------------
if [ "$mode" = "ci" ]; then
  printf "\033[1m━━━ Creating %d shard databases ━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n" "$SHARDS"

  clone_template() {
    local template="$1"
    psql_cmd -d postgres -c "ALTER DATABASE \"$template\" WITH ALLOW_CONNECTIONS = false" > /dev/null 2>&1
    psql_cmd -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$template' AND pid <> pg_backend_pid();" > /dev/null 2>&1
    sleep 0.3
    for s in $(seq 1 $SHARDS); do
      local target="${template}_shard_${s}"
      psql_cmd -d postgres -c "DROP DATABASE IF EXISTS \"$target\"" > /dev/null 2>&1
      if ! psql_cmd -d postgres -c "CREATE DATABASE \"$target\" TEMPLATE \"$template\"" > /dev/null; then
        psql_cmd -d postgres -c "ALTER DATABASE \"$template\" WITH ALLOW_CONNECTIONS = true" > /dev/null 2>&1
        printf "\033[31m  FAILED to clone %s → %s\033[0m\n" "$template" "$target"; exit 1
      fi
    done
    psql_cmd -d postgres -c "ALTER DATABASE \"$template\" WITH ALLOW_CONNECTIONS = true" > /dev/null 2>&1
  }

  shard_dbs=(); shard_tjdbs=()
  clone_template "$PG_DB"
  clone_template "$TOOLJET_DB_NAME"
  for s in $(seq 1 $SHARDS); do
    shard_dbs+=("${PG_DB}_shard_${s}")
    shard_tjdbs+=("${TOOLJET_DB_NAME}_shard_${s}")
    printf "  shard %d: %s + %s\n" "$s" "${shard_dbs[$((s-1))]}" "${shard_tjdbs[$((s-1))]}"
  done
  printf "\n"

  cleanup_shard_dbs() {
    printf "\n\033[2mCleaning up shard databases...\033[0m\n"
    for s in $(seq 1 $SHARDS); do
      psql_cmd -d postgres -c "DROP DATABASE IF EXISTS \"${shard_dbs[$((s-1))]}\"" > /dev/null 2>&1
      psql_cmd -d postgres -c "DROP DATABASE IF EXISTS \"${shard_tjdbs[$((s-1))]}\"" > /dev/null 2>&1
    done
  }
  trap 'rm -rf "$SHARD_LOG_DIR"; cleanup_shard_dbs' EXIT

  pids=()
  for s in $(seq 1 $SHARDS); do
    printf "\033[1m━━━ Launching shard %d/%d ━━━\033[0m\n" "$s" "$SHARDS"
    PG_DB="${shard_dbs[$((s-1))]}" TOOLJET_DB="${shard_tjdbs[$((s-1))]}" \
    SKIP_GLOBAL_SETUP=1 NODE_ENV=test NODE_OPTIONS="$NODE_OPTS" \
    npx jest --config "$JEST_CONFIG" --shard="$s/$SHARDS" \
      --coverageDirectory=.coverage/shard-$s \
      "${SHARD_JEST_ARGS[@]}" "${jest_extra_args[@]}" \
      > "$SHARD_LOG_DIR/shard-$s.log" 2>&1 &
    pids+=($!)
    [ "$s" -lt "$SHARDS" ] && sleep 30
  done

  printf "\nWaiting for %d parallel shards...\n\n" "$SHARDS"

  for i in "${!pids[@]}"; do
    s=$((i + 1))
    wait "${pids[$i]}"
    shard_exit=$?
    [ $shard_exit -ne 0 ] && exit_code=1
    printf "\033[1m━━━ Shard %d/%d (exit %d) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n" "$s" "$SHARDS" "$shard_exit"
    cat "$SHARD_LOG_DIR/shard-$s.log"
    printf "\n"
    collect_shard_results "$s"
  done
fi

# ---------------------------------------------------------------------------
# Merge coverage
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------
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
