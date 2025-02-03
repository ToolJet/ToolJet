#!/bin/bash

# Load the .env file
source .env

# Check if LOCKBOX_MASTER_KEY is present or empty
if [[ -z "$LOCKBOX_MASTER_KEY" ]]; then
  # Generate LOCKBOX_MASTER_KEY
  LOCKBOX_MASTER_KEY=$(openssl rand -hex 32)

  # Update .env file
  awk -v key="$LOCKBOX_MASTER_KEY" '
    BEGIN { FS=OFS="=" }
    /^LOCKBOX_MASTER_KEY=/ { $2=key; found=1 }
    1
    END { if (!found) print "LOCKBOX_MASTER_KEY="key }
  ' .env > temp.env && mv temp.env .env

  echo "Generated a secure master key for the lockbox"
else
  echo "The lockbox master key already exists."
fi

# Check if SECRET_KEY_BASE is present or empty
if [[ -z "$SECRET_KEY_BASE" ]]; then
  # Generate SECRET_KEY_BASE
  SECRET_KEY_BASE=$(openssl rand -hex 64)

  # Update .env file
  awk -v key="$SECRET_KEY_BASE" '
    BEGIN { FS=OFS="=" }
    /^SECRET_KEY_BASE=/ { $2=key; found=1 }
    1
    END { if (!found) print "SECRET_KEY_BASE="key }
  ' .env > temp.env && mv temp.env .env

  echo "Created a secret key for secure operations."
else
  echo "The secret key base is already in place."
fi

# Check if PGRST_JWT_SECRET is present or empty
if [[ -z "$PGRST_JWT_SECRET" ]]; then
  # Generate PGRST_JWT_SECRET
  PGRST_JWT_SECRET=$(openssl rand -hex 32)

  # Update .env file
  awk -v key="$PGRST_JWT_SECRET" '
    BEGIN { FS=OFS="=" }
    /^PGRST_JWT_SECRET=/ { $2=key; found=1 }
    1
    END { if (!found) print "PGRST_JWT_SECRET="key }
  ' .env > temp.env && mv temp.env .env

  echo "Generated a unique secret for PGRST authentication."
else
  echo "The PGRST JWT secret is already generated and in place."
fi

# Function to generate a random password
generate_password() {
  openssl rand -base64 12 | tr -d '/+' | cut -c1-16
}

# Check if PG_PASS and TOOLJET_DB_PASS are present or empty
if [[ -z "$PG_PASS" ]] && [[ -z "$TOOLJET_DB_PASS" ]]; then
  # Generate random passwords
  PASSWORD=$(generate_password)

  # Update .env file
  awk -v pass="$PASSWORD" '
    BEGIN { FS=OFS="=" }
    /^(PG_PASS|TOOLJET_DB_PASS)=/ { $2=pass; found=1 }
    1
    END { if (!found) print "PG_PASS="pass ORS "TOOLJET_DB_PASS="pass }
  ' .env > temp.env && mv temp.env .env

  echo "Successfully generated a secure password for the PostgreSQL database."
else
  echo "Postgres password already exist"
fi

# Check if PGRST_DB_URI is present or empty
if [[ -z "$PGRST_DB_URI" ]]; then
  # Construct PGRST_DB_URI with PG_PASS
  PGRST_DB_URI="postgres://postgres:$PASSWORD@postgresql/tooljet_db"

  # Update .env file for PGRST_DB_URI
  awk -v uri="$PGRST_DB_URI" '
    BEGIN { FS=OFS="=" }
    /^PGRST_DB_URI=/ { $2=uri; found=1 }
    1
    END { if (!found) print "PGRST_DB_URI="uri }
  ' .env > temp.env && mv temp.env .env

  echo "Successfully updated PGRST database URI"
else
  echo "The PGRST DB URI is already configured and in use."
fi

exec "$@"