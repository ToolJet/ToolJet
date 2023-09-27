#!/bin/bash
set -e

# Start Redis
service redis-server start

# Start Postgres
service postgresql start

# Start Supervisor
/usr/bin/supervisord -n
