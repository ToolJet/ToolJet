#!/bin/bash
set -e

service postgresql start &

DATA_DIR="/var/data/postgresql"
if [ ! -s "$DATA_DIR/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory..."
  pg_ctl -D "$DATA_DIR" init
fi

echo "Starting PostgreSQL using custom data directory..."
pg_ctl -D "$DATA_DIR" -o "-c listen_addresses='localhost'" -w start

# Set up the user and DB only if it doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = 'tooljet'" | grep -q 1 || \
  psql -U postgres -c "CREATE ROLE tooljet WITH LOGIN SUPERUSER PASSWORD 'postgres';"

echo "
   _____           _   ___      _
  |_   _|         | | |_  |    | |
    | | ___   ___ | |   | | ___| |_
    | |/ _ \ / _ \| |   | |/ _ \ __|
    | | (_) | (_) | /\__/ /  __/ |_
    \_/\___/ \___/|_\____/ \___|\__|

Everything you need to build internal tools!
GitHub: https://github.com/ToolJet/ToolJet
"

npm run db:setup:prod
npm run db:seed:prod
npm run start:prod
