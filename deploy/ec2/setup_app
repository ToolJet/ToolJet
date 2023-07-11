#!/bin/bash

if grep __required__ .env
then
  echo "Please set the required values within the .env file"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

if psql -d postgresql://$PG_USER:$PG_PASS@$PG_HOST/postgres -c 'select now()' > /dev/null 2>&1
then
  echo "Successfully pinged the database!";
else
  echo "Can't connect to the database. Kindly check the credenials provided in the .env file!"
  exit 1
fi

if sudo systemctl start openresty
then
  echo "Successfully started reverse proxy!"
else
  echo "Failed to start reverse proxy"
  exit 1
fi

if $ENABLE_TOOLJET_DB == "true"
then
    if sudo systemctl start postgrest
    then
        echo "Successfully started PostgREST server!"
    else
        echo "Failed to start PostgREST server"
        exit 1
    fi
fi

npm --prefix server run db:setup:prod

if sudo systemctl start nest
then
  echo "The app will be served at ${TOOLJET_HOST}"
else
  echo "Failed to start the server!"
  exit 1
fi
