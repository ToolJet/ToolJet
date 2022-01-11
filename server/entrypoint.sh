#!/bin/sh
set -e

npm run db:create
npm run db:migrate

exec "$@"
