#!/bin/bash
set -e

echo "🚀 Starting Try ToolJet container initialization..."

# Step 1: Configure and Start PostgreSQL
echo "🔧 Configuring PostgreSQL authentication..."
sed -i 's/^local\s\+all\s\+postgres\s\+\(peer\|md5\)/local all postgres trust/' /etc/postgresql/16/main/pg_hba.conf >/dev/null 2>&1
sed -i 's/^local\s\+all\s\+all\s\+\(peer\|md5\)/local all all trust/' /etc/postgresql/16/main/pg_hba.conf >/dev/null 2>&1

echo "📈 Starting PostgreSQL..."
service postgresql start

echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h localhost -p 5432; do
  echo "PostgreSQL not ready yet, retrying..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Replace published example keys before the server starts (keys persist next to the database)
source /app/server/scripts/ensure-secret-keys.sh /var/lib/postgresql/16/main

# Create ToolJet user
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='tooljet'" | grep -q 1 || \
psql -U postgres -c "CREATE USER tooljet WITH PASSWORD 'postgres' SUPERUSER;" >/dev/null 2>&1

# Export default port if not set
export PORT=${PORT:-80}

supervisord -c /etc/supervisor/conf.d/supervisord.conf &
SUPERVISOR_PID=$!

echo "🎉 All services started successfully!"
echo "📍 ToolJet should be accessible at http://localhost"

# Wait on background processes
wait $SUPERVISOR_PID