#!/usr/bin/env bash
# Merges unit + e2e coverage into a combined report.
# Works identically in local and CI — reads from the same paths.
#
# Local:
#   npm test              → coverage-unit/coverage-final.json
#   npm run test:e2e      → coverage-e2e/coverage-final.json
#   npm run test:cov:merge → coverage-combined/
#
# CI:
#   Job 1 uploads coverage-unit/, Job 2 uploads coverage-e2e/
#   Job 3 downloads both, runs: npm run test:cov:merge

set -eo pipefail

MERGE_DIR=".coverage-all"
COMBINED_DIR="coverage-combined"

rm -rf "$MERGE_DIR" "$COMBINED_DIR"
mkdir -p "$MERGE_DIR"

# Collect from known directories
[ -f coverage-unit/coverage-final.json ] && cp coverage-unit/coverage-final.json "$MERGE_DIR/unit.json"
[ -f coverage-e2e/coverage-final.json ] && cp coverage-e2e/coverage-final.json "$MERGE_DIR/e2e.json"

json_count=$(find "$MERGE_DIR" -name '*.json' | wc -l | tr -d ' ')
if [ "$json_count" -eq 0 ]; then
  printf "\033[31mNo coverage files found.\033[0m\n"
  printf "Run npm test and npm run test:e2e first.\n"
  exit 1
fi

printf "\033[1m━━━ Merging %s coverage file(s) ━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n\n" "$json_count"

mkdir -p "$MERGE_DIR/merged"
npx nyc merge "$MERGE_DIR" "$MERGE_DIR/merged/coverage-final.json"
npx nyc report \
  --temp-dir "$MERGE_DIR/merged" \
  --reporter=html --reporter=lcov --reporter=json \
  --report-dir="$COMBINED_DIR" \
  --exclude='test/**' \
  --exclude='migrations/**' \
  --exclude='data-migrations/**' \
  --exclude='dist/**'

rm -rf "$MERGE_DIR"

printf "\n\033[32mCombined report: %s/index.html\033[0m\n" "$COMBINED_DIR"
printf "\033[32mlcov:           %s/lcov.info\033[0m\n" "$COMBINED_DIR"
echo ""
