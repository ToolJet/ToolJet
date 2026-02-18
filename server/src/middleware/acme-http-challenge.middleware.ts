import * as express from 'express';
import * as path from 'path';

/**
 * Middleware to serve ACME HTTP-01 challenge files
 * Serves files from /var/www/certbot/.well-known/acme-challenge/
 *
 * This allows Let's Encrypt to verify domain ownership by accessing:
 * http://domain/.well-known/acme-challenge/<token>
 *
 * Usage in main.ts:
 * app.use('/.well-known/acme-challenge', acmeHttpChallengeMiddleware());
 */
export function acmeHttpChallengeMiddleware() {
  const challengePath = path.join('/var/www/certbot', '.well-known', 'acme-challenge');

  return express.static(challengePath, {
    dotfiles: 'allow', // Allow serving .well-known directory
    index: false,      // Don't serve directory indexes
  });
}
