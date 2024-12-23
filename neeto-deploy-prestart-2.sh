#!/bin/bash

echo "DATABASE_URL: $DATABASE_URL"

if [ -n "$DATABASE_URL" ]; then
    # Parse DATABASE_URL to extract components
    username=$(echo "$DATABASE_URL" | sed -n 's#postgres://\([^:]*\):.*@\([^:]*\):.*#\1#p')
    password=$(echo "$DATABASE_URL" | sed -n 's#postgres://[^:]*:\([^@]*\)@.*#\1#p')
    host=$(echo "$DATABASE_URL" | sed -n 's#postgres://[^@]*@\([^:]*\):.*#\1#p')
    port=$(echo "$DATABASE_URL" | sed -n 's#.*:\([0-9]*\)/.*#\1#p')
    database=$(echo "$DATABASE_URL" | sed -n 's#.*:\([0-9]*\)/\([^?]*\)?.*#\2#p')

    # Export variables for ToolJet
    export TOOLJET_DB_USER="$username"
    export TOOLJET_DB_PASS="$password"
    export TOOLJET_DB_HOST="$host"
    #export TOOLJET_PORT="$port"
    export PG_DB="$database"
    export PG_USER="$username"
    export PG_PASS="$password"
    export PG_HOST="$host"

    echo "TOOLJET_DB_USER: $TOOLJET_DB_USER"
    echo "TOOLJET_DB_PASS: [HIDDEN]"
    echo "TOOLJET_DB_HOST: $TOOLJET_DB_HOST"
    #echo "TOOLJET_PORT: $TOOLJET_PORT"
    echo  "PG_DB: $PG_DB"
    echo  "PG_USER: $PG_USER"
    echo  "PG_PASS: $PG_PASS"
    echo  "PG_HOST: $PG_HOST"

else
    echo "DATABASE_URL is not set. Exiting."
    exit 1
fi
