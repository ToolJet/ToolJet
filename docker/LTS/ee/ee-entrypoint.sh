#!/bin/bash
set -e

npm cache clean --force

# Load environment variables from .env if the file exists
if [ -f "./.env" ]; then
  export $(grep -v '^#' ./.env | xargs -d '\n') || true
fi

# Start Redis server only if REDIS_HOST is localhost or not set
if [ -z "$REDIS_HOST" ] || [ "$REDIS_HOST" = "localhost" ]; then
  echo "Starting Redis server locally..."

  REDIS_STARTED=false

  # Try to start Redis with custom BullMQ-optimized config if it exists
  if [ -f /etc/redis/redis.conf ]; then
    redis-server /etc/redis/redis.conf >> /var/log/redis/redis.log 2>&1 &
    REDIS_PID=$!

    # Give Redis a moment to start
    sleep 2

    # Check if Redis started successfully with custom config
    if ./server/scripts/wait-for-it.sh "localhost:6379" --strict --timeout=10 -- echo "Redis is up" 2>/dev/null; then
      echo "Redis started successfully"
      REDIS_STARTED=true
    else
      echo "Warning: Redis failed to start, falling back to default configuration"
      # Kill the failed Redis process if it's still running
      kill $REDIS_PID 2>/dev/null || true
      sleep 1
    fi
  else
    echo "Warning: Redis configuration file not found at /etc/redis/redis.conf"
    echo "Falling back to default Redis configuration"
  fi

  # Fallback: Start Redis with default configuration
  if [ "$REDIS_STARTED" = false ]; then
    echo "Starting Redis with default configuration..."
    redis-server --daemonize no >> /var/log/redis/redis.log 2>&1 &
    REDIS_PID=$!

    # Wait for Redis to be ready with default config
    if ! ./server/scripts/wait-for-it.sh "localhost:6379" --strict --timeout=30 -- echo "Redis is up"; then
      echo "Error: Redis failed to start even with default configuration"
      exit 1
    fi

    echo "Redis started successfully with default config (PID: $REDIS_PID)"
    echo "WARNING: Running without BullMQ optimizations (no AOF persistence, default eviction policy)"
  fi
elif [ -n "$REDIS_URL" ]; then
  echo "REDIS_URL connection is set: $REDIS_URL"
else
  echo "Using external Redis at $REDIS_HOST:$REDIS_PORT."

  # Validate external Redis connection
  if ! ./server/scripts/wait-for-it.sh "$REDIS_HOST:${REDIS_PORT:-6379}" --strict --timeout=300 -- echo "Redis is up"; then
    echo "Error: Unable to connect to Redis at $REDIS_HOST:$REDIS_PORT."
    exit 1
  fi
fi

# Check if PGRST_HOST starts with "localhost"
if [[ "$PGRST_HOST" == localhost:* ]]; then
  echo "Starting PostgREST server locally..."

  # Generate PostgREST configuration in a writable directory
  POSTGREST_CONFIG_PATH="/tmp/postgrest.conf"

  echo "db-uri = \"${PGRST_DB_URI}\"" > "$POSTGREST_CONFIG_PATH"
  echo "db-pre-config = \"postgrest.pre_config\"" >> "$POSTGREST_CONFIG_PATH"
  echo "server-port = \"${PGRST_SERVER_PORT}\"" >> "$POSTGREST_CONFIG_PATH"

  # Starting PostgREST
  echo "Starting PostgREST..."
  postgrest "$POSTGREST_CONFIG_PATH" &
else
  echo "Using external PostgREST at $PGRST_HOST."
fi

# Determine setup command based on the presence of ./server/dist
if [ -d "./server/dist" ]; then
  SETUP_CMD='npm run db:setup:prod'
else
  SETUP_CMD='npm run db:setup'
fi

# Wait for PostgreSQL connection
if [ -z "$DATABASE_URL" ]; then
  ./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- echo "PostgreSQL is up"
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $6}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $7}')

  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- echo "PostgreSQL is up"
fi

# Run setup command if defined
if [ -n "$SETUP_CMD" ]; then
  $SETUP_CMD
fi

exec "$@"
