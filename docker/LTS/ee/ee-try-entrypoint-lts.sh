#!/bin/bash
set -e

echo "🚀 Starting Try ToolJet container initialization..."

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


# Configure PostgreSQL authentication
echo "🔧 Configuring PostgreSQL authentication..."
sed -i 's/^local\s\+all\s\+postgres\s\+\(peer\|md5\)/local all postgres trust/' /etc/postgresql/13/main/pg_hba.conf >/dev/null 2>&1
sed -i 's/^local\s\+all\s\+all\s\+\(peer\|md5\)/local all all trust/' /etc/postgresql/13/main/pg_hba.conf >/dev/null 2>&1

# Start PostgreSQL
echo "📈 Starting PostgreSQL..."
service postgresql start

# Wait until PostgreSQL is ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h localhost -p 5432; do
  echo "PostgreSQL not ready yet, retrying..."
  sleep 2
done

# Create user and databases for Temporal
echo "🔧 Creating Temporal DBs and user if needed..."
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='tooljet'" | grep -q 1 || \
psql -U postgres -c "CREATE USER tooljet WITH PASSWORD 'postgres' SUPERUSER;" >/dev/null 2>&1

psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'temporal'" | grep -q 1 || \
psql -U postgres -c "CREATE DATABASE temporal OWNER tooljet;" >/dev/null 2>&1

psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'temporal_visibility'" | grep -q 1 || \
psql -U postgres -c "CREATE DATABASE temporal_visibility OWNER tooljet;" >/dev/null 2>&1

# Generate Temporal config
echo "🔧 Generating Temporal config..."
mkdir -p /etc/temporal/config
if [ -f /etc/temporal/temporal-server.template.yaml ]; then
  envsubst < /etc/temporal/temporal-server.template.yaml > /etc/temporal/config/temporal-server.yaml >/dev/null 2>&1
else
  echo "❌ Missing template: /etc/temporal/temporal-server.template.yaml"
  exit 1
fi

# Download schema files if not present
if [ ! -d "/etc/temporal/schema/postgresql" ]; then
  echo "📥 Downloading Temporal schema files..."
  mkdir -p /etc/temporal/schema
  cd /tmp
  curl -sOL https://github.com/temporalio/temporal/archive/refs/tags/v1.28.0.tar.gz
  tar -xzf v1.28.0.tar.gz
  cp -r temporal-1.28.0/schema/postgresql /etc/temporal/schema/
  rm -rf temporal-1.28.0 v1.28.0.tar.gz
  cd /
fi

rm -f /etc/temporal/temporal-sql-tool.yaml ~/.temporal/config.yaml
mkdir -p /tmp/temporal

# Set up schemas
echo "🔧 Setting up Temporal schemas..."
for db in temporal temporal_visibility; do
  PGPASSWORD=postgres /usr/bin/temporal-sql-tool --plugin postgres12 \
    --ep "localhost" --port 5432 --user tooljet --password postgres \
    --database $db setup-schema -v 0.0 >/dev/null 2>&1

  schema_dir="/etc/temporal/schema/postgresql/v12"
  schema_type=$([ "$db" = "temporal" ] && echo "temporal" || echo "visibility")

  PGPASSWORD=postgres /usr/bin/temporal-sql-tool --plugin postgres12 \
    --ep "localhost" --port 5432 --user tooljet --password postgres \
    --database $db update-schema -d "$schema_dir/$schema_type/versioned" >/dev/null 2>&1
done

echo "✅ Schema setup complete"

# Export default port if not set
export PORT=${PORT:-80}

# Start Temporal Server
echo "🚀 Starting Temporal Server..."
/usr/bin/temporal-server start >/dev/null 2>&1 &
TEMPORAL_PID=$!

# Start Supervisor
echo "🚀 Starting Supervisor..."
supervisord -c /etc/supervisor/conf.d/supervisord.conf &
SUPERVISOR_PID=$!

# Wait for Temporal to become ready
echo "⏳ Waiting for Temporal..."
for i in {1..30}; do
  if grpcurl -plaintext localhost:7233 grpc.health.v1.Health/Check >/dev/null 2>&1; then
    echo "✅ Temporal is ready"
    break
  fi
  sleep 2
done

# Check if namespace already exists
echo "Checking if Temporal namespace exists..."
if grpcurl -plaintext localhost:7233 temporal.api.workflowservice.v1.WorkflowService/ListNamespaces | grep -q '"name": "default"'; then
    echo "Namespace 'default' already exists."
else
    # Register the namespace if it doesn't exist
    echo "Registering Temporal namespace..."
    grpcurl -plaintext -d '{
        "namespace": "default",
        "description": "Default namespace",
        "workflowExecutionRetentionPeriod": "259200s"
    }' localhost:7233 temporal.api.workflowservice.v1.WorkflowService/RegisterNamespace
fi

# Wait on background processes
wait $TEMPORAL_PID $SUPERVISOR_PID

# Start worker (last step)
echo "🚀 Starting ToolJet worker..."
npm run worker:prod
