#!/bin/sh
set -e
bundle check || bundle install
rake db:create
rake db:migrate

if [ -e tmp/pids/server.pid ]; then
  rm tmp/pids/server.pid
fi

exec "$@"
