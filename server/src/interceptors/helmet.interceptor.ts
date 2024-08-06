import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HelmetInterceptor implements NestInterceptor {
  private readonly helmet: ReturnType<typeof helmet>;

  constructor(private configService: ConfigService) {
    const host = new URL(this.configService.get('TOOLJET_HOST'));
    const domain = host.hostname;
    this.helmet = helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          upgradeInsecureRequests: null,
          'img-src': ['*', 'data:', 'blob:'],
          'script-src': [
            'maps.googleapis.com',
            'storage.googleapis.com',
            'apis.google.com',
            'accounts.google.com',
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'blob:',
            'https://unpkg.com/@babel/standalone@7.17.9/babel.min.js',
            'https://unpkg.com/react@16.7.0/umd/react.production.min.js',
            'https://unpkg.com/react-dom@16.7.0/umd/react-dom.production.min.js',
            'cdn.skypack.dev',
            'cdn.jsdelivr.net',
            'https://esm.sh',
            'www.googletagmanager.com',
          ],
          'default-src': [
            'maps.googleapis.com',
            'storage.googleapis.com',
            'apis.google.com',
            'accounts.google.com',
            '*.sentry.io',
            "'self'",
            'blob:',
            'www.googletagmanager.com',
          ],
          'connect-src': ['ws://' + domain, "'self'", '*'],
          'frame-ancestors': ['*'],
          'frame-src': ['*'],
        },
      },
      frameguard:
        this.configService.get('DISABLE_APP_EMBED') !== 'true' ||
        this.configService.get('ENABLE_PRIVATE_APP_EMBED') === 'true'
          ? false
          : { action: 'deny' },
      hidePoweredBy: true,
      referrerPolicy: {
        policy: 'no-referrer',
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    return new Observable((subscriber) => {
      this.helmet(request, response, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
