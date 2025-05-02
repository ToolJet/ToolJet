#!/bin/bash
set -e

# Ensure correct ownership and permissions
echo "[boot.sh] Setting ownership and permissions on /var/data..."
chown -R postgres:postgres /var/data
chmod 0700 /var/data

# Remove stale postmaster.pid if it exists and no process is using it
if [ -f /var/data/postmaster.pid ]; then
  echo "[boot.sh] Found existing postmaster.pid. Checking if process is alive..."
  pid=$(head -n1 /var/data/postmaster.pid)
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "[boot.sh] Removing stale postmaster.pid (PID $pid not alive)..."
    rm -f /var/data/postmaster.pid
  else
    echo "[boot.sh] PostgreSQL already running with PID $pid. Skipping startup."
  fi
fi

# Initialize PostgreSQL if it hasn't been initialized
if [ ! -f /var/data/PG_VERSION ]; then
  echo "[boot.sh] Initializing PostgreSQL database..."
  su postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/data"
fi

# Start supervisord
echo "[boot.sh] Starting supervisord..."
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf &

# Wait for PostgreSQL to be ready
echo "[boot.sh] Waiting for PostgreSQL to become ready..."
until pg_isready -h localhost -U postgres > /dev/null 2>&1; do
  sleep 1
done

# Create 'tooljet' role if it doesn't exist
echo "[boot.sh] Creating role 'tooljet' (if not exists)..."
psql -U postgres -h localhost -tc "SELECT 1 FROM pg_roles WHERE rolname='tooljet'" | grep -q 1 || \
psql -U postgres -h localhost -c "CREATE ROLE tooljet WITH LOGIN SUPERUSER PASSWORD 'postgres';"

# Welcome banner
cat << 'EOF'

   _____           _   ___      _
  |_   _|         | | |_  |    | |
    | | ___   ___ | |   | | ___| |_
    | |/ _ \ / _ \| |   | |/ _ \ __|
    | | (_) | (_) | /\__/ /  __/ |_
    \_/\___/ \___/|_\____/ \___|\__|

GitHub: https://github.com/ToolJet/ToolJet

EOF

# Run ToolJet setup and start
echo "[boot.sh] Setting up database and starting ToolJet..."
npm run db:setup:prod
npm run db:seed:prod
npm run start:prod
