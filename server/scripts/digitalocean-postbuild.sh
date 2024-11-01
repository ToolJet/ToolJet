#!/bin/sh

# Write the CA certificate to a file
echo "$CA_CERT" > ca-certificate.pem

# Install cloud-init for Digital Ocean dependencies
apt-get install -y cloud-init

# Remove sslmode from DATABASE_URL and TOOLJET_DB_URL if present
export DATABASE_URL=${DATABASE_URL%"?sslmode=require"}
export TOOLJET_DB_URL=${TOOLJET_DB_URL%"?sslmode=require"}

# Attempt migration and start server with custom CA certificate
(
  export NODE_EXTRA_CA_CERTS="$(pwd)/ca-certificate.pem"
  if ! npm run db:migrate:prod; then
    echo "Database migration failed."
    exit 1
  fi
  npm run start:prod
)
