#!/bin/bash
set -e

echo "🚀 Starting Try ToolJet container initialization..."

# Step 1: Configure and Start PostgreSQL
echo "📈 Starting PostgreSQL..."
sed -i 's/^local\s\+all\s\+postgres\s\+\(peer\|md5\)/local all postgres trust/' /etc/postgresql/16/main/pg_hba.conf >/dev/null 2>&1
sed -i 's/^local\s\+all\s\+all\s\+\(peer\|md5\)/local all all trust/' /etc/postgresql/16/main/pg_hba.conf >/dev/null 2>&1
service postgresql start

until pg_isready -h localhost -p 5432; do
  sleep 2
done
echo "✅ PostgreSQL is ready"

# Replace published example keys before the server starts (keys persist next to the database)
source /app/server/scripts/ensure-secret-keys.sh /var/lib/postgresql/16/main

# Create ToolJet user
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='tooljet'" | grep -q 1 || \
psql -U postgres -c "CREATE USER tooljet WITH PASSWORD 'postgres' SUPERUSER;" >/dev/null 2>&1

# Export default port if not set
export PORT=${PORT:-80}

# Step 2: Start ToolJet services
echo "🚀 Starting ToolJet services..."
export ENABLE_AI_FEATURES=true


supervisord -c /etc/supervisor/conf.d/supervisord.conf &
SUPERVISOR_PID=$!

echo "🎉 All services started successfully!"
echo "📍 ToolJet accessible at http://localhost"

# Wait on background processes
wait $SUPERVISOR_PID
