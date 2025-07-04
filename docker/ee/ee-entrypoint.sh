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

# Neo4j configuration
# ----------------------------------
# Default Neo4j environment values
# ----------------------------------
export NEO4J_USER=${NEO4J_USER:-"neo4j"}
export NEO4J_PASSWORD=${NEO4J_PASSWORD:-"appaqvyvRLbeukhFE"}
export NEO4J_AUTH=${NEO4J_AUTH:-"neo4j/appaqvyvRLbeukhFE"}
export NEO4J_URI=${NEO4J_URI:-"bolt://localhost:7687"}
export NEO4J_PLUGINS=${NEO4J_PLUGINS:-'["apoc"]'}
export NEO4J_AUTH

# Extract username and password from NEO4J_AUTH if set
if [ -n "$NEO4J_AUTH" ]; then
  # Extract username and password from NEO4J_AUTH (format: username/password)
  NEO4J_USERNAME=$(echo "$NEO4J_AUTH" | cut -d'/' -f1)
  NEO4J_PASSWORD=$(echo "$NEO4J_AUTH" | cut -d'/' -f2)
  
  # Export these for application use
  export NEO4J_USERNAME
  export NEO4J_PASSWORD
  
  echo "Neo4j authentication configured with username: $NEO4J_USERNAME" >/dev/null 2>&1
else
  echo "NEO4J_AUTH not set, using default authentication" >/dev/null 2>&1
fi

# Check if Neo4j is already initialized and set password if necessary
if [ "$NEO4J_AUTH" != "none" ] && [ -n "$NEO4J_PASSWORD" ]; then
  echo "Setting Neo4j initial password..." >/dev/null 2>&1
  
  # Ensure Neo4j is not running before setting the initial password
  neo4j stop || true

  # Set the initial password using the correct command format for Neo4j 5.x
  NEO4J_ADMIN_CMD=$(which neo4j-admin)
  NEO4J_VERSION=$(neo4j --version | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+" | head -n 1)
  echo "Detected Neo4j version: $NEO4J_VERSION" >/dev/null 2>&1
  
  # Use version-specific command format
  MAJOR_VERSION=$(echo $NEO4J_VERSION | cut -d. -f1)
  if [ "$MAJOR_VERSION" -ge "5" ]; then
    # For Neo4j 5.x and higher
    echo "Using Neo4j 5.x+ password command format" >/dev/null 2>&1
    $NEO4J_ADMIN_CMD dbms set-initial-password "$NEO4J_PASSWORD" --require-password-change=false >/dev/null 2>&1 || {
      echo "Warning: Could not set Neo4j password, it may already be set" >/dev/null 2>&1
    }
  else
    # For Neo4j 4.x and lower
    echo "Using Neo4j 4.x password command format" >/dev/null 2>&1
    $NEO4J_ADMIN_CMD set-initial-password "$NEO4J_PASSWORD" >/dev/null 2>&1 || {
      echo "Warning: Could not set Neo4j password, it may already be set" >/dev/null 2>&1
    }
  fi
fi

# Update Neo4j configuration
echo "Configuring Neo4j..." >/dev/null 2>&1
cat > /etc/neo4j/neo4j.conf << EOF
# Neo4j configuration
dbms.security.auth_enabled=true
server.bolt.enabled=true
server.bolt.listen_address=0.0.0.0:7687
server.directories.data=/var/lib/neo4j/data
server.directories.logs=/var/log/neo4j
initial.dbms.default_database=neo4j
server.directories.plugins=/var/lib/neo4j/plugins
server.directories.import=/var/lib/neo4j/import

# APOC Settings
dbms.security.procedures.unrestricted=apoc.*
dbms.security.procedures.allowlist=apoc.*,algo.*,gds.*
EOF

if [ -w "$NEO4J_LOG_DIR" ]; then
  chmod -R 770 "$NEO4J_LOG_DIR" || echo "Warning: Could not set log directory permissions" >/dev/null 2>&1
fi

# Start Neo4j 
echo "Starting Neo4j service..."
neo4j console >/dev/null 2>&1 &

# Add a wait for Neo4j to be ready with more robust checking
echo "Waiting for Neo4j to be ready..." >/dev/null 2>&1
NEO4J_READY=false
for i in {1..60}; do
  # First try standard status check
  if neo4j status >/dev/null 2>&1; then
    echo "Neo4j is ready 🚀"
    NEO4J_READY=true
    break
  fi
  
  # Also try connecting to the bolt port as a fallback
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost 7687 >/dev/null 2>&1; then
      echo "Neo4j is ready (port 7687 is open)"
      NEO4J_READY=true
      break
    fi
  fi
  
  echo "Waiting for Neo4j to start... ($i/60)" >/dev/null 2>&1
  sleep 2
done

if [ "$NEO4J_READY" = false ]; then
  echo "WARNING: Neo4j may not be fully started yet, but continuing..."
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
