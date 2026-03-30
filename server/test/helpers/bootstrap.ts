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

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();

const _testEnvVars = getEnvVars();
for (const [key, value] of Object.entries(_testEnvVars)) {
  if (process.env[key] === undefined && typeof value === 'string') {
    process.env[key] = value;
  }
}

let _defaultDataSource: TypeOrmDataSource;
let _tooljetDbDataSource: TypeOrmDataSource;

/** Captures TypeORM DataSource singletons from the NestJS app for use by test helpers. */
export function setDataSources(nestApp: INestApplication) {
  _defaultDataSource = nestApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
  try {
    _tooljetDbDataSource = nestApp.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
  } catch {
    // tooljetDb connection may not exist in all test configurations
  }
}

/** Returns the default TypeORM DataSource. Throws if setDataSources() was not called. */
export function getDefaultDataSource(): TypeOrmDataSource {
  if (!_defaultDataSource) {
    throw new Error('DataSource not initialized. Call setDataSources(app) in beforeAll.');
  }
  return _defaultDataSource;
}

/** Returns the ToolJet DB DataSource, or undefined if not configured. */
export function getTooljetDbDataSource(): TypeOrmDataSource | undefined {
  return _tooljetDbDataSource;
}

/**
 * Creates a LicenseTermsService mock that survives jest.resetAllMocks().
 * Uses plain functions instead of jest.fn() so mock resets cannot clear them.
 * Returns 'UNLIMITED' for simple fields and a structured object for 'workflows'
 * (workflow guards check .workspace/.instance sub-properties).
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

/** Applies standard NestJS app configuration (prefix, pipes, filters, versioning). */
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

/** Options for initializing the NestJS test application. */
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

/** Result of initTestApp containing the app and optional mocks. */
export interface InitTestAppResult {
  app: INestApplication;
  mockConfig?: DeepMocked<ConfigService>;
  licenseServiceMock?: DeepMocked<LicenseService>;
}

/**
 * Initializes a NestJS test application with edition and plan context.
 * @param options.mockConfig - When true, injects a DeepMocked ConfigService.
 * @param options.mockLicenseService - When true, injects a controllable LicenseService mock (use jest.spyOn to override).
 */
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

  const providers: Provider[] = [];

  if (mockConfig) {
    providers.push({
      provide: ConfigService,
      useValue: createMock<ConfigService>(),
    });
  }

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
    moduleBuilder.overrideProvider(LicenseTermsService).useValue(licenseServiceInstance);
  } else {
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
