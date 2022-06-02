#!/bin/sh
set -e

if [ -d "./server/dist" ]
then
    npm run db:setup:prod
else
    npm run db:setup
fi

exec "$@"
