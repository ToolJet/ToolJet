#!/bin/bash
set -e

if [[ "$NODE_ENV" = "test" || "$NODE_ENV" = "development" ]]
then
  if [ "$NODE_ENV" = "test" ]
  then
    if [ -f "./.env.test" ]
    then
      declare $(grep -v '^#' ./.env.test | xargs)
    else
      printf '%s\n' "Test mode requires .env.test file at the root" >&2
      exit 1
    fi
  else
    if [ -f "./.env" ]
    then
      declare $(grep -v '^#' ./.env | xargs) 
    else
      printf '%s\n' "development mode requires .env file at the root" >&2
      exit 1
    fi
  fi

  SETUP_CMD='npm run db:setup'
else
  if ! [ -d "./server/dist" ]
  then
    printf '%s\n' "app needs to be built to generate 'dist' before running prod mode" >&2
    exit 1
  fi

  SETUP_CMD='npm run db:setup:prod'
fi

./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- $SETUP_CMD

exec "$@"
