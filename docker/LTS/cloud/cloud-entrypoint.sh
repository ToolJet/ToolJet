#!/bin/bash
set -e

npm cache clean --force

if [ -d "./server/dist" ]; then
  SUFFIX=':prod'
else
  SUFFIX=''
fi

if [ -f "./.env" ]; then
  declare $(grep -v '^#' ./.env | xargs)
fi

# MIGRATION_MODE=async: the server runs the backfill in the background with this command, so it holds no plugin steps.
export MIGRATION_SETUP_COMMAND="npm run db:setup$SUFFIX"

if [ -z "$DATABASE_URL" ]; then
  ./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- echo "PostgreSQL is up"
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $6}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $7}')

  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- echo "PostgreSQL is up"
fi

# Plugin steps write to the database, so its schema comes first. Async mode applies only the expand phase here.
if [ "$MIGRATION_MODE" = "async" ]; then
  MIGRATION_PHASE=expand $MIGRATION_SETUP_COMMAND
else
  $MIGRATION_SETUP_COMMAND
fi
npm run "plugins:install$SUFFIX"
npm run "plugins:uninstall$SUFFIX"
npm run "plugins:reload$SUFFIX"

exec "$@"
