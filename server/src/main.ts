import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { urlencoded, json } from 'express';
import { AllExceptionsFilter } from './all-exceptions-filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const fs = require('fs');

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });
  const configService = app.get<ConfigService>(ConfigService);
  const host = new URL(process.env.TOOLJET_HOST);
  const domain = host.hostname;

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix('api');
  app.enableCors();

  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        upgradeInsecureRequests: null,
        'img-src': ['*', 'data:', 'blob:'],
        'script-src': [
          'maps.googleapis.com',
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
    const tooljetHost = configService.get<string>('TOOLJET_HOST');
    console.log(`Ready to use at ${tooljetHost} 🚀`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
