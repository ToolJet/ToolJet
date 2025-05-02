#!/bin/bash
set -e

# Ensure ownership
chown -R postgres:postgres /var/data

# Initialize PostgreSQL if needed
if [ ! -f /var/data/PG_VERSION ]; then
  echo "[boot.sh] Initializing PostgreSQL..."
  su postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/data"
fi

# Start PostgreSQL via Supervisord (already configured)
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf &

# Wait for PostgreSQL to be ready
echo "[boot.sh] Waiting for PostgreSQL to start..."
while ! pg_isready -h localhost -U postgres; do
  sleep 1
done

# Create 'tooljet' role if missing
echo "[boot.sh] Creating role 'tooljet'..."
psql -U postgres -h localhost -c "CREATE ROLE tooljet WITH LOGIN SUPERUSER PASSWORD 'postgres';" 2>/dev/null || true

# Your existing setup
echo "
   _____           _   ___      _
  |_   _|         | | |_  |    | |
    | | ___   ___ | |   | | ___| |_
    | |/ _ \ / _ \| |   | |/ _ \ __|
    | | (_) | (_) | /\__/ /  __/ |_
    \_/\___/ \___/|_\____/ \___|\__|

GitHub: https://github.com/ToolJet/ToolJet
"

npm run db:setup:prod
npm run db:seed:prod
npm run start:prod
