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
#   One job (test-server) runs unit then e2e sequentially, in that order, then
#   calls this same script — same paths as local, no artifact round-trip needed.

set -eo pipefail

COMBINED_DIR="coverage-combined"

if [ ! -f coverage-unit/coverage-final.json ] && [ ! -f coverage-e2e/coverage-final.json ]; then
  printf "\033[31mNo coverage files found.\033[0m\n"
  printf "Run npm test and npm run test:e2e first.\n"
  exit 1
fi

node scripts/merge-coverage.mjs --out "$COMBINED_DIR" coverage-unit coverage-e2e

printf "\n\033[32mCombined report: %s/index.html\033[0m\n" "$COMBINED_DIR"
printf "\033[32mlcov:           %s/lcov.info\033[0m\n" "$COMBINED_DIR"
echo ""
