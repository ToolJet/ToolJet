/**
 * bootstrap.ts — Test application factory and global side effects.
 *
 * This module owns:
 * - Global side effects (TOOLJET_VERSION, .env.test loading)
 * - NestJS test app instantiation (initTestApp)
 * - DataSource singleton management (setDataSources, getDefaultDataSource, getTooljetDbDataSource)
 *
 * IMPORTANT: This module imports NOTHING from test.helper.ts to avoid circular dependencies.
 */

import { INestApplication, ValidationPipe, VersioningType, VERSION_NEUTRAL, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from '@modules/app/module';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { WsAdapter } from '@nestjs/platform-ws';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import * as cookieParser from 'cookie-parser';
import { LicenseService } from '@modules/licensing/service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import * as fs from 'fs';
import { getEnvVars } from 'scripts/database-config-utils';

// ---------------------------------------------------------------------------
// Global side effects
// ---------------------------------------------------------------------------

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();

// Load env vars from .env.test into process.env so ConfigService works consistently
// in both NestJS modules and standalone test helpers (buildTestSession, buildAuthHeader).
const _testEnvVars = getEnvVars();
for (const [key, value] of Object.entries(_testEnvVars)) {
  if (process.env[key] === undefined && typeof value === 'string') {
    process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Module-level state: DataSource singletons
// ---------------------------------------------------------------------------

let _defaultDataSource: TypeOrmDataSource;
let _tooljetDbDataSource: TypeOrmDataSource;

export function setDataSources(nestApp: INestApplication) {
  _defaultDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  try {
    _tooljetDbDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
  } catch {
    // tooljetDb connection may not exist in all test configurations
  }
}

export function getDefaultDataSource(): TypeOrmDataSource {
  if (!_defaultDataSource) {
    throw new Error('DataSource not initialized. Call setDataSources(app) in beforeAll.');
  }
  return _defaultDataSource;
}

export function getTooljetDbDataSource(): TypeOrmDataSource | undefined {
  return _tooljetDbDataSource;
}

// ---------------------------------------------------------------------------
// Resilient license terms mock
// ---------------------------------------------------------------------------

/**
 * Creates a resilient LicenseTermsService mock that cannot be cleared by jest.resetAllMocks().
 * Uses plain functions (NOT jest.fn()) so they survive mock resets.
 *
 * Returns field-appropriate values:
 * - 'UNLIMITED' for simple boolean/string fields
 * - Structured object with UNLIMITED sub-properties for WORKFLOWS
 *   (workflow guards check .workspace/.instance properties)
 */
function createResilientLicenseTermsMock() {
  return {
    getLicenseTerms: (field: string) => {
      if (field === 'workflows') {
        return Promise.resolve({
          execution_timeout: 'UNLIMITED',
          workspace: {
            total: 'UNLIMITED',
            daily_executions: 'UNLIMITED',
            monthly_executions: 'UNLIMITED',
          },
          instance: {
            total: 'UNLIMITED',
            daily_executions: 'UNLIMITED',
            monthly_executions: 'UNLIMITED',
          },
        });
      }
      return Promise.resolve('UNLIMITED');
    },
    getLicenseTermsInstance: () => Promise.resolve('UNLIMITED'),
  };
}

// ---------------------------------------------------------------------------
// App configuration helper (shared across all factory functions)
// ---------------------------------------------------------------------------

async function configureApp(app: INestApplication, moduleRef: { get: <T>(token: unknown) => T }): Promise<void> {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter(moduleRef.get(Logger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
  });
}

// ---------------------------------------------------------------------------
// initTestApp — plan-aware unified test app factory
// ---------------------------------------------------------------------------

export interface InitTestAppOptions {
  /** Edition to simulate. Default: 'ee' */
  edition?: 'ce' | 'ee' | 'cloud';
  /** License plan to simulate. Default: 'enterprise' (all features unlocked). */
  plan?: 'basic' | 'starter' | 'pro' | 'team' | 'enterprise';
  /** When true, provides a DeepMocked<ConfigService> (for overriding config in tests). */
  mockConfig?: boolean;
  /** When true, provides a DeepMocked<LicenseService> (for overriding license checks in tests). */
  mockLicenseService?: boolean;
}

export interface InitTestAppResult {
  app: INestApplication;
  mockConfig?: DeepMocked<ConfigService>;
  licenseServiceMock?: DeepMocked<LicenseService>;
}

export async function initTestApp(options?: InitTestAppOptions): Promise<InitTestAppResult> {
  const {
    // edition and plan are reserved for future use; currently tests always run
    // as ee/enterprise since that's what AppModule.register provides.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    edition = 'ee',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plan = 'enterprise',
    mockConfig = false,
    mockLicenseService = false,
  } = options ?? {};

  // Build providers list
  const providers: Provider[] = [];

  if (mockConfig) {
    providers.push({
      provide: ConfigService,
      useValue: createMock<ConfigService>(),
    });
  }

  // When mockLicenseService is true, create a mock that serves as both
  // LicenseService AND LicenseTermsService. Uses jest.fn() with sensible defaults
  // so tests can use jest.spyOn to override specific behavior.
  const licenseServiceInstance = mockLicenseService
    ? {
        ...createMock<LicenseService>(),
        getLicenseTerms: jest.fn((field: string) => {
          if (field === 'workflows') {
            return Promise.resolve({
              execution_timeout: 'UNLIMITED',
              workspace: { total: 'UNLIMITED', daily_executions: 'UNLIMITED', monthly_executions: 'UNLIMITED' },
              instance: { total: 'UNLIMITED', daily_executions: 'UNLIMITED', monthly_executions: 'UNLIMITED' },
            });
          }
          return Promise.resolve('UNLIMITED');
        }),
        getLicenseTermsInstance: jest.fn(() => Promise.resolve('UNLIMITED')),
      }
    : null;

  if (mockLicenseService && licenseServiceInstance) {
    providers.push({
      provide: LicenseService,
      useValue: licenseServiceInstance,
    });
  }

  const moduleBuilder = Test.createTestingModule({
    imports: [await AppModule.register({ IS_GET_CONTEXT: true })],
    providers,
  });

  if (mockLicenseService && licenseServiceInstance) {
    // When mocking LicenseService, use the same instance for LicenseTermsService
    // so tests can control guard behavior via jest.spyOn(licenseServiceMock, 'getLicenseTerms')
    moduleBuilder.overrideProvider(LicenseTermsService).useValue(licenseServiceInstance);
  } else {
    // Use the resilient mock that survives jest.resetAllMocks()
    moduleBuilder.overrideProvider(LicenseTermsService).useValue(createResilientLicenseTermsMock());
  }

  const moduleRef = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();

  await configureApp(app, moduleRef);
  await app.init();
  setDataSources(app);

  const result: InitTestAppResult = { app };

  if (mockConfig) {
    result.mockConfig = moduleRef.get(ConfigService);
  }

  if (mockLicenseService) {
    result.licenseServiceMock = moduleRef.get(LicenseService);
  }

  return result;
}

