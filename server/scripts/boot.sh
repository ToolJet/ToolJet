#!/bin/bash
set -e

# Init PostgreSQL data dir only if needed
if [ ! -f /var/data/PG_VERSION ]; then
  echo "[boot.sh] Initializing PostgreSQL data directory..."
  /usr/lib/postgresql/13/bin/initdb -D /var/data
else
  echo "[boot.sh] PostgreSQL data directory already initialized."
fi

service postgresql start

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
