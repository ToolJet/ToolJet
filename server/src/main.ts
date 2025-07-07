import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { Logger } from 'nestjs-pino';
import { urlencoded, json } from 'express';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import {
  RequestMethod,
  ValidationPipe,
  VersioningType,
  VERSION_NEUTRAL,
  INestApplicationContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { bootstrap as globalAgentBootstrap } from 'global-agent';
import { custom } from 'openid-client';
import { join } from 'path';
import helmet from 'helmet';
import * as express from 'express';
import * as fs from 'fs';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { GuardValidator } from '@modules/app/validators/feature-guard.validator';
import { ILicenseUtilService } from '@modules/licensing/interfaces/IUtilService';
import { ITemporalService } from '@modules/workflows/interfaces/ITemporalService';
import { getTooljetEdition } from '@helpers/utils.helper';
import { validateEdition } from '@helpers/edition.helper';
import { ResponseInterceptor } from '@modules/app/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';

let appContext: INestApplicationContext = undefined;

async function handleLicensingInit(app: NestExpressApplication) {
  const tooljetEdition = getTooljetEdition() as TOOLJET_EDITIONS;

  if (tooljetEdition !== TOOLJET_EDITIONS.EE) {
    // If the edition is not EE, we don't need to initialize licensing
    return;
  }

  const importPath = await getImportPath(false, tooljetEdition);
  const { LicenseUtilService } = await import(`${importPath}/licensing/util.service`);

  const licenseInitService = app.get<LicenseInitService>(LicenseInitService);
  const licenseUtilService = app.get<ILicenseUtilService>(LicenseUtilService);

  await licenseInitService.init();

  const License = await import(`${importPath}/licensing/configs/License`);
  const license = License.default;
  licenseUtilService.validateHostnameSubpath(license.Instance()?.domains);

  console.log(
    `License valid : ${license.Instance().isValid} License Terms : ${JSON.stringify(license.Instance().terms)} 🚀`
  );
}
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

function setSecurityHeaders(app, configService) {
  const tooljetHost = configService.get('TOOLJET_HOST');
  const host = new URL(tooljetHost);
  const domain = host.hostname;

  app.enableCors({
    origin: configService.get('ENABLE_CORS') === 'true' || tooljetHost,
    credentials: true,
  });

  app.use(
    helmet({
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
          ].concat(configService.get('CSP_WHITELISTED_DOMAINS')?.split(',') || []),
          'object-src': ["'self'", 'data:'],
          'media-src': ["'self'", 'data:'],
          'default-src': [
            'maps.googleapis.com',
            'storage.googleapis.com',
            'apis.google.com',
            'accounts.google.com',
            '*.sentry.io',
            "'self'",
            'blob:',
            'www.googletagmanager.com',
          ].concat(configService.get('CSP_WHITELISTED_DOMAINS')?.split(',') || []),
          'connect-src': ['ws://' + domain, "'self'", '*', 'data:'],
          'frame-ancestors': ['*'],
          'frame-src': ['*'],
        },
      },
      frameguard: configService.get('DISABLE_APP_EMBED') !== 'true' ? false : { action: 'deny' },
      hidePoweredBy: true,
      referrerPolicy: {
        policy: 'no-referrer',
      },
    })
  );

  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
    res.setHeader('X-Powered-By', 'ToolJet');

    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return next();
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(await AppModule.register({ IS_GET_CONTEXT: false }), {
    bufferLogs: true,
    abortOnError: false,
  });

  // Get DataSource from the app
  await validateEdition(app);

  globalThis.TOOLJET_VERSION = `${fs.readFileSync('./.version', 'utf8').trim()}-${getTooljetEdition()}`;
  process.env['RELEASE_VERSION'] = globalThis.TOOLJET_VERSION;

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing application...');
    await app.close();
    process.exit(0);
  });

  if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
    replaceSubpathPlaceHoldersInStaticAssets();
  }
  console.log(getTooljetEdition(), 'ToolJet Edition 🚀');

  if (getTooljetEdition() !== TOOLJET_EDITIONS.Cloud) {
    await handleLicensingInit(app);
  }

  const configService = app.get<ConfigService>(ConfigService);

  custom.setHttpOptionsDefaults({
    timeout: parseInt(process.env.OIDC_CONNECTION_TIMEOUT || '3500'), // Default 3.5 seconds
  });

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector), app.get(Logger), app.get(EventEmitter2)));
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

  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });

  setSecurityHeaders(app, configService);

  app.use(`${UrlPrefix}/assets`, express.static(join(__dirname, '/assets')));

  const listen_addr = process.env.LISTEN_ADDR || '::';
  const port = parseInt(process.env.PORT) || 3000;

  const guardValidator = app.get(GuardValidator);
  // Run the validation
  await guardValidator.validateJwtGuard();

  await app.listen(port, listen_addr, async function () {
    const tooljetHost = configService.get<string>('TOOLJET_HOST');
    const subPath = configService.get<string>('SUB_PATH');

    console.log(`Ready to use at ${tooljetHost}${subPath || ''} 🚀`);
  });
}

// Bootstrap global agent only if TOOLJET_HTTP_PROXY is set
if (process.env.TOOLJET_HTTP_PROXY) {
  process.env['GLOBAL_AGENT_HTTP_PROXY'] = process.env.TOOLJET_HTTP_PROXY;
  globalAgentBootstrap();
}

async function bootstrapWorker() {
  appContext = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: false }));

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing application...');
    temporalService.shutDownWorker();
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing application...');
    temporalService.shutDownWorker();
  });

  const importPath = await getImportPath(false);
  const { TemporalService } = await import(`${importPath}/workflows/services/temporal.service`);

  const temporalService = appContext.get<ITemporalService>(TemporalService);
  await temporalService.runWorker();
  await appContext.close();
}

export function getAppContext(): INestApplicationContext {
  return appContext;
}
if (getTooljetEdition() === TOOLJET_EDITIONS.EE) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  process.env.WORKER ? bootstrapWorker() : bootstrap();
} else {
  bootstrap();
}
