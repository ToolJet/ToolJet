#!/bin/bash
set -e

npm cache clean --force

if [ -d "./server/dist" ]
then
  SETUP_CMD='npm run db:setup:prod && npm run plugins:install:prod && npm run plugins:uninstall:prod'
else
  SETUP_CMD='npm run db:setup && npm run plugins:install && npm run plugins:uninstall'
fi

npm cache clean --force

if [ -f "./.env" ]
then
  declare $(grep -v '^#' ./.env | xargs) 
fi

if [ -z "$DATABASE_URL" ]
then
  ./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- bash -c "$SETUP_CMD"
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F[@/:] '{print $4}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[@/]' '{split($5,a,":"); print a[2] ? a[2] : "5432"}')
  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- bash -c "$SETUP_CMD"
fi

exec "$@"
