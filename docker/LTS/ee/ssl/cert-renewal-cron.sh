#!/bin/bash
# cert-renewal-cron.sh - Background daemon for Let's Encrypt certificate renewal
# Checks for renewal every 12 hours and reloads nginx on success

set -e

RENEWAL_INTERVAL=43200  # 12 hours in seconds

echo "[cert-renewal] Starting certificate renewal daemon"
echo "[cert-renewal] Will check for renewal every 12 hours"

# Give the system time to fully start up before first check
sleep 60

while true; do
    echo "[cert-renewal] $(date): Checking certificate renewal..."

    # Attempt renewal using webroot mode (nginx serves /.well-known/acme-challenge/)
    # --quiet suppresses output unless there's an error
    # --deploy-hook reloads nginx only if renewal succeeded
    if certbot renew --webroot --webroot-path=/var/www/certbot \
        --deploy-hook "nginx -c /tmp/nginx.conf -s reload" \
        --quiet 2>&1; then
        echo "[cert-renewal] Renewal check completed successfully"
    else
        echo "[cert-renewal] WARNING: Renewal check encountered an error"
    fi

    echo "[cert-renewal] Next check in 12 hours"
    sleep $RENEWAL_INTERVAL
done
