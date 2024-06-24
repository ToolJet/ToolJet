import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { urlencoded, json } from 'express';
import { AllExceptionsFilter } from './filters/all-exceptions-filter';
import { RequestMethod, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { bootstrap as globalAgentBootstrap } from 'global-agent';
import { join } from 'path';

const fs = require('fs');

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();
process.env['RELEASE_VERSION'] = globalThis.TOOLJET_VERSION;

function replaceSubpathPlaceHoldersInStaticAssets() {
  const filesToReplaceAssetPath = ['index.html', 'runtime.js', 'main.js'];

  for (const fileName of filesToReplaceAssetPath) {
    const file = join(__dirname, '../../../', 'frontend/build', fileName);

    let newValue = process.env.SUB_PATH;

    if (process.env.SUB_PATH === undefined) {
      newValue = fileName === 'index.html' ? '/' : '';
    }

    const data = fs.readFileSync(file, { encoding: 'utf8' });

    const result = data
      .replace(/__REPLACE_SUB_PATH__\/api/g, join(newValue, '/api'))
      .replace(/__REPLACE_SUB_PATH__/g, newValue);

    fs.writeFileSync(file, result, { encoding: 'utf8' });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
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
  const hasSubPath = process.env.SUB_PATH !== undefined;
  const UrlPrefix = hasSubPath ? process.env.SUB_PATH : '';

  // Exclude these endpoints from prefix. These endpoints are required for health checks.
  const pathsToExclude = [];
  if (hasSubPath) {
    pathsToExclude.push({ path: '/', method: RequestMethod.GET });
  }
  pathsToExclude.push({ path: '/health', method: RequestMethod.GET });
  pathsToExclude.push({ path: '/api/health', method: RequestMethod.GET });

  app.setGlobalPrefix(UrlPrefix + 'api', {
    exclude: pathsToExclude,
  });
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(compression());

  app.use(
    helmet.contentSecurityPolicy({
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
    })
  );

  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
  app.useStaticAssets(join(__dirname, 'assets'), { prefix: (UrlPrefix ? UrlPrefix : '/') + 'assets' });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  const listen_addr = process.env.LISTEN_ADDR || '::';
  const port = parseInt(process.env.PORT) || 3000;

  if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
    replaceSubpathPlaceHoldersInStaticAssets();
  }

  await app.listen(port, listen_addr, function () {
    const tooljetHost = configService.get<string>('TOOLJET_HOST');
    console.log(`Ready to use at ${tooljetHost} 🚀`);
  });
}

// Bootstrap global agent only if TOOLJET_HTTP_PROXY is set
if (process.env.TOOLJET_HTTP_PROXY) {
  process.env['GLOBAL_AGENT_HTTP_PROXY'] = process.env.TOOLJET_HTTP_PROXY;
  globalAgentBootstrap();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
