#!/bin/bash
set -e

# Ensure proper ownership
chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

# Initialize database if it's not already
if [ ! -s "/var/lib/postgresql/13/main/PG_VERSION" ]; then
  echo "Initializing PostgreSQL database..."
  su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/13/main"
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/13/main -l /var/log/postgresql.log start"

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Supervisor
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
