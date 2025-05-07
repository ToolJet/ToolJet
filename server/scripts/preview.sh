#!/bin/bash
set -e

# Ensure correct ownership for Postgres directories
chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

# Initialize DB cluster if needed
if [ ! -s "/var/lib/postgresql/13/main/PG_VERSION" ]; then
  echo "Initializing PostgreSQL..."
  su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/13/main"
fi

# Start PostgreSQL (no log redirection, stdout only)
echo "Starting PostgreSQL..."
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/13/main start"

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Supervisor
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
