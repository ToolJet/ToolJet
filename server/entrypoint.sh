#!/bin/sh
set -e

npm run db:create
npm run db:migrate
npm run db:seed

exec "$@"
