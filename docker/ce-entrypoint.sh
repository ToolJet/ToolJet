#!/bin/bash
set -e

if [ -d "./server/dist" ]; then
  SETUP_CMD='npm run db:setup:prod'
else
  SETUP_CMD='npm run db:setup'
fi

if [ -f "./.env" ]; then
  declare $(grep -v '^#' ./.env | xargs)
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
