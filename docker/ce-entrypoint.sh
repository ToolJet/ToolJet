#!/bin/bash
set -e

if [ -f "./.env" ]; then
  export $(grep -v '^#' ./.env | xargs -d '\n') || true
fi

# Start Redis if not already running (bundled sidecar for single-instance CE)
if { [ -z "$REDIS_HOST" ] || [ "$REDIS_HOST" = "localhost" ]; } && ! pgrep -x redis-server > /dev/null 2>&1; then
  # Bundled Redis is loopback-only; a random per-boot password stops data sources pointed at localhost from reaching it
  export REDIS_PASSWORD="${REDIS_PASSWORD:-$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
  REDIS_AUTH_CONF=$(mktemp)
  chmod 600 "$REDIS_AUTH_CONF"
  printf 'include %s\nrequirepass %s\n' "/app/redis.conf" "$REDIS_PASSWORD" > "$REDIS_AUTH_CONF"
  redis-server "$REDIS_AUTH_CONF"
  echo "Redis started"
fi

if [ -d "./server/dist" ]; then
  SETUP_CMD='npm run db:setup:prod'
else
  SETUP_CMD='npm run db:setup'
fi

# MIGRATION_MODE=async: the server runs migrations itself, in the background.
export MIGRATION_SETUP_COMMAND="$SETUP_CMD"
if [ "$MIGRATION_MODE" = "async" ]; then
  SETUP_CMD=true
fi

if [ -f "./.env" ]; then
  declare $(grep -v '^#' ./.env | xargs)
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
