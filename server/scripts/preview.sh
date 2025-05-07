#!/bin/bash
set -e

# Ensure correct permissions before starting PostgreSQL
chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

# Start PostgreSQL as the correct user
su - postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D /var/lib/postgresql/13/main -l /var/log/postgresql.log start"

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Supervisor
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
