#!/usr/bin/env bash
# Coverage gate for full run-ci PR runs: prints the PR-comment section (render-coverage.mjs),
# exits 1 when the gate fails.
#
# Env:
#   CI_RESULTS   dir with downloaded artifacts: coverage/, lcov/{server,gitsync}.info + pr.diff
#   BASE_REF     base branch; baseline = its latest push run with a coverage-summary artifact
#   GH_TOKEN, GH_REPO — for the baseline lookup
#   DIFF_COVER   diff-cover command (default: pinned via pipx)

set -uo pipefail
R="${CI_RESULTS:-/tmp/ci-results}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -n "${BASE_REF:-}" ] && [ ! -f "$R/base/coverage-summary.json" ]; then
  for id in $(gh run list --workflow ci.yml --branch "$BASE_REF" --event push --limit 20 \
                --json databaseId -q '.[].databaseId' 2>/dev/null); do
    gh run download "$id" -n coverage-summary -D "$R/base" >/dev/null 2>&1 && break
  done
fi

# git-sync lines are only exercised by the git-sync suite — a missing report would read
# them as uncovered, so both reports are required (render fails on missing patch.json).
if [ -f "$R/lcov/server.info" ] && [ -f "$R/lcov/gitsync.info" ] && [ -f "$R/lcov/pr.diff" ]; then
  # lcov paths are rooted at each job's workspace; diff-cover needs them repo-relative
  for f in "$R/lcov/server.info" "$R/lcov/gitsync.info"; do
    sed -E -e 's#^SF:.*/server/(src|ee)/#SF:server/\1/#' -e 's#^SF:(src|ee)/#SF:server/\1/#' "$f" > "$f.rel"
  done
  ${DIFF_COVER:-pipx run diff-cover==10.5.1} "$R/lcov/server.info.rel" "$R/lcov/gitsync.info.rel" \
    --diff-file "$R/lcov/pr.diff" --format "json:$R/patch.json" -q >&2 || true
fi

node "$SCRIPT_DIR/render-coverage.mjs"
