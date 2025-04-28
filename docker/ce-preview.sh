#!/bin/bash
set -e

service postgresql start

# NEW: Wait until Postgres actually accepts connections
until pg_isready -h "$PG_HOST" -p "${PG_PORT:-5432}" -U postgres; do
  echo "Waiting for postgres to be ready..."
  sleep 2
done

# Now safe to run DB setup

# Check if the role exists
# if ! PGPASSWORD="$PG_PASS" psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='${PG_USER}'" | grep -q 1; then
#   echo "Creating role ${PG_USER} with password from PG_PASS env variable..."
#   PGPASSWORD="$PG_PASS" psql -U postgres -c "CREATE ROLE ${PG_USER} WITH LOGIN SUPERUSER PASSWORD '${PG_PASS}';"
# fi

if [ -d "./server/dist" ]; then
  SETUP_CMD='npm run db:setup:prod'
else
  SETUP_CMD='npm run db:setup'
fi

if [ -f "./.env" ]; then
  export $(grep -v '^#' ./.env | xargs)
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
