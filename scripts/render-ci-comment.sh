#!/usr/bin/env bash
# Renders the CI PR comment (full or changed lane) to stdout.
#
# Usage: render-ci-comment.sh full|changed
# Env:
#   SHA, RUN_URL, VERDICT              — always
#   BASE_REF, SCOPE                    — changed lane
#   RESULT_BUILD_{SERVER,PLUGINS,FRONTEND,MARKETPLACE}
#   RESULT_UNIT, RESULT_E2E, RESULT_CYPRESS_{PLATFORM,MARKETPLACE}  — full lane
#   RESULT_CHANGED                     — changed lane
#   UNIT_JSON, E2E_JSON_DIR, UNIT_STEP_URL, E2E_STEP_URL — for render-failed-tests.mjs

set -euo pipefail
MODE="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

icon() {
  case "$1" in
    success)   echo "✅";;
    skipped)   echo "⏭️";;
    failure)   echo "❌";;
    cancelled) echo "🚫";;
    *)         echo "❓";;
  esac
}
# icon alone means passed; a word appears only when it adds info
cell() {
  if [ "$1" = "success" ]; then icon "$1"; else echo "$(icon "$1") $1"; fi
}
# test row: jest counts + step link when results exist, job-result cell otherwise
row() {
  local rendered
  rendered=$(node "$SCRIPT_DIR/render-failed-tests.mjs" row "$1" || true)
  if [ -n "$rendered" ]; then echo "$rendered"; else cell "$2"; fi
}

if [ "$MODE" = "full" ]; then
  echo "<!-- ci-gate-comment -->"
  echo "### CI — [\`${SHA:0:7}\`](${RUN_URL})"
else
  echo "<!-- ci-fast-comment -->"
  echo "### CI — Changes only · [\`${SHA:0:7}\`](${RUN_URL})"
  echo "**Scope:** ${SCOPE:-not recorded} · diffed against \`${BASE_REF:-?}\`"
fi
echo
echo "| Step | Result |"
echo "|------|--------|"
echo "| **Lint & Build** | $(icon "$RESULT_BUILD_SERVER") server · $(icon "$RESULT_BUILD_PLUGINS") plugins · $(icon "$RESULT_BUILD_FRONTEND") frontend · $(icon "$RESULT_BUILD_MARKETPLACE") marketplace |"
if [ "$MODE" = "full" ]; then
  echo "| **Unit tests** | $(row unit "$RESULT_UNIT") |"
  echo "| **E2E tests** | $(row e2e "$RESULT_E2E") |"
  echo "| **Cypress — Platform** | $(cell "$RESULT_CYPRESS_PLATFORM") |"
  echo "| **Cypress — Marketplace** | $(cell "$RESULT_CYPRESS_MARKETPLACE") |"
else
  echo "| **Unit tests** | $(row unit "$RESULT_CHANGED") |"
  echo "| **E2E tests** | $(row e2e "$RESULT_CHANGED") |"
fi
echo

details=$(node "$SCRIPT_DIR/render-failed-tests.mjs" details || true)
if [ -n "$details" ]; then
  echo "$details"
  echo
fi

if [ "$MODE" = "full" ]; then
  if [ "${VERDICT:-}" = "pass" ]; then
    echo "✅ **Mergeable** — \`CI Gate\` status set on this commit."
  else
    echo "❌ **Not mergeable** — fix the failures, push, then re-add \`run-ci\`."
  fi
  echo
  echo "<sub>Full pipeline — required to merge into protected branches. Valid for this commit only.</sub>"
else
  echo "<sub>Changed scope only — merging still requires a green \`run-ci\`.</sub>"
fi
