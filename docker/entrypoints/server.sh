#!/bin/bash
set -e
bundle check || bundle install
rake db:create
rake db:migrate

exec "$@"
