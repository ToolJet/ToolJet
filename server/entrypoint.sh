#!/bin/sh
set -e

if [ -d "./server/dist" ]
then
    ./scripts/wait-for-it.sh $PG_HOST:$PG_PORT --strict --timeout=300 -- npm run db:setup:prod
else
    ./scripts/wait-for-it.sh $PG_HOST:$PG_PORT --strict --timeout=300 -- npm run db:setup
fi

exec "$@"
