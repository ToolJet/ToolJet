#!/usr/bin/env sh
set -eu

if test "$SERVER_HOST"; then
    echo "using the given server host"
else
    echo "using the default server host"
    SERVER_HOST="server"
fi

openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
  -subj '/CN=sni-support-required-for-valid-ssl' \
  -keyout /etc/fallback-certs/resty-auto-ssl-fallback.key \
  -out /etc/fallback-certs/resty-auto-ssl-fallback.crt
envsubst '${SERVER_HOST}' < /etc/openresty/nginx.conf.template > /etc/openresty/nginx.conf

exec "$@"
