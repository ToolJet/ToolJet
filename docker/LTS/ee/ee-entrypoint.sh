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
  redis-server /etc/redis/redis.conf &
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

# Check for Python and nsjail availability
if command -v nsjail >/dev/null 2>&1; then
  echo ""
  echo "🐍 Python execution is available"
  echo "   Python: $(python3 --version 2>&1)"
  echo "   nsjail: $(nsjail --version 2>&1 | head -1)"
  echo ""
  echo "🔍 Detecting Python security mode..."

  # Check for CAP_SYS_ADMIN capability
  if capsh --print 2>/dev/null | grep -q "cap_sys_admin"; then
    export PYTHON_SECURITY_MODE="${PYTHON_SECURITY_MODE:-full}"
    echo "   ✅ FULL mode: CAP_SYS_ADMIN detected"
  # Check for unprivileged user namespaces
  elif unshare --user --map-root-user echo ok >/dev/null 2>&1; then
    export PYTHON_SECURITY_MODE="${PYTHON_SECURITY_MODE:-userns}"
    echo "   ✅ USERNS mode: Unprivileged namespaces available"
  else
    export PYTHON_SECURITY_MODE="${PYTHON_SECURITY_MODE:-basic}"
    echo "   ⚠️  BASIC mode: Limited isolation (no filesystem protection)"
    echo "       For better security, enable unprivileged_userns_clone or add CAP_SYS_ADMIN"
  fi

  echo "   Security Mode: ${PYTHON_SECURITY_MODE}"
  echo "   Memory Limit: ${PYTHON_MEMORY_LIMIT_MB:-128}MB"
  echo "   Timeout: ${PYTHON_TIMEOUT_SECONDS:-10}s"
  echo ""
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
