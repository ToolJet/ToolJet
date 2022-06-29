#!/bin/sh

echo $CA_CERT > ca-certificate.pem

# FIXME: Trying to connect to digital ocean managed db fails even with adding
# NODE_EXTRA_CA_CERTS and therefore removing sslmode from database url
export DATABASE_URL=${DATABASE_URL%"?sslmode=require"}

(
  export NODE_EXTRA_CA_CERTS="$(pwd)/ca-certificate.pem"; \
  npm run db:migrate && \
  npm run db:seed && \
  npm run start:prod
)
