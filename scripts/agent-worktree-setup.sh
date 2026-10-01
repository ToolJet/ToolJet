#!/usr/bin/env bash
# Bootstrap a git worktree so an agent can run server tests in it.
# Usage (from the worktree root, on a named branch):
#   scripts/agent-worktree-setup.sh [--frontend]   # submodules + deps + isolated test DBs
#   scripts/agent-worktree-setup.sh --drop         # drop this worktree's test DBs
#
# Submodules are cloned from the main checkout's local module repos, so unpushed EE
# stack branches are visible (as origin/<branch>). EE commits made here are fetched
# back by the main session: git -C server/ee fetch <worktree>/server/ee <branch>:<branch>
#
# Writes only .env.test (never .env): server/scripts/database-config-utils.ts merges
# ../.env over process.env, and NODE_ENV=test db:migrate is a no-op (ormconfig sets
# migrations: [] under test). With no .env, `NODE_ENV='' db:setup` reads exported vars.

set -euo pipefail

die() { echo "error: $*" >&2; exit 1; }

[[ -z "$(git rev-parse --show-superproject-working-tree)" ]] || die "run from the ToolJet root worktree, not a submodule"
ROOT=$(git rev-parse --show-toplevel)
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
cd "$ROOT"

[[ "$ROOT" != "$MAIN" ]] || die "run inside a worktree, not the main checkout ($MAIN)"
[[ ! -f .env ]] || die "$ROOT/.env exists and would override .env.test; remove it"
BRANCH=$(git branch --show-current)
[[ -n "$BRANCH" ]] || die "detached HEAD; check out a named branch so test DB names are unique"

# <= 30-char slug + branch hash: unique per branch, and tooljet_db_<slug>_<hash>_test_shard_N
# (run-e2e.sh --ci) stays under Postgres' 63-char identifier limit.
hash=$(printf '%s' "$BRANCH" | git hash-object --stdin | cut -c1-6)
slug=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_' | cut -c1-30)
PG_DB="tooljet_${slug}_${hash}_test"
TOOLJET_DB="tooljet_db_${slug}_${hash}_test"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck source=/dev/null
if [[ -s "$NVM_DIR/nvm.sh" ]]; then . "$NVM_DIR/nvm.sh" && nvm use >/dev/null; fi
want=$(sed 's/[[:space:]#].*//' .nvmrc)
[[ "$(node -v)" == "$want" ]] || die "node $(node -v) but .nvmrc wants $want"

# dotenv-compatible export: values are never shell-interpreted ($, quotes, backticks stay literal)
load_env() {
  [[ -f .env.test ]] || die "$ROOT/.env.test missing; run setup first"
  local kv
  # shellcheck disable=SC2016  # JS template literal, not shell
  while IFS= read -r -d '' kv; do export "${kv?}"; done < <(cd server && node -e '
    const d = require("dotenv").parse(require("fs").readFileSync("../.env.test"));
    for (const [k, v] of Object.entries(d)) process.stdout.write(`${k}=${v}\0`);
  ')
  [[ -n "${PG_HOST:-}" ]] || die "could not load PG_HOST from .env.test"
}

if [[ "${1:-}" == "--drop" ]]; then
  load_env
  (cd server && NODE_ENV='' npm run db:drop -- "$PG_DB" && NODE_ENV='' npm run db:drop -- "$TOOLJET_DB")
  exit 0
fi

SRC="$MAIN/.env.test"
[[ -f "$SRC" ]] || SRC="$MAIN/.env"
[[ -f "$SRC" ]] || die "no $MAIN/.env.test or .env (source of DB credentials)"
command -v createdb >/dev/null || die "createdb not on PATH (install Postgres client tools)"

for sm in server/ee frontend/ee; do
  git -c protocol.file.allow=always -c "submodule.$sm.url=$MAIN/.git/modules/$sm" submodule update --init "$sm"
  if git -C "$sm" rev-parse -q --verify "origin/$BRANCH" >/dev/null; then
    git -C "$sm" checkout -q -B "$BRANCH" "origin/$BRANCH"
  fi
done

grep -vE '^(PG_DB|TOOLJET_DB)=' "$SRC" > .env.test
printf 'PG_DB=%s\nTOOLJET_DB=%s\n' "$PG_DB" "$TOOLJET_DB" >> .env.test

dirs=(server plugins)
[[ "${1:-}" == "--frontend" ]] && dirs+=(frontend)
pids=()
for d in "${dirs[@]}"; do (cd "$d" && npm ci --prefer-offline) & pids+=($!); done
for p in "${pids[@]}"; do wait "$p"; done

(cd plugins && npm run build)

load_env
(cd server && NODE_ENV='' npm run db:setup)

echo "ready: branch=$BRANCH PG_DB=$PG_DB TOOLJET_DB=$TOOLJET_DB"
