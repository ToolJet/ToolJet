#!/bin/sh

if [ -z "$HEROKU_APP_NAME" ]
then
    export TOOLJET_HOST="https://${HEROKU_APP_NAME}.herokuapp.com"
    export TOOLJET_SERVER_URL="https://${HEROKU_APP_NAME}.herokuapp.com"
fi

npm install --prefix server && npm run build --prefix server
