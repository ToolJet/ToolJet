import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { urlencoded, json } from 'express';
import { AllExceptionsFilter } from './all-exceptions-filter';

const fs = require('fs');

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });
  const host = new URL(process.env.TOOLJET_HOST);
  const domain = host.hostname;

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));
  if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
    app.useWebSocketAdapter(new WsAdapter(app));
  }
  app.setGlobalPrefix('api');
  app.enableCors();

  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        upgradeInsecureRequests: null,
        'img-src': ['*', 'data:'],
        'script-src': [
          'maps.googleapis.com',
          'apis.google.com',
          'accounts.google.com',
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'blob:',
        ],
        'default-src': [
          'maps.googleapis.com',
          'apis.google.com',
          'accounts.google.com',
          '*.sentry.io',
          "'self'",
          'blob:',
        ],
        'connect-src': ['ws://' + domain, "'self'", '*'],
        'frame-ancestors': ['*'],
        'frame-src': ['*'],
      },
    })
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));

  const port = parseInt(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0', function () {
    console.log('Listening on port %d', port);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
