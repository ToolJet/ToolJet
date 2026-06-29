#!/usr/bin/env bash
# Detects changed server modules and runs their Jest tests.
# Usage: scripts/test-changed.sh [--e2e]
#
# --e2e   Also run e2e tests (sequential shards + CI mode via run-e2e.sh).
#         Omit for local pre-push (unit only).
#
# Fallback: cross-cutting changes (helpers/entities/dto/lib) → run all tests.
# Known gap: server/test/ee/ specs not matched by unit testRegex; changes to
#   server/ee/{X} run test/modules/{X}/ only.

set -euo pipefail

RUN_E2E=false
for arg in "$@"; do
  [[ "$arg" == "--e2e" ]] && RUN_E2E=true
done

ROOT=$(git rev-parse --show-toplevel)
SERVER_DIR="$ROOT/server"

# Resolve merge base against origin/main; fall back to running everything.
if ! MERGE_BASE=$(git merge-base HEAD origin/main 2>/dev/null); then
  echo "warn: could not resolve merge base with origin/main — running all server unit tests"
  RUN_ALL=true
  SERVER_FILES=""
else
  ALL_CHANGED=$(git diff --name-only "$MERGE_BASE" HEAD)
  SERVER_FILES=$(echo "$ALL_CHANGED" | grep "^server/" || true)
fi

RUN_ALL="${RUN_ALL:-false}"

if [[ -z "${SERVER_FILES:-}" && "$RUN_ALL" != "true" ]]; then
  echo "No server files changed — skipping."
  exit 0
fi

MODULES=()

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    server/src/modules/*)
      mod=$(echo "$file" | sed 's|server/src/modules/\([^/]*\)/.*|\1|')
      MODULES+=("$mod")
      ;;
    server/ee/*)
      mod=$(echo "$file" | sed 's|server/ee/\([^/]*\)/.*|\1|')
      MODULES+=("$mod")
      ;;
    server/src/helpers/*|server/src/entities/*|server/src/dto/*|server/lib/*)
      echo "Cross-cutting change in: $file"
      RUN_ALL=true
      ;;
  esac
done <<< "${SERVER_FILES:-}"

UNIQUE_MODULES=()
if [[ ${#MODULES[@]} -gt 0 ]]; then
  while IFS= read -r line; do
    UNIQUE_MODULES+=("$line")
  done < <(printf '%s\n' "${MODULES[@]}" | sort -u)
fi

if [[ "$RUN_ALL" == "true" ]] || [[ ${#UNIQUE_MODULES[@]} -eq 0 ]]; then
  PATTERN=""
  echo "Running all server unit tests"
else
  MODULE_REGEX=$(IFS='|'; echo "${UNIQUE_MODULES[*]}")
  PATTERN="test/modules/(${MODULE_REGEX})/"
  echo "Changed modules: ${UNIQUE_MODULES[*]}"
fi

cd "$SERVER_DIR"

echo "--- Unit tests ---"
if [[ -n "$PATTERN" ]]; then
  npm run test -- --testPathPattern="$PATTERN"
else
  npm run test
fi

if [[ "$RUN_E2E" == "true" ]]; then
  echo "--- E2e tests ---"
  if [[ -n "$PATTERN" ]]; then
    npm run test:e2e -- --testPathPatterns "$PATTERN" --ci
  else
    npm run test:e2e -- --ci
  fi
fi
