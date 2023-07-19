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

# Check if PG_USER, PG_HOST, PG_PASS, PG_DB are present or empty
if [[ -z "$PG_USER" ]] || [[ -z "$PG_HOST" ]] || [[ -z "$PG_PASS" ]] || [[ -z "$PG_DB" ]]; then
  # Prompt user for values
  read -p "Enter PostgreSQL database username: " PG_USER
  read -p "Enter PostgreSQL database hostname: " PG_HOST
  read -p "Enter PostgreSQL database password: " PG_PASS
  read -p "Enter PostgreSQL database name: " PG_DB

  # Update .env file
  awk -v pg_user="$PG_USER" -v pg_host="$PG_HOST" -v pg_pass="$PG_PASS" -v pg_db="$PG_DB" '
    BEGIN { FS=OFS="=" }
    /^PG_USER=/ { $2=pg_user; found=1 }
    /^PG_HOST=/ { $2=pg_host; found=1 }
    /^PG_PASS=/ { $2=pg_pass; found=1 }
    /^PG_DB=/ { $2=pg_db; found=1 }
    1
    END {
      if (!found) {
        print "PG_USER="pg_user
        print "PG_HOST="pg_host
        print "PG_PASS="pg_pass
        print "PG_DB="pg_db
      }
    }
  ' .env > temp.env && mv temp.env .env

  echo "Successfully updated the .env file with the provided values."
fi

# Copy values from PG to TOOLJET_DB
TOOLJET_DB_USER=$PG_USER
TOOLJET_DB_HOST=$PG_HOST
TOOLJET_DB_PASS=$PG_PASS

# Update .env file for TOOLJET_DB
awk -v tj_user="$TOOLJET_DB_USER" -v tj_host="$TOOLJET_DB_HOST" -v tj_pass="$TOOLJET_DB_PASS" '
  BEGIN { FS=OFS="=" }
  /^TOOLJET_DB_USER=/ { $2=tj_user; found=1 }
  /^TOOLJET_DB_HOST=/ { $2=tj_host; found=1 }
  /^TOOLJET_DB_PASS=/ { $2=tj_pass; found=1 }
  1
  END { if (!found) print "TOOLJET_DB_USER="tj_user ORS "TOOLJET_DB_HOST="tj_host ORS "TOOLJET_DB_PASS="tj_pass }
' .env > temp.env && mv temp.env .env

echo "Successfully updated TOOLJET_DB values in the .env file."

# Construct PGRST_DB_URI with user-provided values
PGRST_DB_URI="postgres://$PG_USER:$PG_PASS@$PG_HOST/tooljet_db"

# Update .env file for PGRST_DB_URI
awk -v uri="$PGRST_DB_URI" '
  BEGIN { FS=OFS="=" }
  /^PGRST_DB_URI=/ { $2=uri; found=1 }
  1
  END { if (!found) print "PGRST_DB_URI="uri }
' .env > temp.env && mv temp.env .env

echo "Successfully updated PGRST database URI"

exec "$@"
