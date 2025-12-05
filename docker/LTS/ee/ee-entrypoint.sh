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

# Start embedded SeaweedFS if enabled and storage backend is seaweed
if [ "${STORAGE_BACKEND:-seaweed}" = "seaweed" ] && [ "${SEAWEED_EMBEDDED:-true}" = "true" ]; then
  echo "Starting embedded SeaweedFS..."

  # Ensure data directory exists (in case volume mount doesn't preserve it)
  mkdir -p "${SEAWEED_DIR:-/data/seaweedfs}"

  # Create S3 configuration for anonymous access (Phase 1)
  cat > /tmp/seaweedfs-s3.json <<'EOF'
{
  "identities": [
    {
      "name": "anonymous",
      "credentials": [
        {
          "accessKey": "any",
          "secretKey": "any"
        }
      ],
      "actions": [
        "Admin",
        "Read",
        "Write"
      ]
    }
  ]
}
EOF

  # Start SeaweedFS server with all components
  weed server \
    -dir="${SEAWEED_DIR:-/data/seaweedfs}" \
    -master.port="${SEAWEED_MASTER_PORT:-9333}" \
    -volume.port="${SEAWEED_VOLUME_PORT:-8080}" \
    -filer=true \
    -filer.port="${SEAWEED_FILER_PORT:-8888}" \
    -s3 \
    -s3.port="${SEAWEED_S3_PORT:-8333}" \
    -s3.config=/tmp/seaweedfs-s3.json \
    -ip.bind=127.0.0.1 \
    > /tmp/seaweedfs.log 2>&1 &

  SEAWEED_PID=$!

  # Wait for S3 API to be ready (critical for ToolJet startup)
  echo "Waiting for SeaweedFS S3 API to be ready..."
  max_attempts=30
  attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${SEAWEED_S3_PORT:-8333}" | grep -q "200\|301\|302\|403"; then
      echo "SeaweedFS S3 API is ready on port ${SEAWEED_S3_PORT:-8333}"
      break
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  if [ $attempt -eq $max_attempts ]; then
    echo "Warning: SeaweedFS S3 API did not become ready within 30 seconds"
    echo "Checking SeaweedFS logs:"
    tail -20 /tmp/seaweedfs.log
  fi

  echo "SeaweedFS started with PID $SEAWEED_PID"
else
  echo "Embedded SeaweedFS disabled. Expecting external object storage configuration."
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
