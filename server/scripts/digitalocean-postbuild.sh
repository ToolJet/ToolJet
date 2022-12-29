#!/bin/sh

echo $CA_CERT > ca-certificate.pem

# Dependency for digital ocean
apt-get install -y cloud-init

(
  export NODE_EXTRA_CA_CERTS="$(pwd)/ca-certificate.pem"; \
  npm run db:migrate:prod && \
  npm run db:seed:prod && \
  npm run start:prod
)
