/**
 * Test environment setup — app factory, plan-aware mocking, and database lifecycle.
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
import { InternalTable } from '@entities/internal_table.entity';

// ---------------------------------------------------------------------------
// Environment loading (runs once at module load time)
// ---------------------------------------------------------------------------

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8').trim();

const _testEnvVars = getEnvVars();
for (const [key, value] of Object.entries(_testEnvVars)) {
  if (process.env[key] === undefined && typeof value === 'string') {
    process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// DataSource singletons
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// App context cache (Spring Boot-style — reuse app across files with same config)
// ---------------------------------------------------------------------------

let _cachedApp: INestApplication | undefined;
let _cachedConfigKey: string | undefined;
let _cachedMocks: { mockConfig?: DeepMocked<ConfigService>; licenseServiceMock?: DeepMocked<LicenseService> } = {};

/**
 * Closes the NestJS test application and releases DataSource references.
 * Cached apps (shared across files) are NOT closed — they live for the entire
 * suite and are cleaned up by forceExit at process end.
 */
export async function closeTestApp(app: INestApplication | undefined): Promise<void> {
  if (!app || app === _cachedApp) return;
  await app.close();
  _defaultDataSource = undefined as any;
  _tooljetDbDataSource = undefined as any;
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Per-field mock values for license terms.
 * Guards and services expect specific shapes for certain fields.
 */
const LICENSE_FIELD_MOCK_VALUES: Record<string, any> = {
  workflows: {
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
  },
  // AuditLogsDurationGuard destructures status.licenseType
  status: { licenseType: 'ENTERPRISE' },
  // AuditLogsDurationGuard reads maxDurationForAuditLogs (numeric, in days)
  maxDaysForAuditLogs: 365,
};

/**
 * Creates a LicenseTermsService mock that survives jest.resetAllMocks().
 * Uses plain functions instead of jest.fn() so mock resets cannot clear them.
 * Returns 'UNLIMITED' for simple fields, structured objects for fields that
 * guards destructure (workflows, status, etc.), and handles array inputs
 * the same way constructLicenseFieldValue does.
 */
function createResilientLicenseTermsMock() {
  const resolveField = (field: string): any => {
    return field in LICENSE_FIELD_MOCK_VALUES ? LICENSE_FIELD_MOCK_VALUES[field] : 'UNLIMITED';
  };

  return {
    getLicenseTerms: (field: string | string[]) => {
      if (Array.isArray(field)) {
        const result: Record<string, any> = {};
        for (const key of field) {
          result[key] = resolveField(key);
        }
        return Promise.resolve(result);
      }
      return Promise.resolve(resolveField(field));
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
  /**
   * Additional NestJS DynamicModules to register alongside the default AppModule.
   * Useful for loading dynamic modules (e.g. AuditLogsModule) that are excluded
   * in migration context (IS_GET_CONTEXT: true).
   */
  extraImports?: any[];
  /**
   * When true, bypasses the context cache and creates a fresh NestJS app.
   * Use when tests need env vars set before app creation (e.g., ThrottlerModule config).
   * The fresh app is NOT cached and will be properly closed by closeTestApp().
   */
  freshApp?: boolean;
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
    edition = 'ee',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plan = 'enterprise',
    mockConfig = false,
    mockLicenseService = false,
    extraImports = [],
    freshApp = false,
  } = options ?? {};

  // Cache key: JSON fingerprint of config that affects app creation.
  // extraImports and freshApp are not cacheable.
  const configKey = (extraImports.length > 0 || freshApp)
    ? undefined
    : JSON.stringify({ edition, plan, mockConfig, mockLicenseService });

  // Cache hit — reuse existing app (Spring Boot-style context caching)
  // Also verify the DataSource is still alive (a spec may have called app.close() directly).
  if (configKey && _cachedApp && _cachedConfigKey === configKey) {
    try {
      const ds = _cachedApp.get(getDataSourceToken('default')) as TypeOrmDataSource;
      if (ds.isInitialized) {
        setDataSources(_cachedApp);
        const result: InitTestAppResult = { app: _cachedApp };
        if (_cachedMocks.mockConfig) result.mockConfig = _cachedMocks.mockConfig;
        if (_cachedMocks.licenseServiceMock) result.licenseServiceMock = _cachedMocks.licenseServiceMock;
        return result;
      }
    } catch {
      // DataSource retrieval failed — app was destroyed externally
    }
    // Cached app is dead — evict it
    _cachedApp = undefined;
    _cachedConfigKey = undefined;
    _cachedMocks = {};
  }

  // freshApp: skip cache eviction — create a standalone app alongside the cached one.
  // The cached app survives for the next file that needs the default config.
  if (!freshApp && _cachedApp) {
    // Cache miss with different config — close old cached app (use _realClose to bypass no-op)
    const realClose = (_cachedApp as any)._realClose || _cachedApp.close.bind(_cachedApp);
    try { await realClose(); } catch {}
    _cachedApp = undefined;
    _cachedConfigKey = undefined;
    _cachedMocks = {};
    _defaultDataSource = undefined as any;
    _tooljetDbDataSource = undefined as any;
  }

  // Set edition env var so AppModule and getImportPath() resolve correctly.
  process.env.TOOLJET_EDITION = edition;

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
    imports: [await AppModule.register({ IS_GET_CONTEXT: true }), ...extraImports],
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

  // Cache the app for reuse by subsequent files with the same config.
  // Override app.close() to be a no-op — prevents spec files that call
  // app.close() directly from destroying the shared cached app.
  if (configKey) {
    _cachedApp = app;
    _cachedConfigKey = configKey;
    _cachedMocks = {};
    if (result.mockConfig) _cachedMocks.mockConfig = result.mockConfig;
    if (result.licenseServiceMock) _cachedMocks.licenseServiceMock = result.licenseServiceMock;

    const _realClose = app.close.bind(app);
    (app as any)._realClose = _realClose;
    app.close = async () => { /* no-op for cached apps */ };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Database cleanup / reset
// ---------------------------------------------------------------------------

async function dropTooljetDbTables() {
  const ds = getDefaultDataSource();
  const tooljetDbDs = getTooljetDbDataSource();

  const internalTables = (await ds.manager.find(InternalTable, { select: ['id'] })) as InternalTable[];

  if (tooljetDbDs) {
    for (const table of internalTables) {
      await tooljetDbDs.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
    }
  }
}

/** Resets the test database -- truncates all tables, terminates stale connections, resets instance settings. */
export async function resetDB() {
  if (process.env.NODE_ENV !== 'test') return;
  await dropTooljetDbTables();

  const ds = getDefaultDataSource();
  if (!ds.isInitialized) await ds.initialize();

  // Legacy tables removed from DB but still have entity metadata registered
  const skippedTables = [
    'app_group_permissions',
    'data_source_group_permissions',
    'group_permissions',
    'user_group_permissions',
  ];

  const entities = ds.entityMetadatas;

  const existingRows: { table_name: string }[] = await ds.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existingSet = new Set(existingRows.map((r) => r.table_name));

  const tables: string[] = [];
  for (const entity of entities) {
    if (skippedTables.includes(entity.tableName)) continue;
    if (entity.tableName === 'instance_settings') continue;
    if (!existingSet.has(entity.tableName)) continue;
    tables.push(`"${entity.tableName}"`);
  }

  if (tables.length > 0) {
    // Terminate lingering backends that may hold locks from previous test files'
    // async operations (e.g., workflow executions completing after app.close()).
    try {
      await ds.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
          AND state = 'idle in transaction'
      `);
    } catch {}

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await ds.query(`SET lock_timeout = '3s'`);
        await ds.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
        await ds.query(`SET lock_timeout = 0`);
        break;
      } catch (err: unknown) {
        try { await ds.query(`SET lock_timeout = 0`); } catch {}
        if (attempt < 4) {
          // On first retry, kill ALL other connections (not just idle-in-transaction)
          if (attempt === 1) {
            try {
              await ds.query(`
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
              `);
            } catch {}
          }
          await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
          continue;
        }
        const message = err instanceof Error ? err.message.substring(0, 120) : String(err);
        console.error('resetDB: TRUNCATE failed after 5 attempts:', message);
      }
    }
  }

  if (existingSet.has('instance_settings')) {
    await ds.query(`UPDATE "instance_settings" SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE'`);
  }
}

