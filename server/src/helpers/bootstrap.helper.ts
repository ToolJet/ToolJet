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
export async function handleLicensingInit(app: NestExpressApplication) {
  const logger = createLogger('Licensing');
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
 * Replaces subpath placeholders in static assets
 */
export function replaceSubpathPlaceHoldersInStaticAssets() {
  const logger = createLogger('StaticAssets');
  const filesToReplaceAssetPath = ['index.html', 'runtime.js', 'main.js'];

  logger.log('Starting subpath placeholder replacement...');

  for (const fileName of filesToReplaceAssetPath) {
    try {
      const file = join(__dirname, '../../../../', 'frontend/build', fileName);
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

/**
 * Sets up security headers including CORS and CSP
 */
export function setSecurityHeaders(app: NestExpressApplication, configService: ConfigService) {
  const logger = createLogger('Security');
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
      res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
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
export function buildVersion(): string {
  const logger = createLogger('Version');

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
  logger.log(`Environment: ${configService.get<string>('NODE_ENV') || 'development'}`);
  logger.log(`Port: ${configService.get<string>('PORT') || 3000}`);
  logger.log(`Listen Address: ${configService.get<string>('LISTEN_ADDR') || '::'}`);
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
