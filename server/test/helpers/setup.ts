/**
 * Test environment setup — app factory, plan-aware mocking, and database lifecycle.
 *
 * Deep module design: callers declare WHAT they need (edition, plan), the
 * infrastructure handles HOW (caching, mocking, module registration).
 */
import { INestApplication, ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource as TypeOrmDataSource, QueryRunner } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from '@modules/app/module';
import { AuditLogsModule } from '@ee/audit-logs/module';
import { AllExceptionsFilter } from '@modules/app/filters/all-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
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
// Multi-slot cache keyed by edition: EE, CE, and Cloud each get their own slot.
// No eviction — each edition's app lives independently for the entire suite.
// `plan` does NOT affect the cache key — it reconfigures the mock instead.
// ---------------------------------------------------------------------------

interface CachedAppSlot {
  app: INestApplication;
  realClose: () => Promise<void>;
}

const _cache: Record<string, CachedAppSlot> = {};

function isCachedApp(app: INestApplication): boolean {
  return Object.values(_cache).some((slot) => slot.app === app);
}

/**
 * Closes the NestJS test application and releases DataSource references.
 * Cached apps (shared across files) are NOT closed — they live for the entire
 * suite. Real close() is stored and called at process exit.
 */
export async function closeTestApp(app: INestApplication | undefined): Promise<void> {
  if (!app || isCachedApp(app)) return;
  await app.close();
  // Restore DataSources from the most recently used cached app (prefer EE).
  const fallback = _cache['ee'] || Object.values(_cache)[0];
  if (fallback) {
    setDataSources(fallback.app);
  } else {
    _defaultDataSource = undefined as any;
    _tooljetDbDataSource = undefined as any;
  }
}

// ---------------------------------------------------------------------------
// Transaction-per-test rollback (Rails-style)
//
// Wraps each test in a DB transaction. ROLLBACK at the end undoes all changes
// instantly (~1ms) instead of TRUNCATE (~200ms). PostgreSQL's transactional DDL
// means CREATE/DROP TABLE are also rolled back.
// ---------------------------------------------------------------------------

let _testQR: QueryRunner | undefined;
let _testQR_tj: QueryRunner | undefined;
let _origCreateQR: ((...args: any[]) => QueryRunner) | undefined;
let _origCreateQR_tj: ((...args: any[]) => QueryRunner) | undefined;

/** Creates a proxy around the test's QueryRunner that prevents release() and maps nested transactions to SAVEPOINTs. */
function createQRProxy(realQR: QueryRunner): QueryRunner {
  let savepointId = 0;
  const savepointStack: string[] = [];

  return new Proxy(realQR, {
    get(target, prop, receiver) {
      if (prop === 'release') return async () => {};

      if (prop === 'startTransaction') {
        return async () => {
          const sp = `sp_${++savepointId}`;
          savepointStack.push(sp);
          await realQR.query(`SAVEPOINT ${sp}`);
        };
      }

      if (prop === 'commitTransaction') {
        return async () => {
          const sp = savepointStack.pop();
          if (sp) await realQR.query(`RELEASE SAVEPOINT ${sp}`);
        };
      }

      if (prop === 'rollbackTransaction') {
        return async () => {
          const sp = savepointStack.pop();
          if (sp) await realQR.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        };
      }

      if (prop === 'isTransactionActive') return true;

      return Reflect.get(target, prop, receiver);
    },
  });
}

/** Starts a test transaction on both DataSources. Call in beforeEach. */
export async function beginTestTransaction() {
  // Skip if DataSource isn't initialized yet (beforeAll hasn't run initTestApp)
  if (!_defaultDataSource) return;
  const ds = getDefaultDataSource();
  _origCreateQR = ds.createQueryRunner.bind(ds);
  _testQR = _origCreateQR();
  await _testQR.connect();
  await _testQR.startTransaction();
  ds.createQueryRunner = () => createQRProxy(_testQR!);

  const tjDs = getTooljetDbDataSource();
  if (tjDs) {
    _origCreateQR_tj = tjDs.createQueryRunner.bind(tjDs);
    _testQR_tj = _origCreateQR_tj();
    await _testQR_tj.connect();
    await _testQR_tj.startTransaction();
    tjDs.createQueryRunner = () => createQRProxy(_testQR_tj!);
  }
}

/** Rolls back the test transaction on both DataSources. Call in afterEach. */
export async function rollbackTestTransaction() {
  if (!_testQR) return; // no transaction active (beforeAll hasn't run yet)
  const ds = getDefaultDataSource();
  if (_testQR) {
    await _testQR.rollbackTransaction();
    await _testQR.release();
    _testQR = undefined;
  }
  if (_origCreateQR) {
    ds.createQueryRunner = _origCreateQR as any;
    _origCreateQR = undefined;
  }

  const tjDs = getTooljetDbDataSource();
  if (tjDs && _testQR_tj) {
    await _testQR_tj.rollbackTransaction();
    await _testQR_tj.release();
    _testQR_tj = undefined;
  }
  if (tjDs && _origCreateQR_tj) {
    tjDs.createQueryRunner = _origCreateQR_tj as any;
    _origCreateQR_tj = undefined;
  }
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Per-field mock values for license terms (enterprise plan — all unlocked).
 * Guards and services expect specific shapes for certain fields.
 */
const LICENSE_FIELD_DEFAULTS: Record<string, any> = {
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
  status: { licenseType: 'ENTERPRISE' },
  maxDaysForAuditLogs: 365,
};

/**
 * Plan-specific overrides merged on top of LICENSE_FIELD_DEFAULTS.
 * Extensible — add plan-specific values as tests need them.
 */
const PLAN_TERMS: Record<string, Record<string, any>> = {
  enterprise: {},
  team: { status: { licenseType: 'BUSINESS' }, maxDaysForAuditLogs: 90 },
  trial: { status: { licenseType: 'TRIAL' }, maxDaysForAuditLogs: 7 },
  basic: { status: { licenseType: 'BUSINESS' }, maxDaysForAuditLogs: 30 },
  starter: { status: { licenseType: 'BUSINESS' }, maxDaysForAuditLogs: 30 },
  pro: { status: { licenseType: 'BUSINESS' }, maxDaysForAuditLogs: 180 },
};

/**
 * Creates a LicenseTermsService mock that survives jest.resetAllMocks().
 * Uses plain functions instead of jest.fn() so mock resets cannot clear them.
 * The mock is plan-aware — call configurePlanMock() to switch plans.
 */
function createResilientLicenseTermsMock() {
  const mock = {
    _fieldValues: { ...LICENSE_FIELD_DEFAULTS } as Record<string, any>,

    getLicenseTerms(field: string | string[]) {
      const resolve = (f: string) =>
        f in mock._fieldValues ? mock._fieldValues[f] : 'UNLIMITED';

      if (Array.isArray(field)) {
        const result: Record<string, any> = {};
        for (const key of field) result[key] = resolve(key);
        return Promise.resolve(result);
      }
      return Promise.resolve(resolve(field));
    },

    getLicenseTermsInstance: () => Promise.resolve('UNLIMITED'),
  };
  return mock;
}

/** Reconfigures the resilient mock's field values for the given plan. */
function configurePlanMock(app: INestApplication, plan: string) {
  const lts = app.get(LicenseTermsService) as ReturnType<typeof createResilientLicenseTermsMock>;
  if (!lts._fieldValues) return; // not our mock — skip
  lts._fieldValues = { ...LICENSE_FIELD_DEFAULTS, ...(PLAN_TERMS[plan] ?? {}) };
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
  /** Edition to simulate. Default: 'ee'. Each edition loads different modules — gets its own cache slot. */
  edition?: 'ce' | 'ee' | 'cloud';
  /**
   * License plan to simulate. Default: 'enterprise' (all features unlocked).
   * Does NOT create a new app — reconfigures the LicenseTermsService mock
   * on the cached app to return plan-appropriate values.
   */
  plan?: 'basic' | 'starter' | 'pro' | 'team' | 'enterprise' | 'trial';
  /**
   * When true, bypasses the context cache and creates a fresh NestJS app.
   * Use when tests need env vars set before app creation (e.g., ThrottlerModule config).
   * The fresh app is NOT cached and will be properly closed by closeTestApp().
   */
  freshApp?: boolean;
}

/** Result of initTestApp. */
export interface InitTestAppResult {
  app: INestApplication;
}

/**
 * Initializes a NestJS test application with edition and plan context.
 *
 * Deep module: callers declare edition/plan, the infrastructure handles
 * caching (multi-slot by edition), mock configuration (plan-aware
 * LicenseTermsService), and module registration (AuditLogsModule included).
 */
export async function initTestApp(options?: InitTestAppOptions): Promise<InitTestAppResult> {
  const {
    edition = 'ee',
    plan = 'enterprise',
    freshApp = false,
  } = options ?? {};

  // Cache key: only edition matters. Plan reconfigures the mock, not the app.
  const isCacheable = !freshApp;
  const cacheKey = isCacheable ? edition : undefined;

  // Cache hit — reuse existing app for this edition
  if (cacheKey && _cache[cacheKey]) {
    const slot = _cache[cacheKey];
    try {
      const ds = slot.app.get(getDataSourceToken('default')) as TypeOrmDataSource;
      if (ds.isInitialized) {
        // Restore spies left by previous describes on shared services.
        // Without this, jest.resetAllMocks() in afterEach leaves spies installed
        // but returning undefined — poisoning the next describe's service calls.
        jest.restoreAllMocks();
        setDataSources(slot.app);
        configurePlanMock(slot.app, plan);
        return { app: slot.app };
      }
    } catch {
      // DataSource retrieval failed — app was destroyed externally
    }
    delete _cache[cacheKey];
  }

  // Set edition env var so AppModule and getImportPath() resolve correctly.
  process.env.TOOLJET_EDITION = edition;

  const moduleBuilder = Test.createTestingModule({
    imports: [
      await AppModule.register({ IS_GET_CONTEXT: true }),
      await AuditLogsModule.register({ IS_GET_CONTEXT: true }),
    ],
  });

  moduleBuilder.overrideProvider(LicenseTermsService).useValue(createResilientLicenseTermsMock());

  const moduleRef = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();

  await configureApp(app, moduleRef);
  await app.init();
  setDataSources(app);
  configurePlanMock(app, plan);

  // Cache the app for reuse by subsequent files with the same edition.
  // Store real close() for process-exit cleanup; override to no-op so
  // spec files that call app.close() directly can't destroy the shared app.
  if (cacheKey) {
    const realClose = app.close.bind(app);
    app.close = async () => {};
    _cache[cacheKey] = { app, realClose };
  }

  return { app };
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

/** Resets the test database. No-op when transaction rollback is active. */
export async function resetDB() {
  if (process.env.NODE_ENV !== 'test') return;
  // Transaction rollback handles cleanup — previous test's changes were rolled back.
  if (_testQR) return;
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
    // With context caching, the pg-pool is shared across files.
    // Do NOT call pg_terminate_backend — it kills connections from our own pool,
    // corrupting the shared pool and causing "Connection terminated" errors.
    // The zombie fixes (no ScheduleModule, no ioredis reconnection) eliminate
    // the lingering backends that pg_terminate_backend was trying to clean up.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await ds.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
        break;
      } catch (err: unknown) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
          continue;
        }
        const message = err instanceof Error ? err.message.substring(0, 120) : String(err);
        console.error('resetDB: TRUNCATE failed after 3 attempts:', message);
      }
    }
  }

  if (existingSet.has('instance_settings')) {
    await ds.query(`UPDATE "instance_settings" SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE'`);
  }
}

