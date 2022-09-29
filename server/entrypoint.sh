#!/bin/bash
set -e

if [ -d "./server/dist" ]
then
  SETUP_CMD='npm run db:setup:prod'
else
  SETUP_CMD='npm run db:setup'
fi

if [ -f "./.env" ]
then
  declare $(grep -v '^#' ./.env)
fi

./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- $SETUP_CMD

exec "$@"
