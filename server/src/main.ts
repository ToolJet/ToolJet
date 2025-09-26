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
import { custom } from 'openid-client';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { GuardValidator } from '@modules/app/validators/feature-guard.validator';
import { ITemporalService } from '@modules/workflows/interfaces/ITemporalService';
import { getTooljetEdition } from '@helpers/utils.helper';
import { validateEdition } from '@helpers/edition.helper';
import { ResponseInterceptor } from '@modules/app/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { startOpenTelemetry, otelMiddleware } from './otel/tracing';

// Import helper functions
import {
  handleLicensingInit,
  replaceSubpathPlaceHoldersInStaticAssets,
  setSecurityHeaders,
  buildVersion,
  rawBodyBuffer,
  setupGlobalAgent,
  createLogger,
  logStartupInfo,
  logShutdownInfo,
} from '@helpers/bootstrap.helper';

let appContext: INestApplicationContext = undefined;

async function bootstrap() {
  const logger = createLogger('Bootstrap');
  logger.log('🚀 Starting ToolJet application bootstrap...');

  try {
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create<NestExpressApplication>(await AppModule.register({ IS_GET_CONTEXT: false }), {
      bufferLogs: true,
      abortOnError: false,
    });

    const configService = app.get<ConfigService>(ConfigService);
    logger.log('✅ NestJS application created successfully');

    // Validate edition
    logger.log('Validating ToolJet edition...');
    await validateEdition(app);
    logger.log('✅ Edition validation completed');

    // Build version
    logger.log('Building version information...');
    const version = buildVersion();
    globalThis.TOOLJET_VERSION = version;
    process.env['RELEASE_VERSION'] = version;
    logger.log(`✅ Version set: ${version}`);

    // Setup graceful shutdown
    logger.log('Setting up graceful shutdown handlers...');
    setupGracefulShutdown(app, logger);
    logger.log('✅ Graceful shutdown handlers configured');

    // Handle static assets in production
    if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
      logger.log('Replacing subpath placeholders in static assets...');
      replaceSubpathPlaceHoldersInStaticAssets();
      logger.log('✅ Static assets processed');
    }

    // Initialize licensing
    logger.log('Initializing licensing...');
    await handleLicensingInit(app);
    logger.log('✅ Licensing initialization completed');

    // Configure OIDC timeout
    logger.log('Configuring OIDC connection timeout...');
    const oidcTimeout = parseInt(process.env.OIDC_CONNECTION_TIMEOUT || '3500');
    custom.setHttpOptionsDefaults({ timeout: oidcTimeout });
    logger.log(`✅ OIDC timeout set to ${oidcTimeout}ms`);

    // Setup application middleware and pipes
    logger.log('Setting up application middleware and pipes...');
    await setupApplicationMiddleware(app);
    logger.log('✅ Application middleware configured');

    // Configure URL prefix and excluded paths
    logger.log('Configuring URL prefix and excluded paths...');
    const { urlPrefix, pathsToExclude } = configureUrlPrefix();
    app.setGlobalPrefix(urlPrefix + 'api', { exclude: pathsToExclude });
    logger.log(`✅ URL prefix configured: ${urlPrefix}`);

    // Setup body parsers
    logger.log('Setting up body parsers...');
    setupBodyParsers(app, configService);
    logger.log('✅ Body parsers configured');

    // Enable versioning
    logger.log('Enabling API versioning...');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: VERSION_NEUTRAL,
    });
    logger.log('✅ API versioning enabled');

    // Setup security headers
    logger.log('Setting up security headers...');
    setSecurityHeaders(app, configService);
    logger.log('✅ Security headers configured');

    // Setup static assets
    logger.log('Setting up static assets...');
    app.use(`${urlPrefix}/assets`, express.static(join(__dirname, '/assets')));
    logger.log('✅ Static assets configured');

    // Validate JWT guard
    logger.log('Validating Ability guard on controllers...');
    const guardValidator = app.get(GuardValidator);
    await guardValidator.validateJwtGuard();
    logger.log('✅ Ability guard validation completed');

    // Start server
    const listen_addr = process.env.LISTEN_ADDR || '::';
    const port = parseInt(process.env.PORT) || 3000;

    logger.log(`Starting server on ${listen_addr}:${port}...`);
    await app.listen(port, listen_addr, async function () {
      logStartupInfo(configService, logger);
    });
  } catch (error) {
    logger.error('❌ Failed to bootstrap application:', error);
    process.exit(1);
  }
}

function setupGracefulShutdown(app: NestExpressApplication, logger: any) {
  const gracefulShutdown = async (signal: string) => {
    logShutdownInfo(signal, logger);
    try {
      await app.close();
      logger.log('✅ Application closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during application shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

async function setupApplicationMiddleware(app: NestExpressApplication) {
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector), app.get(Logger), app.get(EventEmitter2)));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));

  if (process.env.ENABLE_OTEL === 'true') {
    await startOpenTelemetry();
    app.use(otelMiddleware);
  }
}

function configureUrlPrefix() {
  const hasSubPath = process.env.SUB_PATH !== undefined;
  const urlPrefix = hasSubPath ? process.env.SUB_PATH : '';

  // Exclude these endpoints from prefix. These endpoints are required for health checks.
  const pathsToExclude = [];
  if (hasSubPath) {
    pathsToExclude.push({ path: '/', method: RequestMethod.GET });
  }
  pathsToExclude.push({ path: '/health', method: RequestMethod.GET });
  pathsToExclude.push({ path: '/api/health', method: RequestMethod.GET });

  return { urlPrefix, pathsToExclude };
}

function setupBodyParsers(app: NestExpressApplication, configService: ConfigService) {
  const maxSize = configService.get<string>('MAX_JSON_SIZE') || '50mb';

  app.use(compression());
  app.use(cookieParser());
  app.use(json({ verify: rawBodyBuffer, limit: maxSize }));
  app.use(
    urlencoded({
      verify: rawBodyBuffer,
      extended: true,
      limit: maxSize,
      parameterLimit: 1000000,
    })
  );
}

async function bootstrapWorker() {
  const logger = createLogger('Worker');
  logger.log('🚀 Starting ToolJet worker bootstrap...');

  try {
    logger.log('Creating application context...');
    appContext = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: false }));
    logger.log('✅ Application context created');

    // Setup graceful shutdown for worker
    setupWorkerGracefulShutdown(logger);

    logger.log('Initializing Temporal service...');
    const importPath = await getImportPath(false);
    const { TemporalService } = await import(`${importPath}/workflows/services/temporal.service`);

    const temporalService = appContext.get<ITemporalService>(TemporalService);
    logger.log('✅ Temporal service initialized');

    logger.log('Starting Temporal worker...');
    await temporalService.runWorker();
    logger.log('✅ Temporal worker started');

    await appContext.close();
    logger.log('✅ Worker bootstrap completed');
  } catch (error) {
    logger.error('❌ Failed to bootstrap worker:', error);
    process.exit(1);
  }
}

function setupWorkerGracefulShutdown(logger: any) {
  const gracefulShutdown = async (signal: string) => {
    logShutdownInfo(signal, logger);
    try {
      const importPath = await getImportPath(false);
      const { TemporalService } = await import(`${importPath}/workflows/services/temporal.service`);
      const temporalService = appContext.get<ITemporalService>(TemporalService);

      logger.log('Shutting down Temporal worker...');
      temporalService.shutDownWorker();
      logger.log('✅ Temporal worker shutdown completed');
    } catch (error) {
      logger.error('❌ Error during worker shutdown:', error);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

export function getAppContext(): INestApplicationContext {
  return appContext;
}

// Bootstrap global agent only if TOOLJET_HTTP_PROXY is set
setupGlobalAgent();

// Main execution
if (getTooljetEdition() === TOOLJET_EDITIONS.EE) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  process.env.WORKER ? bootstrapWorker() : bootstrap();
} else {
  bootstrap();
}
