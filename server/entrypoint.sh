#!/bin/bash
set -e

npm cache clean --force

# Load environment variables from .env if the file exists
if [ -f "./.env" ]; then
  export $(grep -v '^#' ./.env | xargs -d '\n') || true
fi

# Check WORKLOW_WORKER and skip SETUP_CMD if true
if [ "${WORKFLOW_WORKER}" == "true" ]; then
  echo "WORKFLOW_WORKER is set to true. Running worker process."
  npm run worker:prod
else
  # Determine setup command based on the presence of ./server/dist
  if [ -d "./server/dist" ]; then
    SETUP_CMD='npm run db:setup:prod'
  else
    SETUP_CMD='npm run db:setup'
  fi
fi

# Wait for PostgreSQL connection
if [ -z "$DATABASE_URL" ]; then
  ./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- echo "PostgreSQL is up"
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $6}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $7}')

  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- echo "PostgreSQL is up"
fi

# Note: This Redis connection check changes are only for EE repo

# Check Redis connection
if [ -z "$REDIS_URL" ]; then
  if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    echo "Waiting for Redis connection..."
    ./server/scripts/wait-for-it.sh $REDIS_HOST:${REDIS_PORT:-6379} --strict --timeout=300 -- echo "Redis is up"
  else
    echo "Redis connection parameters not set, skipping Redis connection check"
  fi
else
  echo "REDIS_URL connection is set"
fi

# Run setup command if defined
if [ -n "$SETUP_CMD" ]; then
  $SETUP_CMD
fi

exec "$@"
