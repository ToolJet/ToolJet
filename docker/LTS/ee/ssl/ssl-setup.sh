#!/bin/bash
# ssl-setup.sh - Obtain Let's Encrypt SSL certificate for ToolJet
# Usage: ./ssl-setup.sh <domain> <email> <staging>

set -e

DOMAIN="$1"
EMAIL="$2"
STAGING="${3:-false}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "ERROR: Usage: $0 <domain> <email> [staging]"
    exit 1
fi

echo "=== SSL Certificate Setup ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Staging: $STAGING"

# Check if valid certificate already exists
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
if [ -f "$CERT_PATH" ]; then
    echo "Checking existing certificate..."

    # Check if certificate is valid for at least 7 days
    if openssl x509 -checkend 604800 -noout -in "$CERT_PATH" 2>/dev/null; then
        echo "Valid certificate already exists for $DOMAIN (expires in more than 7 days)"
        echo "Skipping certificate acquisition."
        exit 0
    else
        echo "Existing certificate is expiring soon or invalid. Will attempt renewal."
    fi
fi

# Build certbot command
CERTBOT_ARGS=(
    "certonly"
    "--standalone"
    "--non-interactive"
    "--agree-tos"
    "--email" "$EMAIL"
    "-d" "$DOMAIN"
    "--preferred-challenges" "http"
)

# Add staging flag if enabled (for testing to avoid rate limits)
if [ "$STAGING" = "true" ]; then
    echo "Using Let's Encrypt STAGING server (certificates will NOT be trusted)"
    CERTBOT_ARGS+=("--staging")
fi

# Ensure webroot directory exists for later renewals
mkdir -p /var/www/certbot

echo "Obtaining certificate from Let's Encrypt..."
echo "Running: certbot ${CERTBOT_ARGS[*]}"

# Run certbot
if certbot "${CERTBOT_ARGS[@]}"; then
    echo "Certificate obtained successfully!"

    # Verify certificate
    if [ -f "$CERT_PATH" ]; then
        echo "Certificate details:"
        openssl x509 -in "$CERT_PATH" -noout -subject -issuer -dates
    fi
else
    echo "ERROR: Failed to obtain certificate"
    echo ""
    echo "Common issues:"
    echo "1. DNS not pointing to this server's IP"
    echo "2. Port 80 not accessible from internet"
    echo "3. Firewall blocking Let's Encrypt validation"
    echo "4. Rate limit exceeded (use LETSENCRYPT_STAGING=true for testing)"
    echo ""
    echo "See: https://letsencrypt.org/docs/challenge-types/#http-01-challenge"
    exit 1
fi

echo "=== SSL Setup Complete ==="
