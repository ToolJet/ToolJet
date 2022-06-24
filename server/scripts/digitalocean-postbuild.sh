#!/bin/sh

echo $CA_CERT > ca-certificate.pem
(
  export NODE_EXTRA_CA_CERTS="$(pwd)/ca-certificate.pem"; \
  npm run db:migrate:prod && \
  npm run db:seed && \
  npm run start:prod
)
