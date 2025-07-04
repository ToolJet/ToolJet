#!/bin/bash
set -e

echo "🚀 Starting Try ToolJet container initialization..."

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
npm --prefix server run worker:prod
