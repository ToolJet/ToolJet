#!/bin/sh
set -e
# bundle check || bundle install
npm run db:create
npm run db:migrate

exec "$@"
