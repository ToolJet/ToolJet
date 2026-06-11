#!/bin/bash
set -e

# Fix ownership and permissions for PostgreSQL
chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql
chmod 0700 /var/lib/postgresql/13/main

# Initialize DB cluster if needed
if [ ! -s "/var/lib/postgresql/13/main/PG_VERSION" ]; then
  echo "Initializing PostgreSQL..."
  su - postgres -c "/usr/lib/postgresql/13/bin/initdb -D /var/lib/postgresql/13/main"
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/13/main -w start"

# Fix ownership and permissions for Redis
chown -R redis:redis /var/lib/redis /var/log/redis

# Start Redis
echo "Starting Redis..."
su -s /bin/bash redis -c "/usr/bin/redis-server /etc/redis/redis.conf --daemonize yes"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until redis-cli ping > /dev/null 2>&1; do
  echo "Redis is unavailable - waiting..."
  sleep 1
done
echo "✓ Redis is ready!"

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Supervisor (manages PostgREST and ToolJet)
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
