#!/usr/bin/env bash
# Detects changed server modules and runs their Jest tests (unit + e2e).
# Usage: scripts/test-changed.sh
#
# Fallback: cross-cutting changes (helpers/entities/dto/lib) → run all tests.
# NODE_ENV=test is set by the npm scripts themselves (server/package.json,
# run-e2e.sh) — no env needed from the caller.

set -euo pipefail

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

unit_args=()
e2e_args=(--ci)
if [[ -n "$PATTERN" ]]; then
  unit_args+=(--testPathPatterns="$PATTERN")
  e2e_args+=(--testPathPatterns "$PATTERN")
fi
if [[ "${CI:-}" == "true" ]]; then
  unit_args+=(--json --outputFile /tmp/tj-unit-results.json)
  mkdir -p /tmp/tj-e2e-json
  e2e_args+=(--json-output-dir /tmp/tj-e2e-json)
fi

# ${arr[@]+...} guard: empty-array expansion breaks under set -u on bash 3.2 (macOS)
echo "--- Unit tests ---"
npm run test -- ${unit_args[@]+"${unit_args[@]}"}

echo "--- E2e tests ---"
npm run test:e2e -- "${e2e_args[@]}"
