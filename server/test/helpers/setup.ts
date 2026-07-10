/** App factory with caching, license mocking, and DB lifecycle for tests. */
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
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { LICENSE_FIELD, LICENSE_TYPE } from '@modules/licensing/constants';
import {
  BASIC_PLAN_TERMS,
  STARTER_PLAN_TERMS_CLOUD,
  PRO_PLAN_TERMS_CLOUD,
  TEAM_PLAN_TERMS_CLOUD,
} from '@ee/licensing/constants/PlanTerms';
import { BASIC_PLAN_TERMS as CE_BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { Terms } from '@modules/licensing/interfaces/terms';
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

/**
 * Destroy all known TypeORM DataSources (closes pool connections).
 * Lighter than closeAllCachedApps() — skips NestJS lifecycle hooks that
 * can create new handles during teardown. Use for clean process exit.
 */
export async function destroyAllDataSources() {
  if (_defaultDataSource?.isInitialized) {
    await _defaultDataSource.destroy().catch(() => {});
  }
  if (_tooljetDbDataSource?.isInitialized) {
    await _tooljetDbDataSource.destroy().catch(() => {});
  }
}

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
// App context cache — one slot per edition, no eviction.
// `plan` reconfigures the mock, not the app.
// ---------------------------------------------------------------------------

interface CachedAppSlot {
  app: INestApplication;
  realClose: () => Promise<void>;
}

const _cache: Record<string, CachedAppSlot> = {};

/**
 * Closes all cached NestJS apps so DB connections are released gracefully.
 *
 * Called automatically via a deferred timer in jest-transaction-setup.ts's
 * afterAll. The timer fires after the last spec file in the worker — if
 * another spec starts, beforeEach cancels the timer and apps stay alive.
 * A globalTeardown can't help because it runs in the main Jest process,
 * not the worker where the cache lives.
 */
export async function closeAllCachedApps(): Promise<void> {
  for (const [key, slot] of Object.entries(_cache)) {
    try {
      await slot.realClose();
    } catch {
      // Best-effort — process is exiting anyway
    }
    delete _cache[key];
  }
}

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
// Two-level transaction isolation (no-op proxy)
//
// Suite transaction: wraps the entire spec (beforeAll seed + all tests).
// Test savepoints:   isolate individual tests within the suite.
//
// The QR proxy is a no-op: service code's start/commit/rollback are silently
// ignored. All queries route through the suite transaction. No savepoints
// from the proxy = no concurrent collision.
//
// Suite TX (real BEGIN/ROLLBACK)
//   └─ beforeAll seed data
//   └─ SAVEPOINT test_1    ← beginTestTransaction
//   │    └─ test body
//   └─ ROLLBACK TO test_1  ← rollbackTestTransaction
//   └─ SAVEPOINT test_2
//   └─ ...
// ROLLBACK                  ← rollbackSuiteTransaction
// ---------------------------------------------------------------------------

// Suite-level: one real transaction per spec file
let _suiteQR: QueryRunner | undefined;
let _suiteQR_tj: QueryRunner | undefined;
let _suiteOrigCreateQR: ((...args: any[]) => QueryRunner) | undefined;
let _suiteOrigCreateQR_tj: ((...args: any[]) => QueryRunner) | undefined;
// Track which DataSource the suite TX was created on (for edition-switch detection)
let _suiteDS: TypeOrmDataSource | undefined;

// Test-level: SAVEPOINT name within the suite transaction
let _testSavepoint: string | undefined;
let _testSavepointId = 0;

/** No-op proxy: routes all queries through the suite QR, ignores transaction management. */
function createQRProxy(realQR: QueryRunner): QueryRunner {
  return new Proxy(realQR, {
    get(target, prop, receiver) {
      if (prop === 'release') return async () => {};
      if (prop === 'startTransaction') return async () => {};
      if (prop === 'commitTransaction') return async () => {};
      if (prop === 'rollbackTransaction') return async () => {};
      if (prop === 'isTransactionActive') return true;
      return Reflect.get(target, prop, receiver);
    },
  });
}

/** Starts a suite-level transaction. Installs the no-op proxy on both DataSources. */
export async function beginSuiteTransaction() {
  if (!_defaultDataSource) return;
  const ds = getDefaultDataSource();

  // Edition switch: suite TX is on a different DataSource. Rollback the old one
  // so we can start fresh on the new DataSource (the no-op proxy must be
  // installed on the DataSource that tests actually use).
  if (_suiteQR && _suiteDS && _suiteDS !== ds) {
    const origDs = _defaultDataSource;
    _defaultDataSource = _suiteDS;
    await rollbackSuiteTransaction();
    _defaultDataSource = origDs;
  }

  if (_suiteQR) return;
  _suiteDS = ds;
  _suiteOrigCreateQR = ds.createQueryRunner.bind(ds);
  _suiteQR = _suiteOrigCreateQR();
  await _suiteQR.connect();
  await _suiteQR.startTransaction();
  ds.createQueryRunner = () => createQRProxy(_suiteQR!);

  const tjDs = getTooljetDbDataSource();
  if (tjDs) {
    _suiteOrigCreateQR_tj = tjDs.createQueryRunner.bind(tjDs);
    _suiteQR_tj = _suiteOrigCreateQR_tj();
    await _suiteQR_tj.connect();
    await _suiteQR_tj.startTransaction();
    tjDs.createQueryRunner = () => createQRProxy(_suiteQR_tj!);
  }
}

/** Rolls back the suite-level transaction. Call in afterAll. */
export async function rollbackSuiteTransaction() {
  if (!_suiteQR) return;
  const ds = getDefaultDataSource();
  await _suiteQR.rollbackTransaction();
  await _suiteQR.release();
  _suiteQR = undefined;
  if (_suiteOrigCreateQR) {
    ds.createQueryRunner = _suiteOrigCreateQR as any;
    _suiteOrigCreateQR = undefined;
  }

  // Clean up tooljetDb QR regardless of whether the DataSource ref still exists.
  // closeTestApp() on a non-cached app can clear _tooljetDbDataSource while
  // the suite TX is still active — unconditional cleanup prevents a QR leak.
  if (_suiteQR_tj) {
    try {
      await _suiteQR_tj.rollbackTransaction();
      await _suiteQR_tj.release();
    } catch { /* best effort */ }
    _suiteQR_tj = undefined;
  }
  const tjDs = getTooljetDbDataSource();
  if (tjDs && _suiteOrigCreateQR_tj) {
    tjDs.createQueryRunner = _suiteOrigCreateQR_tj as any;
  }
  _suiteOrigCreateQR_tj = undefined;
  _suiteDS = undefined;
  _testSavepointId = 0;
}

/** Creates a SAVEPOINT within the suite transaction. Call in beforeEach. */
export async function beginTestTransaction() {
  if (!_defaultDataSource) return;
  // Lazy start: spec's beforeAll (initTestApp) set up the DataSource,
  // but our beforeAll ran first (no DataSource yet). Start now.
  if (!_suiteQR) await beginSuiteTransaction();
  if (!_suiteQR) return;
  _testSavepoint = `test_${++_testSavepointId}`;
  await _suiteQR.query(`SAVEPOINT ${_testSavepoint}`);
  if (_suiteQR_tj) {
    await _suiteQR_tj.query(`SAVEPOINT ${_testSavepoint}`);
  }
}

/** Rolls back to the test SAVEPOINT. Call in afterEach. */
export async function rollbackTestTransaction() {
  if (!_suiteQR || !_testSavepoint) return;
  await _suiteQR.query(`ROLLBACK TO SAVEPOINT ${_testSavepoint}`);
  if (_suiteQR_tj) {
    await _suiteQR_tj.query(`ROLLBACK TO SAVEPOINT ${_testSavepoint}`);
  }
  _testSavepoint = undefined;
}

/**
 * Opt out of the no-op proxy for tests that verify real transaction semantics.
 * Rolls back the suite transaction, runs the callback with real DB transactions,
 * then re-enters the suite transaction. Safe even if the callback throws.
 *
 * Currently used by: tooljet-db-import-export.service.spec.ts (bulk import rollback test).
 */
export async function withRealTransactions(fn: () => Promise<void>) {
  await rollbackSuiteTransaction();
  try {
    await fn();
  } finally {
    await beginSuiteTransaction();
  }
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Enterprise Terms — all features enabled, all limits unlimited.
 * In production, these are encoded in the encrypted license key (no constant exists).
 * Defined here so enterprise tests go through the same LicenseBase parsing path
 * as every other plan — no test-mode shortcuts.
 */
const ENTERPRISE_TEST_TERMS: Partial<Terms> = {
  apps: 'UNLIMITED',
  workspaces: 'UNLIMITED',
  users: { total: 'UNLIMITED', editor: 'UNLIMITED', viewer: 'UNLIMITED', superadmin: 'UNLIMITED' },
  database: { table: 'UNLIMITED' },
  type: LICENSE_TYPE.ENTERPRISE,
  features: {
    auditLogs: true, oidc: true, ldap: true, saml: true,
    customStyling: true, whiteLabelling: true, appWhiteLabelling: true, customThemes: true,
    serverSideGlobalResolve: true, multiEnvironment: true, multiPlayerEdit: true,
    comments: true, gitSync: true, ai: true, externalApi: true, scim: true,
    customDomains: true, google: true, github: true,
  },
  auditLogs: { maximumDays: 365 },
  app: {
    pages: { enabled: true, count: 'UNLIMITED', features: { appHeaderAndLogo: true, addNavGroup: true } },
    permissions: { component: true, query: true, pages: true },
    features: { promote: true, release: true, history: true },
  },
  modules: { enabled: true },
  permissions: { customGroups: true },
  observability: { enabled: true },
  workflows: {
    // execution_timeout is consumed as a literal timeout ceiling (workflow-executions.service.ts:732),
    // not a sentinel like the 'UNLIMITED' fields above -- 0 means "time out immediately", not "no limit".
    enabled: true, execution_timeout: 3600,
    workspace: { total: 'UNLIMITED', daily_executions: 'UNLIMITED', monthly_executions: 'UNLIMITED' },
    instance: { total: 'UNLIMITED', daily_executions: 'UNLIMITED', monthly_executions: 'UNLIMITED' },
  },
  ai: { plan: 'credits' },
};

/**
 * Plan → Terms mapping.
 * Mirrors the production flow where Terms are resolved per plan:
 *   EE:    License key is decrypted into Terms (server/ee/licensing/configs/License.ts)
 *   Cloud: Terms are pre-computed at payment time and stored in organization_license.terms
 *          (server/ee/organization-payments/service.ts → webhookInvoicePaidHandler)
 *          At runtime, OrganizationLicense falls back to plan defaults
 *          (server/ee/licensing/configs/organization-license.ts → getDefaultPlanTerms)
 */
const PLAN_TO_TERMS: Record<string, Partial<Terms>> = {
  enterprise: ENTERPRISE_TEST_TERMS,
  trial: ENTERPRISE_TEST_TERMS,
  team: TEAM_PLAN_TERMS_CLOUD as Partial<Terms>,
  starter: STARTER_PLAN_TERMS_CLOUD as Partial<Terms>,
  pro: PRO_PLAN_TERMS_CLOUD as Partial<Terms>,
  basic: BASIC_PLAN_TERMS as Partial<Terms>,
};

/** Creates a real LicenseBase instance for the given plan. */
function createLicenseInstance(plan: string): LicenseBase {
  const terms = PLAN_TO_TERMS[plan] ?? ENTERPRISE_TEST_TERMS;
  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + 30);
  return new (LicenseBase as any)(CE_BASIC_PLAN_TERMS, terms, new Date(), new Date(), futureDate, plan);
}

/**
 * Creates a LicenseTermsService mock that survives jest.resetAllMocks().
 * Uses real LicenseBase + getLicenseFieldValue — same resolution as production.
 */
function createResilientLicenseTermsMock(plan: string) {
  const mock = {
    _licenseInstance: createLicenseInstance(plan),

    getLicenseTerms(field: string | string[]) {
      const resolve = (f: string) => getLicenseFieldValue(f as LICENSE_FIELD, mock._licenseInstance);
      if (Array.isArray(field)) {
        const result: Record<string, any> = {};
        for (const key of field) result[key] = resolve(key);
        return Promise.resolve(result);
      }
      return Promise.resolve(resolve(field));
    },

    getLicenseTermsInstance(field?: string | string[]) {
      if (field) {
        const resolve = (f: string) => getLicenseFieldValue(f as LICENSE_FIELD, mock._licenseInstance);
        if (Array.isArray(field)) {
          const result: Record<string, any> = {};
          for (const key of field) result[key] = resolve(key);
          return Promise.resolve(result);
        }
        return Promise.resolve(resolve(field));
      }
      return Promise.resolve(getLicenseFieldValue(LICENSE_FIELD.ALL, mock._licenseInstance));
    },
  };
  return mock;
}

/** Reconfigures the mock's LicenseBase instance for the given plan. */
function configurePlanMock(app: INestApplication, plan: string) {
  const lts = app.get(LicenseTermsService) as ReturnType<typeof createResilientLicenseTermsMock>;
  if (!lts._licenseInstance) return; // not our mock — skip
  lts._licenseInstance = createLicenseInstance(plan);
}

/** Builds a LicenseBase from arbitrary Terms. `expired` sets a past expiry → basic-plan fallback. */
function buildTestLicenseInstance(terms: Partial<Terms>, expired = false): LicenseBase {
  const expiry = new Date();
  if (expired) expiry.setDate(expiry.getDate() - 1);
  else expiry.setMinutes(expiry.getMinutes() + 30);
  return new (LicenseBase as any)(CE_BASIC_PLAN_TERMS, terms, new Date(), new Date(), expiry, (terms as any).type ?? 'enterprise');
}

/**
 * Overrides the license terms on the running app's (mocked) LicenseTermsService at runtime — no
 * restart. Use it to drive license-dependent scenarios mid-test (e.g. gitSync unlicensed,
 * multi-branch unlicensed, or an expired plan). Call restoreLicensePlan() afterwards to revert.
 *
 * The terms are also mirrored into the TEST_LICENSE_TERMS env var so the real License path
 * (ee/licensing/configs/License.ts, which reads it under NODE_ENV=test) stays consistent for any
 * code that resolves through the real License instance instead of the mock.
 */
export function setTestLicenseTerms(
  app: INestApplication,
  terms: Partial<Terms>,
  opts: { expired?: boolean } = {}
): void {
  const lts = app.get(LicenseTermsService) as ReturnType<typeof createResilientLicenseTermsMock>;
  if (!lts?._licenseInstance) return; // not our mock — skip
  // Mirror into the env the real License path reads (kept consistent with the expired flag).
  process.env.TEST_LICENSE_TERMS = JSON.stringify({ expiry: opts.expired ? '2000-01-01' : '2999-12-31', ...terms });
  lts._licenseInstance = buildTestLicenseInstance(terms, opts.expired);
}

/** Restores the license mock to a plan (default enterprise) and clears TEST_LICENSE_TERMS. */
export function restoreLicensePlan(app: INestApplication, plan = 'enterprise'): void {
  delete process.env.TEST_LICENSE_TERMS;
  configurePlanMock(app, plan);
}

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

export interface InitTestAppResult {
  app: INestApplication;
}

/** Creates or reuses a cached NestJS test app for the given edition, configured with the specified license plan. */
export async function initTestApp(options?: InitTestAppOptions): Promise<InitTestAppResult> {
  const {
    edition = 'ee',
    plan = 'enterprise',
    freshApp = false,
  } = options ?? {};

  // Cache key: only edition matters. Plan reconfigures the mock, not the app.
  const isCacheable = !freshApp;
  const cacheKey = isCacheable ? edition : undefined;

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
        await beginSuiteTransaction();
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

  moduleBuilder.overrideProvider(LicenseTermsService).useValue(createResilientLicenseTermsMock(plan));

  const moduleRef = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();

  await configureApp(app, moduleRef);
  await app.init();
  setDataSources(app);
  await beginSuiteTransaction();
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
  // Transaction rollback active — no TRUNCATE needed.
  if (_suiteQR) return;
  await dropTooljetDbTables();

  const ds = getDefaultDataSource();
  if (!ds.isInitialized) await ds.initialize();

  // Tables with entity metadata registered but no longer in the schema
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

  if (existingSet.has('instance_settings'))
    await ds.query(`UPDATE "instance_settings" SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE'`);

}

