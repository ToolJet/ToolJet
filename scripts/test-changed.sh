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

# Resolve merge base against the PR base branch (or main as local fallback).
BASE_BRANCH="${BASE_BRANCH:-main}"
if ! MERGE_BASE=$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null); then
  echo "warn: could not resolve merge base with origin/${BASE_BRANCH} — running all server unit tests"
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
    server/test/modules/*)
      mod=$(echo "$file" | sed 's|server/test/modules/\([^/]*\)/.*|\1|')
      MODULES+=("$mod")
      ;;
    server/test/ee/*)
      # test/ee specs aren't matched by the per-module unit regex — run everything
      echo "EE test change in: $file"
      RUN_ALL=true
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
  if [[ "${CI:-}" == "true" ]]; then
    npm run test -- --testPathPatterns="$PATTERN" --json --outputFile /tmp/tj-unit-results.json
  else
    npm run test -- --testPathPatterns="$PATTERN"
  fi
else
  if [[ "${CI:-}" == "true" ]]; then
    npm run test -- --json --outputFile /tmp/tj-unit-results.json
  else
    npm run test
  fi
fi

if [[ "$RUN_E2E" == "true" ]]; then
  echo "--- E2e tests ---"
  if [[ -n "$PATTERN" ]]; then
    if [[ "${CI:-}" == "true" ]]; then
      mkdir -p /tmp/tj-e2e-json
      npm run test:e2e -- --testPathPatterns "$PATTERN" --ci --json-output-dir /tmp/tj-e2e-json
    else
      npm run test:e2e -- --testPathPatterns "$PATTERN" --ci
    fi
  else
    if [[ "${CI:-}" == "true" ]]; then
      mkdir -p /tmp/tj-e2e-json
      npm run test:e2e -- --ci --json-output-dir /tmp/tj-e2e-json
    else
      npm run test:e2e -- --ci
    fi
  fi
fi
