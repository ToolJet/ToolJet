import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { bootstrap as globalAgentBootstrap } from 'global-agent';
import { join } from 'path';
import helmet from 'helmet';
import * as fs from 'fs';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { ILicenseUtilService } from '@modules/licensing/interfaces/IUtilService';
import { getTooljetEdition } from '@helpers/utils.helper';
import * as Sentry from '@sentry/nestjs';

/**
 * Creates a logger instance with a specific context
 */
export function createLogger(context: string) {
  return {
    log: (message: string, ...optionalParams: any[]) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${context}] ${message}`, ...optionalParams);
    },
    error: (message: string, error?: any) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [${context}] ERROR: ${message}`, error);
    },
    warn: (message: string, ...optionalParams: any[]) => {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [${context}] WARN: ${message}`, ...optionalParams);
    },
  };
}

/**
 * Raw body buffer handler for request processing
 */
export function rawBodyBuffer(req: any, res: any, buf: Buffer, encoding: BufferEncoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

/**
 * Handles licensing initialization for Enterprise Edition
 */
export async function handleLicensingInit(app: NestExpressApplication, logger: any) {
  const tooljetEdition = getTooljetEdition() as TOOLJET_EDITIONS;

  logger.log(`Current edition: ${tooljetEdition}`);

  if (tooljetEdition !== TOOLJET_EDITIONS.EE) {
    logger.log('Skipping licensing initialization for non-EE edition');
    return;
  }

  try {
    logger.log('Initializing Enterprise Edition licensing...');
    const importPath = await getImportPath(false, tooljetEdition);
    const { LicenseUtilService } = await import(`${importPath}/licensing/util.service`);

    const licenseInitService = app.get<LicenseInitService>(LicenseInitService);
    const licenseUtilService = app.get<ILicenseUtilService>(LicenseUtilService);

    logger.log('Calling license initialization service...');
    await licenseInitService.init();
    logger.log('✅ License initialization completed');

    logger.log('Loading license configuration...');
    const License = await import(`${importPath}/licensing/configs/License`);
    const license = License.default;

    logger.log('Validating hostname and subpath...');
    licenseUtilService.validateHostnameSubpath(license.Instance()?.domains);

    const licenseInfo = license.Instance();
    logger.log(`✅ License validation completed`);
    logger.log(`License valid: ${licenseInfo.isValid}`);
    logger.log(`License terms: ${JSON.stringify(licenseInfo.terms)}`);

    console.log(`License valid : ${licenseInfo.isValid} License Terms : ${JSON.stringify(licenseInfo.terms)} 🚀`);
  } catch (error) {
    logger.error('❌ Failed to initialize licensing:', error);
    throw error;
  }
}

/**
 * Applies OTEL middleware to Express app
 * Note: The OTEL SDK is started at import time in src/otel/tracing.ts
 * This function only applies the middleware after the app is created
 */
export async function initializeOtel(app: NestExpressApplication, logger: any) {
  // Check if OTEL is enabled
  if (process.env.ENABLE_OTEL !== 'true') {
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      logger.log('⏭️ OTEL disabled (ENABLE_OTEL not set to true)');
    }
    return;
  }

  try {
    const tooljetEdition = getTooljetEdition() as TOOLJET_EDITIONS;

    if (tooljetEdition !== TOOLJET_EDITIONS.EE && tooljetEdition !== TOOLJET_EDITIONS.Cloud) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        logger.log('⏭️ OTEL skipped - not Enterprise or Cloud edition');
      }
      return;
    }

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      logger.log('🔭 Applying OpenTelemetry middleware...');
    }

    // Import otelMiddleware from tracing.ts (use relative path for runtime compatibility)
    const { otelMiddleware } = await import('../otel/tracing');

    // Apply OTEL middleware to Express app
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use(otelMiddleware);

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      logger.log('✅ OpenTelemetry middleware applied successfully');
      logger.log('   - SDK: Already started at import time');
      logger.log('   - Tracing: Enabled');
      logger.log('   - Metrics: Enabled');
      logger.log('   - Auto-instrumentation: Active');
    }
  } catch (error) {
    logger.error('❌ Failed to initialize OpenTelemetry:', error);
    // Don't throw - observability should never break the app
  }
}

/**
 * Replaces subpath placeholders in static assets
 */
export function replaceSubpathPlaceHoldersInStaticAssets(logger: any) {
  logger.log('Starting subpath placeholder replacement...');

  const buildDir = join(__dirname, '../../../../', 'frontend/build');

  // Get all files that need subpath replacement
  // index.html is always present, runtime/main files may have contenthash in production
  const allFiles = fs.readdirSync(buildDir);
  const filesToReplaceAssetPath = [
    'index.html',
    ...allFiles.filter((f) => /^runtime(\.[a-f0-9]+)?\.js$/.test(f)),
    ...allFiles.filter((f) => /^main(\.[a-f0-9]+)?\.js$/.test(f)),
  ];

  logger.log(`Files to process: ${filesToReplaceAssetPath.join(', ')}`);

  for (const fileName of filesToReplaceAssetPath) {
    try {
      const file = join(buildDir, fileName);
      logger.log(`Processing file: ${fileName}`);

      let newValue = process.env.SUB_PATH;

      if (process.env.SUB_PATH === undefined) {
        newValue = fileName === 'index.html' ? '/' : '';
        logger.log(`Using default value for ${fileName}: "${newValue}"`);
      } else {
        logger.log(`Using SUB_PATH value for ${fileName}: "${newValue}"`);
      }

      if (!fs.existsSync(file)) {
        logger.warn(`File not found: ${file}`);
        continue;
      }

      const data = fs.readFileSync(file, { encoding: 'utf8' });
      const result = data
        .replace(/__REPLACE_SUB_PATH__\/api/g, join(newValue, '/api'))
        .replace(/__REPLACE_SUB_PATH__/g, newValue);

      fs.writeFileSync(file, result, { encoding: 'utf8' });
      logger.log(`✅ Successfully processed: ${fileName}`);
    } catch (error) {
      logger.error(`❌ Failed to process ${fileName}:`, error);
    }
  }

  logger.log('✅ Subpath placeholder replacement completed');
}

export function initSentry(logger: any, configService: ConfigService) {
  if (configService.get<string>('APM_VENDOR') !== 'sentry') return;

  logger.log('Initializing Sentry...');
  // Sentry initialization logic here
  try {
    Sentry.init({
      dsn: configService.get<string>('SENTRY_DNS'),
      tracesSampleRate: 1.0,
      environment: configService.get<string>('NODE_ENV') || 'development',
      debug: !!configService.get<string>('SENTRY_DEBUG'),
      sendDefaultPii: true,
    });
  } catch (error) {
    logger.error('❌ Failed to set Sentry options:', error);
  }
  logger.log('✅ Sentry initialization completed');
}

/**
 * Sets up security headers including CORS and CSP
 */
export function setSecurityHeaders(app: NestExpressApplication, configService: ConfigService, logger: any) {
  logger.log('Setting up security headers...');

  try {
    const tooljetHost = configService.get<string>('TOOLJET_HOST');
    const host = new URL(tooljetHost);
    const domain = host.hostname;

    logger.log(`Configuring CORS for domain: ${domain}`);
    logger.log(`CORS enabled: ${configService.get<string>('ENABLE_CORS') === 'true'}`);

    // Enable CORS
    app.enableCors({
      origin: configService.get<string>('ENABLE_CORS') === 'true' || tooljetHost,
      credentials: true,
      maxAge: 86400,
    });

    // Get CSP whitelisted domains
    const cspWhitelistedDomains = configService.get<string>('CSP_WHITELISTED_DOMAINS')?.split(',') || [];
    logger.log(`CSP whitelisted domains: ${cspWhitelistedDomains.join(', ')}`);

    // Configure Helmet
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
            ].concat(cspWhitelistedDomains),
            'object-src': ["'self'", 'data:'],
            'media-src': ["'self'", 'data:', 'blob:'],
            'default-src': [
              'maps.googleapis.com',
              'storage.googleapis.com',
              'apis.google.com',
              'accounts.google.com',
              '*.sentry.io',
              "'self'",
              'blob:',
              'www.googletagmanager.com',
            ].concat(cspWhitelistedDomains),
            'connect-src': ['ws://' + domain, "'self'", '*', 'data:'],
            'frame-ancestors': ['*'],
            'frame-src': ['*'],
          },
        },
        frameguard: configService.get<string>('DISABLE_APP_EMBED') !== 'true' ? false : { action: 'deny' },
        hidePoweredBy: true,
        referrerPolicy: {
          policy: 'no-referrer',
        },
      })
    );

    logger.log(`Frame embedding ${configService.get('DISABLE_APP_EMBED') !== 'true' ? 'enabled' : 'disabled'}`);

    const subPath = configService.get<string>('SUB_PATH');

    // Custom headers middleware
    app.use((req, res, next) => {
      res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=(self)');
      res.setHeader('X-Powered-By', 'ToolJet');

      if (req.path.startsWith(`${subPath || '/'}api/`)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }

      return next();
    });

    logger.log('✅ Security headers configured successfully');
  } catch (error) {
    logger.error('❌ Failed to configure security headers:', error);
    throw error;
  }
}

/**
 * Builds the application version string
 */
export function buildVersion(logger: any): string {
  try {
    logger.log('Reading version from .version file...');
    const rawVersion = fs.readFileSync('./.version', 'utf8').trim();
    logger.log(`Raw version: ${rawVersion}`);

    const ltsRegex = /-lts$/i;
    const edition = getTooljetEdition();

    let version: string;
    if (ltsRegex.test(rawVersion)) {
      // Extract base version (everything before -lts)
      const baseVersion = rawVersion.replace(ltsRegex, '');
      // Construct: baseVersion-edition-lts
      version = `${baseVersion}-${edition}-lts`;
      logger.log(`LTS version detected. Built version: ${version}`);
    } else {
      // Current implementation: version-edition
      version = `${rawVersion}-${edition}`;
      logger.log(`Standard version. Built version: ${version}`);
    }

    return version;
  } catch (error) {
    logger.error('❌ Failed to build version:', error);
    throw error;
  }
}

/**
 * Sets up global agent for HTTP proxy if configured
 */
export function setupGlobalAgent() {
  const logger = createLogger('GlobalAgent');

  if (process.env.TOOLJET_HTTP_PROXY) {
    logger.log(`Setting up global HTTP proxy: ${process.env.TOOLJET_HTTP_PROXY}`);
    process.env['GLOBAL_AGENT_HTTP_PROXY'] = process.env.TOOLJET_HTTP_PROXY;
    globalAgentBootstrap();
    logger.log('✅ Global HTTP proxy configured');
  } else {
    logger.log('No HTTP proxy configured');
  }
}

/**
 * Logs startup information
 */
export function logStartupInfo(configService: ConfigService, logger: any) {
  const tooljetHost = configService.get<string>('TOOLJET_HOST');
  const subPath = configService.get<string>('SUB_PATH');
  const corsEnabled = configService.get('ENABLE_CORS') === 'true';
  const edition = getTooljetEdition();
  const version = globalThis.TOOLJET_VERSION;

  logger.log('='.repeat(60));
  logger.log('🚀 TOOLJET APPLICATION STARTED SUCCESSFULLY');
  logger.log('='.repeat(60));
  logger.log(`Edition: ${edition}`);
  logger.log(`Version: ${version}`);
  logger.log(`Host: ${tooljetHost}${subPath || ''}`);
  logger.log(`Subpath: ${subPath || 'None'}`);
  logger.log(`CSP Whitelisted Domains: ${configService.get('CSP_WHITELISTED_DOMAINS') || 'None'}`);
  logger.log(`CORS Enabled: ${corsEnabled}`);
  logger.log(`global HTTP proxy: ${configService.get<string>('TOOLJET_HTTP_PROXY') || 'Not configured'}`);
  logger.log(`Frame embedding: ${configService.get<string>('DISABLE_APP_EMBED') !== 'true' ? 'enabled' : 'disabled'}`);
  logger.log(`Metrics Enabled: ${configService.get('ENABLE_METRICS') === 'true'}`);

  const otelEnabled = configService.get('ENABLE_OTEL') === 'true';
  logger.log(`OpenTelemetry: ${otelEnabled ? 'Enabled' : 'Disabled'}`);
  if (otelEnabled) {
    logger.log(`  - Tracing: ${otelEnabled ? 'Active' : 'Inactive'}`);
    logger.log(`  - Metrics: ${otelEnabled ? 'Active' : 'Inactive'}`);
    logger.log(`  - App Metrics: ${otelEnabled ? 'Active' : 'Inactive'}`);
  }

  logger.log(`Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
  logger.log(`Port: ${configService.get<string>('PORT') || 3000}`);
  logger.log(`Listen Address: ${configService.get<string>('LISTEN_ADDR') || '::'}`);
  logger.log('='.repeat(60));
  logger.log(
    `Custom ORM logger: ${configService.get<string>('DISABLE_CUSTOM_QUERY_LOGGING') !== 'true' ? 'enabled' : 'disabled'}`
  );
  logger.log(
    `Custom ORM logger logging level: ${configService.get<string>('CUSTOM_QUERY_LOGGING_LEVEL') || 'Not - configured'}`
  );
  logger.log(`ORM logging level: ${configService.get<string>('ORM_LOGGING') || 'Not - configured'}`);
  logger.log(
    `ORM Slow Query logging threshold in ms: ${configService.get<string>('ORM_SLOW_QUERY_LOGGING_THRESHOLD') || 'Not - configured'}`
  );
  logger.log(
    `Transaction logging level: ${configService.get<string>('TRANSACTION_LOGGING_LEVEL') || 'Not - configured'}`
  );
  logger.log(`Metrics Enabled: ${configService.get('ENABLE_METRICS') === 'true'}`);
  logger.log('='.repeat(60));
}

/**
 * Logs shutdown information
 */
export function logShutdownInfo(signal: string, logger: any) {
  logger.log('='.repeat(60));
  logger.log(`🛑 ${signal} SIGNAL RECEIVED - SHUTTING DOWN`);
  logger.log('='.repeat(60));
  logger.log('Gracefully closing application...');
}
