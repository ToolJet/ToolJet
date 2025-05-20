#!/bin/bash
set -e

# Start Redis
# service redis-server start
# redis-server /etc/redis/redis.conf

# Start Postgres
service postgresql start

# Export the PORT variable to be used by the application
export PORT=${PORT:-80}

# Start Supervisor
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
