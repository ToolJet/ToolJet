#!/bin/bash
set -e

npm cache clean --force

if [ -d "./server/dist" ]; then
  SETUP_CMD='npm run cloud:setup:prod'
else
  SETUP_CMD='npm run cloud:setup'
fi

npm cache clean --force

if [ -f "./.env" ]; then
  declare $(grep -v '^#' ./.env | xargs)
fi

# MIGRATION_MODE=async: the server runs migrations itself, in the background.
export MIGRATION_SETUP_COMMAND="$SETUP_CMD"
if [ "$MIGRATION_MODE" = "async" ]; then
  SETUP_CMD=true
fi

if [ -z "$DATABASE_URL" ]; then
  ./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- $SETUP_CMD
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $6}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $7}')

  if [ -z "$DATABASE_PORT" ]; then
    DATABASE_PORT="5432"
  fi

  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- $SETUP_CMD
fi

exec "$@"
