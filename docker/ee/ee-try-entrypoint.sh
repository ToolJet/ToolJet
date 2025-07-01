#!/bin/bash
set -e

echo "🚀 Starting ToolJet EE container initialization..."

# Force trust authentication for all local PostgreSQL connections
echo "🔧 Configuring PostgreSQL authentication..."
sed -i 's/^local\s\+all\s\+postgres\s\+peer/local all postgres trust/' /etc/postgresql/13/main/pg_hba.conf
sed -i 's/^local\s\+all\s\+all\s\+peer/local all all trust/' /etc/postgresql/13/main/pg_hba.conf
sed -i 's/^local\s\+all\s\+postgres\s\+md5/local all postgres trust/' /etc/postgresql/13/main/pg_hba.conf
sed -i 's/^local\s\+all\s\+all\s\+md5/local all all trust/' /etc/postgresql/13/main/pg_hba.conf

# Start Postgres
echo "📈 Starting PostgreSQL..."
service postgresql start

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432; do
  echo "PostgreSQL not ready yet, retrying in 2 seconds..."
  sleep 2
done

# Ensure Temporal DBs and user exist
echo "🔧 Setting up Temporal databases..."
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='tooljet'" | grep -q 1 || psql -U postgres -c "CREATE USER tooljet WITH PASSWORD 'postgres' SUPERUSER;"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'temporal'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE temporal OWNER tooljet;"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'temporal_visibility'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE temporal_visibility OWNER tooljet;"

echo "✅ Databases created successfully"

# Generate Temporal configuration from template
echo "🔧 Generating Temporal configuration..."
mkdir -p /etc/temporal/config
if [ -f /etc/temporal/temporal-server.template.yaml ]; then
  envsubst < /etc/temporal/temporal-server.template.yaml > /etc/temporal/config/temporal-server.yaml
else
  echo "❌ Missing template file: /etc/temporal/temporal-server.template.yaml"
  exit 1
fi

# echo "🔧 Generated temporal-server.yaml with database configuration:"
# grep -A 5 -B 5 "connectAddr\|sql:" /etc/temporal/temporal-server.yaml || echo "No database config found in generated file"

# # Alternative approach: Use environment variables for temporal-sql-tool
# export TEMPORAL_CLI_CONFIG_DIR=/tmp
# export TEMPORAL_CLI_ADDRESS=localhost:7233

# Download schema files if needed
if [ ! -d "/etc/temporal/schema/postgresql" ]; then
    echo "❌ Schema directory not found. Downloading schemas..."
    mkdir -p /etc/temporal/schema
    cd /tmp
    curl -OL https://github.com/temporalio/temporal/archive/refs/tags/v1.28.0.tar.gz
    tar -xzf v1.28.0.tar.gz
    cp -r temporal-1.28.0/schema/postgresql /etc/temporal/schema/
    rm -rf temporal-1.28.0 v1.28.0.tar.gz
    cd /
fi

# Clear any existing config files that might interfere
rm -f /etc/temporal/temporal-sql-tool.yaml
rm -f ~/.temporal/config.yaml
mkdir -p /tmp/temporal

# Method 1: Try using direct SQL connection with explicit parameters
echo "🔧 Setting up Temporal schemas using direct connections..."

# Setup temporal main schema (initial setup)
echo "🔧 Setting up Temporal main schema..."
PGPASSWORD=postgres /usr/bin/temporal-sql-tool \
    --plugin postgres12 \
    --ep "localhost" \
    --port 5432 \
    --user tooljet \
    --password postgres \
    --database temporal \
    setup-schema -v 0.0

# Apply versioned schema upgrades
echo "🔧 Updating Temporal main schema..."
PGPASSWORD=postgres /usr/bin/temporal-sql-tool \
    --plugin postgres12 \
    --ep "localhost" \
    --port 5432 \
    --user tooljet \
    --password postgres \
    --database temporal \
    update-schema -d /etc/temporal/schema/postgresql/v12/temporal/versioned

# Setup visibility schema (initial setup)
echo "🔧 Setting up Temporal visibility schema..."
PGPASSWORD=postgres /usr/bin/temporal-sql-tool \
    --plugin postgres12 \
    --ep "localhost" \
    --port 5432 \
    --user tooljet \
    --password postgres \
    --database temporal_visibility \
    setup-schema -v 0.0

# Apply versioned visibility upgrades
echo "🔧 Updating Temporal visibility schema..."
PGPASSWORD=postgres /usr/bin/temporal-sql-tool \
    --plugin postgres12 \
    --ep "localhost" \
    --port 5432 \
    --user tooljet \
    --password postgres \
    --database temporal_visibility \
    update-schema -d /etc/temporal/schema/postgresql/v12/visibility/versioned

echo "✅ Temporal schema setup completed"

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Temporal Server in background
echo "🚀 Starting Temporal Server..."
/usr/bin/temporal-server start &
TEMPORAL_PID=$!

# Start Supervisor in background
echo "🚀 Starting Supervisor..."
supervisord -c /etc/supervisor/conf.d/supervisord.conf &
SUPERVISOR_PID=$!

# Wait for Temporal Server to be ready
echo "⏳ Waiting for Temporal Server to be ready..."
timeout=60
counter=0
until grpcurl -plaintext localhost:7233 grpc.health.v1.Health/Check >/dev/null 2>&1; do
  if [ $counter -ge $timeout ]; then
    echo "❌ Temporal Server failed to start within $timeout seconds"
    echo "🔍 Checking Temporal server logs..."
    ps aux | grep temporal || echo "No temporal processes found"
    exit 1
  fi
  echo "Temporal not ready yet, retrying in 2 seconds... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done

echo "✅ Temporal Server is ready!"

# Keep the container running by waiting for background processes
echo "🎉 ToolJet EE container initialization completed successfully!"
echo "📊 Services status:"
echo "  - PostgreSQL: ✅ Running"
echo "  - Temporal Server: ✅ Running on :7233"
echo "  - Redis: ✅ Running via Supervisor"
echo "  - ToolJet: ✅ Running via Supervisor"
echo "  - PostgREST: ✅ Running via Supervisor"

# Wait for any of the background processes to exit
wait $TEMPORAL_PID $SUPERVISOR_PID

# Run the worker process (last step)
echo "Starting worker process..."
npm run worker:prod