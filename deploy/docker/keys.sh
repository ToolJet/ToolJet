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

  echo "Generated LOCKBOX_MASTER_KEY"
else
  echo "LOCKBOX_MASTER_KEY already exists"
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

  echo "Generated SECRET_KEY_BASE"
else
  echo "SECRET_KEY_BASE already exists"
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

  echo "Generated PGRST_JWT_SECRET"
else
  echo "PGRST_JWT_SECRET already exists"
fi

# Check if PG_PASS and TOOLJET_DB_PASS are present or empty
if [[ -z "$PG_PASS" ]] && [[ -z "$TOOLJET_DB_PASS" ]]; then
  # Prompt for password value
  read -p "Enter the password value for postgres database: " PASSWORD_VALUE

  # Update .env file
  awk -v pass="$PASSWORD_VALUE" '
    BEGIN { FS=OFS="=" }
    /^(PG_PASS|TOOLJET_DB_PASS)=/ { $2=pass; found=1 }
    1
    END { if (!found) print "PG_PASS="pass ORS "TOOLJET_DB_PASS="pass }
  ' .env > temp.env && mv temp.env .env

  echo "Password udapted"
else
  echo "Password already exist"
fi

exec "$@"