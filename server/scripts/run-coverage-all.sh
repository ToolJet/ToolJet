#!/usr/bin/env bash
# Runs both unit and e2e suites with coverage, then merges into a combined report.
#
# Coverage exclusions are defined in jest.config.ts and test/jest-e2e.config.ts
# (collectCoverageFrom + coveragePathIgnorePatterns). This script relies on those
# configs — it does NOT pass --collectCoverageFrom on the CLI.
#
# Output:
#   coverage-unit/       — unit-only report
#   coverage/            — e2e-only report
#   coverage-combined/   — merged report (both suites)
#
# Usage:
#   npm run test:cov                              # full run
#   npm run test:cov -- --testPathPatterns "auth"  # filter (applies to both)

set -eo pipefail

MERGE_DIR=".coverage-all"
COMBINED_DIR="coverage-combined"
NODE_OPTS="--max-old-space-size=8192"

rm -rf "$MERGE_DIR" "$COMBINED_DIR" coverage-unit

mkdir -p "$MERGE_DIR"

# ── Unit tests ────────────────────────────────────────────────────────
printf "\n\033[1m━━━ Unit tests (with coverage) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n"

NODE_ENV=test NODE_OPTIONS="$NODE_OPTS" npx jest \
  --config jest.config.ts --verbose --forceExit \
  --coverage --coverageDirectory=coverage-unit \
  "$@" || true

if [ -f coverage-unit/coverage-final.json ]; then
  cp coverage-unit/coverage-final.json "$MERGE_DIR/unit.json"
  printf "\033[32mUnit coverage saved.\033[0m\n"
else
  printf "\033[33mWarning: no unit coverage data produced.\033[0m\n"
fi

# ── E2E tests ─────────────────────────────────────────────────────────
printf "\n\033[1m━━━ E2E tests (with coverage) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n"

bash ./scripts/run-e2e.sh --coverage "$@" || true

if [ -f coverage/coverage-final.json ]; then
  cp coverage/coverage-final.json "$MERGE_DIR/e2e.json"
  printf "\033[32mE2E coverage saved.\033[0m\n"
else
  printf "\033[33mWarning: no e2e coverage data produced.\033[0m\n"
fi

# ── Merge ─────────────────────────────────────────────────────────────
json_count=$(find "$MERGE_DIR" -name '*.json' | wc -l | tr -d ' ')
if [ "$json_count" -eq 0 ]; then
  printf "\033[31mNo coverage data from either suite. Nothing to merge.\033[0m\n"
  exit 1
fi

printf "\n\033[1m━━━ Combined coverage (%s suite(s)) ━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n" "$json_count"

mkdir -p "$MERGE_DIR/merged"
npx nyc merge "$MERGE_DIR" "$MERGE_DIR/merged/coverage-final.json"

# Generate merged report — exclude non-source files that might leak in
npx nyc report \
  --temp-dir "$MERGE_DIR/merged" \
  --reporter=text --reporter=html --reporter=lcov --reporter=json \
  --report-dir="$COMBINED_DIR" \
  --exclude='test/**' \
  --exclude='migrations/**' \
  --exclude='data-migrations/**' \
  --exclude='dist/**'

rm -rf "$MERGE_DIR"

printf "\n\033[32mReports:\033[0m\n"
printf "  Unit only:  coverage-unit/index.html\n"
printf "  E2E only:   coverage/index.html\n"
printf "  Combined:   %s/index.html\n" "$COMBINED_DIR"
printf "  lcov:       %s/lcov.info (CI integration)\n" "$COMBINED_DIR"
echo ""
