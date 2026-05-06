import * as express from 'express';
import * as path from 'path';

/**
 * Middleware to serve ACME HTTP-01 challenge tokens.
 *
 * When a `lookup` function is provided (EE, multi-pod deployment), tokens are
 * fetched from the shared database so any pod can respond to Let's Encrypt.
 *
 * Without a lookup function (CE or first-boot fallback) tokens are served
 * from the local filesystem at /var/www/certbot/.well-known/acme-challenge/.
 *
 * Usage in main.ts:
 *   app.use('/.well-known/acme-challenge', acmeHttpChallengeMiddleware(lookup));
 */
export function acmeHttpChallengeMiddleware(
  lookup?: (token: string) => Promise<string | null>
): express.RequestHandler {
  if (lookup) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const token = req.path.replace(/^\//, '');
      try {
        const keyAuthorization = await lookup(token);
        if (keyAuthorization) {
          res.setHeader('Content-Type', 'text/plain');
          return res.send(keyAuthorization);
        }
      } catch {
        // fall through to next
      }
      next();
    };
  }

  // Filesystem fallback (CE or when DB is unavailable)
  const challengePath = path.join('/var/www/certbot', '.well-known', 'acme-challenge');
  return express.static(challengePath, {
    dotfiles: 'allow',
    index: false,
  });
}
