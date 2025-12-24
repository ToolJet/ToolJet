#!/bin/bash
set -e

# Default to CE edition if not specified
TOOLJET_EDITION=${TOOLJET_EDITION:-ce}
export TOOLJET_EDITION

echo "Starting ToolJet in ${TOOLJET_EDITION} mode..."

# Load environment variables from .env if the file exists
if [ -f "./.env" ]; then
  export $(grep -v '^#' ./.env | xargs -d '\n') || true
fi

# For development, we expect Redis and PostgREST to run as separate services
# Check connectivity to external services

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
if [ -z "$DATABASE_URL" ]; then
  ./server/scripts/wait-for-it.sh ${PG_HOST:-postgres}:${PG_PORT:-5432} --strict --timeout=300 -- echo "PostgreSQL is up"
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $6}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $7}')
  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- echo "PostgreSQL is up"
fi

# Wait for Redis (external service)
echo "Waiting for Redis..."
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}
./server/scripts/wait-for-it.sh ${REDIS_HOST}:${REDIS_PORT} --strict --timeout=300 -- echo "Redis is up"

# Wait for PostgREST (external service)
echo "Waiting for PostgREST..."
PGRST_HOST=${PGRST_HOST:-postgrest}
PGRST_PORT=${PGRST_SERVER_PORT:-3000}
./server/scripts/wait-for-it.sh ${PGRST_HOST}:${PGRST_PORT} --strict --timeout=300 -- echo "PostgREST is up"

# Run database setup (development mode)
if [ -d "./server/dist" ]; then
  echo "Running database setup (production mode)..."
  npm run db:setup:prod
else
  echo "Running database setup (development mode)..."
  npm run db:setup
fi

echo "Starting server..."
exec "$@"
