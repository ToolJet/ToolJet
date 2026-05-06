import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SslServerManagerService } from '@services/ssl-server-manager.service';
import { SslServerState } from '@ee/ssl-configuration/types/ssl-server-state.enum';

/**
 * Middleware to redirect HTTP requests to HTTPS when SSL is active
 * Excludes ACME challenge requests (needed for certificate acquisition)
 *
 * Usage in AppModule:
 * configure(consumer: MiddlewareConsumer) {
 *   consumer.apply(HttpToHttpsRedirectMiddleware).forRoutes('*');
 * }
 */
@Injectable()
export class HttpToHttpsRedirectMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpToHttpsRedirectMiddleware.name);

  constructor(private readonly sslServerManager: SslServerManagerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip ACME challenges (must be accessible via HTTP for certificate acquisition)
    if (req.path.startsWith('/.well-known/acme-challenge')) {
      return next();
    }

    // Only redirect if HTTPS is active and request is HTTP
    if (
      this.sslServerManager.getState() === SslServerState.HTTPS_ACTIVE &&
      req.protocol === 'http'
    ) {
      const httpsPort = this.sslServerManager.getHttpsPort();
      const portSuffix = httpsPort === 443 ? '' : `:${httpsPort}`;
      const httpsUrl = `https://${req.hostname}${portSuffix}${req.url}`;

      this.logger.debug(`Redirecting HTTP to HTTPS: ${httpsUrl}`);
      return res.redirect(301, httpsUrl);
    }

    next();
  }
}
