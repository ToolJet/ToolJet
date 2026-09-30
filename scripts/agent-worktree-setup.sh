#!/usr/bin/env bash
# Bootstrap a git worktree so an agent can run server tests in it.
# Usage (from the worktree root):
#   scripts/agent-worktree-setup.sh [--frontend]   # set up deps + isolated test DBs
#   scripts/agent-worktree-setup.sh --drop         # drop this worktree's test DBs
#
# Writes only .env.test (never .env): server/scripts/database-config-utils.ts merges
# ../.env over process.env, and NODE_ENV=test db:migrate is a no-op (ormconfig sets
# migrations: [] under test). With no .env, `NODE_ENV='' db:setup` reads the exported vars.
# No ports, no dev servers.

set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
cd "$ROOT"

[[ "$ROOT" == "$MAIN" ]] && { echo "error: run inside a worktree, not the main checkout ($MAIN)" >&2; exit 1; }
[[ -f .env ]] && { echo "error: $ROOT/.env exists and would override .env.test; remove it" >&2; exit 1; }
SRC="$MAIN/.env.test"
[[ -f "$SRC" ]] || SRC="$MAIN/.env"
[[ -f "$SRC" ]] || { echo "error: no $MAIN/.env.test or .env (source of DB credentials)" >&2; exit 1; }
command -v createdb >/dev/null || { echo "error: createdb not on PATH (install Postgres client tools)" >&2; exit 1; }

slug=$(git branch --show-current | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '_' | cut -c1-40)
PG_DB="tooljet_${slug}_test"
TOOLJET_DB="tooljet_db_${slug}_test"

# shellcheck source=/dev/null
load_env() { set -a; . ./.env.test; set +a; }

if [[ "${1:-}" == "--drop" ]]; then
  load_env
  (cd server && NODE_ENV='' npm run db:drop -- "$PG_DB" && NODE_ENV='' npm run db:drop -- "$TOOLJET_DB")
  exit 0
fi

git submodule update --init --recursive

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

echo "ready: PG_DB=$PG_DB TOOLJET_DB=$TOOLJET_DB (.env.test)"
