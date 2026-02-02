import './otel/tracing'; // CRITICAL: This MUST be the first import to ensure OTEL patches modules before they load
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { Logger } from 'nestjs-pino';
import { urlencoded, json } from 'express';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { RequestMethod, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { custom } from 'openid-client';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from '@modules/app/module';
import { GuardValidator } from '@modules/app/validators/feature-guard.validator';
import { validateEdition } from '@helpers/edition.helper';
import { ResponseInterceptor } from '@modules/app/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  initSentry,
  initializeOtel,
} from '@helpers/bootstrap.helper';

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
    const appLogger = app.get<Logger>(Logger);
    appLogger.log('✅ NestJS application created successfully');

    // Validate edition
    appLogger.log('Validating ToolJet edition...');
    await validateEdition(app);
    appLogger.log('✅ Edition validation completed');

    // Build version
    appLogger.log('Building version information...');
    const version = buildVersion(appLogger);
    globalThis.TOOLJET_VERSION = version;
    process.env['RELEASE_VERSION'] = version;
    appLogger.log(`✅ Version set: ${version}`);

    // Setup graceful shutdown
    appLogger.log('Setting up graceful shutdown handlers...');
    setupGracefulShutdown(app, appLogger);
    appLogger.log('✅ Graceful shutdown handlers configured');

    // Handle static assets in production
    if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
      appLogger.log('Replacing subpath placeholders in static assets...');
      replaceSubpathPlaceHoldersInStaticAssets(appLogger);
      appLogger.log('✅ Static assets processed');
    }

    // Initialize licensing
    appLogger.log('Initializing licensing...');
    await handleLicensingInit(app, appLogger);
    appLogger.log('✅ Licensing initialization completed');

    // Initialize OTEL
    await initializeOtel(app, appLogger);

    // Configure OIDC timeout
    appLogger.log('Configuring OIDC connection timeout...');
    const oidcTimeout = parseInt(process.env.OIDC_CONNECTION_TIMEOUT || '3500');
    custom.setHttpOptionsDefaults({ timeout: oidcTimeout });
    appLogger.log(`✅ OIDC timeout set to ${oidcTimeout}ms`);

    // Setup application middleware and pipes
    appLogger.log('Setting up application middleware and pipes...');
    await setupApplicationMiddleware(app, appLogger);
    appLogger.log('✅ Application middleware configured');

    // Configure URL prefix and excluded paths
    appLogger.log('Configuring URL prefix and excluded paths...');
    const { urlPrefix, pathsToExclude } = configureUrlPrefix();
    app.setGlobalPrefix(urlPrefix + 'api', { exclude: pathsToExclude });
    appLogger.log(`✅ URL prefix configured: ${urlPrefix}`);

    // Setup body parsers
    appLogger.log('Setting up body parsers...');
    setupBodyParsers(app, configService);
    appLogger.log('✅ Body parsers configured');

    // Enable versioning
    appLogger.log('Enabling API versioning...');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: VERSION_NEUTRAL,
    });
    appLogger.log('✅ API versioning enabled');

    // Setup security headers
    appLogger.log('Setting up security headers...');
    setSecurityHeaders(app, configService, appLogger);
    appLogger.log('✅ Security headers configured');

    // Setup static assets
    appLogger.log('Setting up static assets...');
    app.use(`${urlPrefix}/assets`, express.static(join(__dirname, '/assets')));
    appLogger.log('✅ Static assets configured');

    // Validate JWT guard
    appLogger.log('Validating Ability guard on controllers...');
    const guardValidator = app.get(GuardValidator);
    await guardValidator.validateJwtGuard();
    appLogger.log('✅ Ability guard validation completed');

    // Initialize Sentry
    initSentry(appLogger, configService);

    // Start server
    const listen_addr = process.env.LISTEN_ADDR || '::';
    const port = parseInt(process.env.PORT) || 3000;

    // Apply SCIM body parser ONLY for /scim routes, can cause streame not readable issues if not configured only for SCIM
    app.use('/api/scim', json({ type: ['application/json', 'application/scim+json'] }));

    appLogger.log(`Starting server on ${listen_addr}:${port}...`);
    await app.listen(port, listen_addr, async function () {
      logStartupInfo(configService, appLogger);
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

async function setupApplicationMiddleware(app: NestExpressApplication, appLogger: any) {
  app.useLogger(appLogger);
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector), appLogger, app.get(EventEmitter2)));
  app.useGlobalFilters(new AllExceptionsFilter(appLogger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
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
  // Exclude Bull Board dashboard and all its subroutes from global prefix
  // Need both: exact match for /jobs AND wildcard for /jobs/*
  pathsToExclude.push({ path: '/jobs', method: RequestMethod.ALL });
  pathsToExclude.push({ path: '/jobs/{*path}', method: RequestMethod.ALL });

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

// Bootstrap global agent only if TOOLJET_HTTP_PROXY is set
setupGlobalAgent();

// Main execution
bootstrap();
