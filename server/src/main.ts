import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { urlencoded, json } from 'express';

const fs = require('fs');

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8');
globalThis.CACHED_CONNECTIONS = {};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });

  await app.setGlobalPrefix('api');
  await app.enableCors();

  app.useLogger(app.get(Logger));
  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:'],
        'default-src': ["*.sentry.io", "'self'", 'blob:'],
      },
    }),
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));

  const port = parseInt(process.env.PORT) || 3000;

  await app.listen(port, '0.0.0.0', function () {
    console.log('Listening on port %d', port);
  });
}

bootstrap();
