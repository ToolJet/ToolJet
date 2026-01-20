#!/bin/bash
set -e

npm cache clean --force

# Load environment variables from .env if the file exists
if [ -f "./.env" ]; then
  export $(grep -v '^#' ./.env | xargs -d '\n') || true
fi

# Start Redis server only if REDIS_HOST is localhost or not set
if [ -z "$REDIS_HOST" ] || [ "$REDIS_HOST" = "localhost" ]; then
  echo "Starting Redis server locally..."
  redis-server /etc/redis/redis.conf &
elif [ -n "$REDIS_URL" ]; then
  echo "REDIS_URL connection is set: $REDIS_URL"
else
  echo "Using external Redis at $REDIS_HOST:$REDIS_PORT."

  # Validate external Redis connection
  if ! ./server/scripts/wait-for-it.sh "$REDIS_HOST:${REDIS_PORT:-6379}" --strict --timeout=300 -- echo "Redis is up"; then
    echo "Error: Unable to connect to Redis at $REDIS_HOST:$REDIS_PORT."
    exit 1
  fi
fi

# Check if PGRST_HOST starts with "localhost"
if [[ "$PGRST_HOST" == localhost:* ]]; then
  echo "Starting PostgREST server locally..."

  # Generate PostgREST configuration in a writable directory
  POSTGREST_CONFIG_PATH="/tmp/postgrest.conf"

  echo "db-uri = \"${PGRST_DB_URI}\"" > "$POSTGREST_CONFIG_PATH"
  echo "db-pre-config = \"postgrest.pre_config\"" >> "$POSTGREST_CONFIG_PATH"
  echo "server-port = \"${PGRST_SERVER_PORT}\"" >> "$POSTGREST_CONFIG_PATH"

  # Starting PostgREST
  echo "Starting PostgREST..."
  postgrest "$POSTGREST_CONFIG_PATH" &
else
  echo "Using external PostgREST at $PGRST_HOST."
fi

# Determine setup command based on the presence of ./server/dist
if [ -d "./server/dist" ]; then
  SETUP_CMD='npm run db:setup:prod'
else
  SETUP_CMD='npm run db:setup'
fi

# Wait for PostgreSQL connection
if [ -z "$DATABASE_URL" ]; then
  ./server/scripts/wait-for-it.sh $PG_HOST:${PG_PORT:-5432} --strict --timeout=300 -- echo "PostgreSQL is up"
else
  PG_HOST=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $6}')
  PG_PORT=$(echo "$DATABASE_URL" | awk -F'[/:@?]' '{print $7}')

  ./server/scripts/wait-for-it.sh "$PG_HOST:$PG_PORT" --strict --timeout=300 -- echo "PostgreSQL is up"
fi

# Run setup command if defined
if [ -n "$SETUP_CMD" ]; then
  $SETUP_CMD
fi

# =============================================================================
# Let's Encrypt SSL Support
# When ENABLE_DOMAIN_SSL=true, nginx handles SSL termination on ports 80/443
# and proxies to NestJS on internal port 3000
# NOTE: This must run AFTER database setup because SSL config is read from DB
# =============================================================================

# Extract domain from TOOLJET_HOST (removes protocol, port, path)
extract_domain() {
    echo "${1#*://}" | cut -d: -f1 | cut -d/ -f1
}

# Function to get SSL config from database
get_ssl_config() {
    local field=$1
    local default=$2

    # Only query DB if PostgreSQL is configured
    if [ -n "$PG_HOST" ] && [ -n "$PG_DB" ] && [ -n "$PG_USER" ]; then
        PGPASSWORD="$PG_PASS" psql -h "$PG_HOST" -p "${PG_PORT:-5432}" -U "$PG_USER" -d "$PG_DB" \
            -t -A -c "SELECT $field FROM ssl_configurations ORDER BY created_at ASC LIMIT 1" 2>/dev/null || echo "$default"
    else
        echo "$default"
    fi
}

# Read SSL settings from database (with env var fallback)
if [ -z "$ENABLE_DOMAIN_SSL" ]; then
    ENABLE_DOMAIN_SSL=$(get_ssl_config "enabled" "false")
fi

if [ -z "$LETSENCRYPT_EMAIL" ]; then
    LETSENCRYPT_EMAIL=$(get_ssl_config "email" "")
fi

if [ -z "$LETSENCRYPT_STAGING" ]; then
    LETSENCRYPT_STAGING=$(get_ssl_config "staging" "false")
fi

# Export for use in SSL setup
export ENABLE_DOMAIN_SSL
export LETSENCRYPT_EMAIL
export LETSENCRYPT_STAGING

if [ "$ENABLE_DOMAIN_SSL" = "true" ]; then
    echo "=== Let's Encrypt SSL Mode Enabled ==="

    # Validate required variables
    if [ -z "$TOOLJET_HOST" ]; then
        echo "ERROR: TOOLJET_HOST must be set when ENABLE_DOMAIN_SSL=true"
        echo "Example: TOOLJET_HOST=https://tooljet.example.com"
        exit 1
    fi
    if [ -z "$LETSENCRYPT_EMAIL" ]; then
        echo "ERROR: LETSENCRYPT_EMAIL must be set when ENABLE_DOMAIN_SSL=true"
        echo "Example: LETSENCRYPT_EMAIL=admin@example.com"
        exit 1
    fi

    DOMAIN_NAME=$(extract_domain "$TOOLJET_HOST")
    echo "Domain: $DOMAIN_NAME"
    echo "Email: $LETSENCRYPT_EMAIL"
    echo "Staging: ${LETSENCRYPT_STAGING:-false}"

    # NestJS listens internally, nginx handles external traffic
    export PORT=3000
    export LISTEN_ADDR="127.0.0.1"

    export DOMAIN_NAME

    # Check if certificate already exists
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN_NAME" ]; then
        echo "First-time setup: No certificate found for $DOMAIN_NAME"
        echo ""
        echo "=== PHASE 1: Starting nginx in HTTP-only mode for ACME challenge ==="

        # Generate HTTP-only config (no SSL block - won't fail on missing certs)
        envsubst '${DOMAIN_NAME}' < /app/server/ssl/nginx-ssl-http-only.conf.template > /tmp/nginx.conf

        # Start nginx in HTTP-only mode
        echo "Starting nginx (HTTP-only mode)..."
        nginx -c /tmp/nginx.conf

        # Verify nginx started successfully
        if ! pgrep -x "nginx" > /dev/null; then
            echo "❌ ERROR: nginx failed to start"
            echo "Check nginx error logs: /var/log/nginx/error.log"
            exit 1
        fi

        echo "✓ nginx started successfully on port 80"
        echo ""

        # Small delay to ensure nginx is ready
        sleep 2

        echo "=== PHASE 2: Acquiring Let's Encrypt certificate ==="

        STAGING_FLAG=""
        if [ "$LETSENCRYPT_STAGING" = "true" ]; then
            STAGING_FLAG="--staging"
            echo "Using Let's Encrypt staging environment"
        fi

        # Run certbot (nginx is now serving HTTP on port 80)
        echo "Running certbot for domain: $DOMAIN_NAME"
        certbot certonly --webroot -w /var/www/certbot \
            --config-dir /etc/letsencrypt \
            --work-dir /var/lib/letsencrypt \
            --logs-dir /var/log/letsencrypt \
            -d "$DOMAIN_NAME" \
            --email "$LETSENCRYPT_EMAIL" \
            --agree-tos \
            --non-interactive \
            --keep-until-expiring \
            $STAGING_FLAG

        if [ $? -eq 0 ]; then
            echo "✓ Certificate acquired successfully for $DOMAIN_NAME"
            echo ""
            echo "=== PHASE 3: Reloading nginx with SSL configuration ==="

            # Generate full SSL config (with HTTPS support)
            envsubst '${DOMAIN_NAME}' < /app/server/ssl/nginx-ssl.conf.template > /tmp/nginx.conf

            # Test new config before reloading
            if nginx -c /tmp/nginx.conf -t 2>/dev/null; then
                echo "✓ SSL configuration valid"
                echo "Reloading nginx with SSL support..."
                nginx -s reload
                echo "✓ nginx reloaded successfully - HTTPS now active"
            else
                echo "❌ ERROR: SSL configuration test failed"
                echo "nginx will continue running in HTTP-only mode"
            fi
        else
            echo "❌ WARNING: Certificate acquisition failed"
            echo ""
            echo "Possible causes:"
            echo "  - Domain DNS not pointing to this server (check DNS records)"
            echo "  - Port 80 blocked by firewall (certbot needs port 80 for ACME challenge)"
            echo "  - Let's Encrypt rate limit reached (5 certs per domain per week)"
            echo "  - Network connectivity issues"
            echo ""
            echo "nginx will continue running in HTTP-only mode"
            echo "Certificate acquisition will be retried on next restart or via API"
            echo ""
            # DON'T disable SSL mode - keep PORT and LISTEN_ADDR set
            # nginx is already running and will serve HTTP-only
        fi
    else
        echo "✓ Certificate already exists for $DOMAIN_NAME"
        echo ""

        # Generate full SSL config (certificate already exists)
        envsubst '${DOMAIN_NAME}' < /app/server/ssl/nginx-ssl.conf.template > /tmp/nginx.conf

        # Start nginx with SSL support
        echo "Starting nginx with SSL support..."
        nginx -c /tmp/nginx.conf

        # Verify nginx started successfully
        if ! pgrep -x "nginx" > /dev/null; then
            echo "❌ ERROR: nginx failed to start"
            echo "Check nginx error logs: /var/log/nginx/error.log"
            exit 1
        fi

        echo "✓ nginx started successfully - HTTPS active"
    fi

    # nginx is now running - whether cert acquisition succeeded or not

    # NOTE: Certificate lifecycle management
    # - Initial acquisition: Handled above (first-time setup in entrypoint)
    # - Validation & fallback: SslCertificateLifecycleService.onModuleInit()
    # - Renewals: SslCertificateRenewalScheduler (every 12 hours)

    echo "=== SSL infrastructure ready ==="
    echo "nginx listening on :80 (redirect) and :443 (SSL)"
    echo "NestJS will listen on :3000 (internal only)"
    echo "Certificate management handled by NestJS automatically"
fi

# =============================================================================

exec "$@"
