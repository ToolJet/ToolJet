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

# Create databases if they don't exist
echo "Ensuring required databases exist..."

# Create main application database (tooljet_production)
echo "Checking for database: ${PG_DB}"
if ! PGPASSWORD=${PG_PASS} psql -h ${PG_HOST:-postgres} -U ${PG_USER:-postgres} -lqt | cut -d \| -f 1 | grep -qw ${PG_DB}; then
  echo "Creating database ${PG_DB}..."
  PGPASSWORD=${PG_PASS} psql -h ${PG_HOST:-postgres} -U ${PG_USER:-postgres} -c "CREATE DATABASE ${PG_DB}"
  echo "Database ${PG_DB} created successfully"
else
  echo "Database ${PG_DB} already exists"
fi

# Create ToolJet internal database (tooljet_db)
echo "Checking for database: ${TOOLJET_DB}"
if ! PGPASSWORD=${TOOLJET_DB_PASS} psql -h ${TOOLJET_DB_HOST:-postgres} -U ${TOOLJET_DB_USER:-postgres} -lqt | cut -d \| -f 1 | grep -qw ${TOOLJET_DB}; then
  echo "Creating database ${TOOLJET_DB}..."
  PGPASSWORD=${TOOLJET_DB_PASS} psql -h ${TOOLJET_DB_HOST:-postgres} -U ${TOOLJET_DB_USER:-postgres} -c "CREATE DATABASE ${TOOLJET_DB}"
  echo "Database ${TOOLJET_DB} created successfully"
else
  echo "Database ${TOOLJET_DB} already exists"
fi

echo "All required databases are ready"

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
