import { DataSource, Migration, MigrationExecutor, QueryRunner } from 'typeorm';
import schemaDataSource from './schema-datasource';
import dataDataSource from './data-datasource';
import cleanupDataSource from './cleanup-datasource';
import { extractEnumValueAdditions, EnumValueAddition } from './enum-value-additions';
import {
  CLEANUP_ADVISORY_LOCK_KEY,
  getLockWaitOptions,
  HELD_MIGRATION_LOCKS_SQL,
  LOCK_SENTINEL_MIGRATION_NAMES,
  getSchemaPhaseOptions,
  isLockNotAvailableError,
  LockSession,
  LockWaitOptions,
  MIGRATION_ACTIVE_LOCK_KEY,
  SchemaPhaseOptions,
  SKIPPED_EXIT_CODE,
  withMigrationConnectionOptions,
  withMigrationAdvisoryLock,
} from './migration-locks';
import { retryOnLockTimeout, retryWhen } from './with-short-lock';
import {
  LEGACY_BRANCH_MIGRATION,
  loosenLegacyRules,
  restoreLegacyRules,
  useLegacyVariants,
} from './legacy-3-21-58-upgrade';
import {
  DataMigration,
  blocksAsyncUpgrade,
  CleanupMigration,
  MigrationPhase,
  migrationTimestamp,
  parseMigrationPhase,
  planCleanup,
  runStrategy,
} from './migration-mode';
import { getEnvVars } from '../../scripts/database-config-utils';

/**
 * Runs schema, data, then cleanup migrations (phases and strategies: `MigrationPhase` in migration-mode.ts).
 * One executor pass per phase, never one DataSource: TypeORM orders by class-name timestamp, and the phases'
 * timestamps interleave. A single-transaction run is atomic except for enum values (docs/MIGRATION_FLOW.md).
 */

const SCHEMA_LOCK_RETRY_DELAY_MS = 2000;
const DATA_ATTEMPTS = 3;
const DATA_RETRY_DELAY_MS = 2000;

/** Deadlock, serialization failure, lock timeout: the whole data rolls back, so running it again is safe. */
const TRANSIENT_ERROR_CODES = new Set(['40P01', '40001', '55P03']);

export function isTransientError(error: unknown): boolean {
  const { code, driverError } = (error ?? {}) as { code?: string; driverError?: { code?: string } };
  return TRANSIENT_ERROR_CODES.has(driverError?.code ?? code ?? '');
}

interface BeforeCommitSteps {
  run(queryRunner: QueryRunner): Promise<void>;
  clear(): void;
}

/** Collects the beforeCommit() step of each data whose up() ran in this attempt. */
function collectBeforeCommitSteps(dataDS: DataSource): BeforeCommitSteps {
  const beforeCommitSteps: { name: string; beforeCommit: (queryRunner: QueryRunner) => Promise<void> }[] = [];
  for (const migration of dataDS.migrations as DataMigration[]) {
    if (!migration.beforeCommit) continue;
    const name = migration.name || migration.constructor.name;
    const beforeCommit = migration.beforeCommit.bind(migration);
    const up = migration.up.bind(migration);
    migration.up = async (queryRunner: QueryRunner) => {
      await up(queryRunner);
      beforeCommitSteps.push({ name, beforeCommit });
    };
  }
  return {
    clear: () => beforeCommitSteps.splice(0),
    async run(queryRunner) {
      for (const { name, beforeCommit } of beforeCommitSteps.splice(0)) {
        console.log(`[migrations] BEFORE COMMIT ${name}`);
        await beforeCommit(queryRunner);
      }
    },
  };
}

const ENUM_SEPARATE_TRANSACTIONS_REASON =
  'A pending ALTER TYPE ADD VALUE targets an enum type created in this run; running schema and data in ' +
  'separate transactions (PostgreSQL cannot add and use an enum value in one transaction).';

const DATA_PHASE_REASON =
  'Data phase: running schema (catch-up, normally empty) and data in separate transactions, so a ' +
  'data failure rolls back the data phase only.';

interface EnumAdditionPlan {
  /** Their type exists, so they can commit ahead of the shared transaction. */
  precommittable: EnumValueAddition[];
  /** Some type is created in this run: no single transaction can add and use its values. */
  hasMissingType: boolean;
}

function splitByExistingType(additions: EnumValueAddition[], existingTypes: ReadonlySet<string>): EnumAdditionPlan {
  return {
    precommittable: additions.filter(({ typeName }) => existingTypes.has(typeName)),
    hasMissingType: additions.some(({ typeName }) => !existingTypes.has(typeName)),
  };
}

function logExecuted(label: string, executed: { name: string }[]): void {
  if (!executed.length) {
    console.log(`[migrations] ${label}: no pending migrations.`);
    return;
  }
  console.log(`[migrations] ${label}: executed ${executed.length} migration(s):`);
  executed.forEach(({ name }) => console.log(`  - ${name}`));
}

/** With a transaction already open on `queryRunner`, TypeORM joins it instead of committing its own. */
async function runPass(
  label: string,
  dataSource: DataSource,
  queryRunner?: QueryRunner,
  transaction: MigrationExecutor['transaction'] = 'all'
): Promise<void> {
  const executor = new MigrationExecutor(dataSource, queryRunner);
  executor.transaction = transaction;
  logExecuted(label, await executor.executePendingMigrations());
}

async function inTransaction(
  dataSource: DataSource,
  work: (queryRunner: QueryRunner) => Promise<void>,
  onRollback: () => void = () => undefined
): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await work(queryRunner);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    onRollback();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Single-transaction runs only: async schema commits before the data phase uses a new value.
async function planEnumAdditions(schemaDS: DataSource): Promise<EnumAdditionPlan> {
  const additions = extractEnumValueAdditions(await new MigrationExecutor(schemaDS).getPendingMigrations());
  if (!additions.length) return { precommittable: [], hasMissingType: false };
  const rows: { typname: string }[] = await schemaDS.query('SELECT typname FROM pg_type WHERE typname = ANY($1)', [
    additions.map(({ typeName }) => typeName),
  ]);
  return splitByExistingType(additions, new Set(rows.map(({ typname }) => typname)));
}

/** Enum values cannot be removed anyway, so committing them first costs nothing. */
async function precommitEnumValueAdditions(additions: EnumValueAddition[], dataSource: DataSource): Promise<void> {
  for (const { typeExpression, typeName, value, migrationName } of additions) {
    // From our own migration source, not user input.
    await dataSource.query(`ALTER TYPE ${typeExpression} ADD VALUE IF NOT EXISTS '${value}'`);
    console.log(`[migrations] pre-committed enum value ${typeName}.'${value}' (from ${migrationName}).`);
  }
}

async function runAtomic(
  precommittable: EnumValueAddition[],
  schemaDS: DataSource,
  dataDS: DataSource,
  cleanupDS: DataSource,
  beforeCommitSteps: BeforeCommitSteps
): Promise<void> {
  await precommitEnumValueAdditions(precommittable, schemaDS);
  await inTransaction(
    schemaDS,
    async (queryRunner) => {
      await runPass('schema', schemaDS, queryRunner);
      await runPass('data', dataDS, queryRunner);
      await beforeCommitSteps.run(queryRunner);
      // 'all' throws for cleanup classes (transaction = false); 'none' still runs inside this transaction.
      await runPass('cleanup', cleanupDS, queryRunner, 'none');
    },
    () => console.error('[migrations] Migration failed. Rolled back schema AND data changes.')
  );
  console.log('[migrations] Committed schema + data migrations in a single transaction.');
}

/** `cleanupDS` only for a single-transaction run; the data phase leaves cleanup to its own run. */
async function runInSeparateTransactions(
  schemaDS: DataSource,
  [dataDS, beforeCommitSteps]: [DataSource, BeforeCommitSteps],
  reason: string,
  cleanupDS?: DataSource
): Promise<void> {
  console.log(`[migrations] ${reason} Schema commits before data runs.`);
  await runPass('schema', schemaDS);
  await retryWhen(
    isTransientError,
    () => {
      beforeCommitSteps.clear();
      return inTransaction(dataDS, async (queryRunner) => {
        await runPass('data', dataDS, queryRunner);
        await beforeCommitSteps.run(queryRunner);
      });
    },
    { attempts: DATA_ATTEMPTS, retryDelayMs: DATA_RETRY_DELAY_MS },
    (next) =>
      console.warn(
        `[migrations] The data phase hit a deadlock or lock timeout and rolled back. Retrying (attempt ${next} of ${DATA_ATTEMPTS}).`
      )
  );
  if (cleanupDS) await runPass('cleanup', cleanupDS, undefined, 'each');
  console.log('[migrations] Committed schema and data migrations in separate transactions.');
}

const BASELINES_DDL = `
  CREATE TABLE IF NOT EXISTS migration_baselines (
    code_head text PRIMARY KEY,
    last_migration_id integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

/** The newest migration this code ships: it changes with every release that adds one. */
export function codeHead(...dataSources: DataSource[]): string {
  const names = dataSources.flatMap(({ migrations }) =>
    migrations.map((migration) => migration.name || migration.constructor.name)
  );
  return names.reduce((newest, name) => (migrationTimestamp(name) > migrationTimestamp(newest) ? name : newest), '');
}

/**
 * The last migration id recorded before this code first ran, saved once by its first runner; 0 on a fresh install.
 * Call it holding a lock that keeps other runners out, before applying anything.
 */
async function upgradeBaseline(dataSource: DataSource, head: string): Promise<number> {
  await dataSource.query(BASELINES_DDL).catch((error: { code?: string }) => {
    // Two pods racing CREATE TABLE IF NOT EXISTS: one loses on the type's unique index.
    if (error.code !== '23505' && error.code !== '42P07') throw error;
  });
  const [{ table }] = await dataSource.query(`SELECT to_regclass('migrations') AS table`);
  await dataSource.query(
    `INSERT INTO migration_baselines (code_head, last_migration_id)
     SELECT $1, ${table ? 'COALESCE(max(id), 0) FROM migrations' : '0'} ON CONFLICT (code_head) DO NOTHING`,
    [head]
  );
  const [{ id }] = await dataSource.query(
    'SELECT last_migration_id AS id FROM migration_baselines WHERE code_head = $1',
    [head]
  );
  return id;
}

/** Leaves out each cleanup whose `requires` an earlier upgrade has not recorded yet; it runs on a later upgrade. */
async function holdBackCleanups(cleanupDS: DataSource, baselineId: number): Promise<void> {
  if (baselineId === 0 || !cleanupDS.migrations.length) return;
  const recorded: { id: number; name: string }[] = await cleanupDS.query('SELECT id, name FROM migrations');
  const candidates = (cleanupDS.migrations as unknown as CleanupMigration[]).map((migration) => ({
    name: migration.name || migration.constructor.name,
    requires: migration.requires,
  }));
  const { run, deferred } = planCleanup(candidates, new Map(recorded.map(({ name, id }) => [name, id])), baselineId);
  for (const { name, waitingFor } of deferred) {
    console.log(`[migrations] Holding back ${name} until an earlier upgrade has recorded ${waitingFor}.`);
  }
  const kept = cleanupDS.migrations.filter((migration) => run.includes(migration.name || migration.constructor.name));
  cleanupDS.migrations.splice(0, cleanupDS.migrations.length, ...kept);
}

class YieldToMigrationRun extends Error {}

/** Cleanup never holds the migration lock, so a run never waits on it; it stops when one starts. */
function yieldBeforeEachMigration(dataSource: DataSource, session: LockSession): void {
  for (const migration of dataSource.migrations) {
    const up = migration.up.bind(migration);
    migration.up = async (queryRunner: QueryRunner) => {
      const [{ running }] = (await session.query(HELD_MIGRATION_LOCKS_SQL)) as { running: boolean }[];
      if (running) throw new YieldToMigrationRun();
      await up(queryRunner);
    };
  }
}

/** After writes reopen: each step in its own short transaction. A failed step stays pending for the next boot. */
async function runCleanupPhase(cleanupDS: DataSource, lockWait: LockWaitOptions, head: string): Promise<boolean> {
  if (!(await pendingNames(cleanupDS)).length) {
    console.log('[migrations] No cleanup migrations pending.');
    return true;
  }
  const ran = await withMigrationAdvisoryLock(
    cleanupDS,
    lockWait,
    {},
    async (session) => {
      await holdBackCleanups(cleanupDS, await upgradeBaseline(cleanupDS, head));
      announceEachMigration(cleanupDS);
      yieldBeforeEachMigration(cleanupDS, session);
      try {
        await runPass('cleanup', cleanupDS, undefined, 'each');
      } catch (error) {
        if (!(error instanceof YieldToMigrationRun)) throw error;
        console.log('[migrations] A migration run started; the remaining cleanup migrations run on the next boot.');
      }
      return true;
    },
    { skipIfBusy: true, key: CLEANUP_ADVISORY_LOCK_KEY }
  );
  if (!ran) console.log('[migrations] Another server is running the cleanup migrations.');
  return !!ran;
}

async function runSchemaPhase(schemaDS: DataSource, options: SchemaPhaseOptions, head: string): Promise<boolean> {
  // Restarts and scale-ups end here, without waiting on the advisory lock.
  if (!(await pendingNames(schemaDS)).length) {
    console.log('[migrations] No schema migrations pending before boot.');
    return true;
  }
  await withMigrationAdvisoryLock(schemaDS, options.lockWait, {}, async (session) => {
    const pending = await pendingNames(schemaDS);
    if (!pending.length) {
      console.log('[migrations] Another pod applied the schema migrations.');
      return;
    }
    console.log(`[migrations] ${pending.length} schema migration(s) pending: ${pending.join(', ')}`);
    await upgradeBaseline(schemaDS, head);
    await holdingActiveLock(session, () => applySchemaUnderLockTimeout(schemaDS, options));
  });
  return true;
}

/** A waiting ALTER queues every reader behind it, so give up early and retry. */
async function applySchemaUnderLockTimeout(
  schemaDS: DataSource,
  { lockTimeoutMs, lockAttempts }: SchemaPhaseOptions
): Promise<void> {
  await precommitEnumValueAdditions((await planEnumAdditions(schemaDS)).precommittable, schemaDS);
  announceEachMigration(schemaDS);
  const applyOnce = () =>
    inTransaction(schemaDS, async (queryRunner) => {
      await queryRunner.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
      await runPass('schema', schemaDS, queryRunner);
    });
  try {
    await retryOnLockTimeout(applyOnce, { attempts: lockAttempts, retryDelayMs: SCHEMA_LOCK_RETRY_DELAY_MS }, (next) =>
      console.warn(
        `[migrations] A schema migration waited over ${lockTimeoutMs}ms for a table lock; rolled back so ` +
          `readers are not stalled behind it. Retrying (attempt ${next} of ${lockAttempts}).`
      )
    );
  } catch (error) {
    console.error('[migrations] Schema migrations failed. Rolled back the schema changes.');
    throw error;
  }
  console.log('[migrations] Committed schema migrations.');
}

/** Serving pods refuse writes while this is held; it dies with the session, so a killed pod cannot leave it set. */
async function holdingActiveLock(session: LockSession, work: () => Promise<void>): Promise<void> {
  await session.query('SELECT pg_advisory_lock($1)', [MIGRATION_ACTIVE_LOCK_KEY]);
  try {
    await work();
  } finally {
    await session.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ACTIVE_LOCK_KEY]).catch(() => undefined);
  }
}

/** Pending names, lock sentinels left out: they are pending on every boot. */
async function pendingNames(...dataSources: DataSource[]): Promise<string[]> {
  const pending: Migration[] = [];
  for (const dataSource of dataSources)
    pending.push(...(await new MigrationExecutor(dataSource).getPendingMigrations()));
  return pending.map(({ name }) => name).filter((name) => !LOCK_SENTINEL_MIGRATION_NAMES.includes(name));
}

// ponytail: probe-then-read; a single-transaction run starting between the two can still stall the read.
async function migrationsTableLocked(dataSource: DataSource, lockTimeoutMs: number): Promise<boolean> {
  try {
    await inTransaction(dataSource, async (queryRunner) => {
      // A role statement_timeout below lockTimeoutMs would cancel with 57014 instead of 55P03.
      await queryRunner.query('SET LOCAL statement_timeout = 0');
      await queryRunner.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
      const [{ table }] = await queryRunner.query(`SELECT to_regclass('migrations') AS table`);
      if (table) await queryRunner.query('LOCK TABLE migrations IN ACCESS SHARE MODE');
    });
    return false;
  } catch (error) {
    if (isLockNotAvailableError(error)) return true;
    throw error;
  }
}

/** Split phases are serialised by the advisory lock; the sentinels' LOCK TABLE would stall booting pods. */
function withoutLockSentinels(dataSource: DataSource): void {
  const kept = dataSource.migrations.filter(
    (migration) => !LOCK_SENTINEL_MIGRATION_NAMES.includes(migration.name || migration.constructor.name)
  );
  dataSource.migrations.splice(0, dataSource.migrations.length, ...kept);
}

/** START/DONE line per migration: the async-mode tracker parses these. */
function announceEachMigration(dataSource: DataSource): void {
  for (const migration of dataSource.migrations) {
    const name = migration.name || migration.constructor.name;
    const up = migration.up.bind(migration);
    migration.up = async (queryRunner: QueryRunner) => {
      const startedAt = Date.now();
      console.log(`[migrations] START ${name}`);
      await up(queryRunner);
      console.log(`[migrations] DONE ${name} ${Date.now() - startedAt}ms`);
    };
  }
}

async function executeMigrations(
  schemaDS: DataSource,
  dataDS: DataSource,
  cleanupDS: DataSource,
  phase: MigrationPhase | undefined
): Promise<void> {
  // Plan before announcing: it scans up() source, which the announcing wrapper hides.
  const plan = phase === 'data' ? undefined : await planEnumAdditions(schemaDS);
  // Variants replace up() and beforeCommit(), so they go in before the wrappers below.
  const legacy = phase === 'data' && (await pendingNames(dataDS)).includes(LEGACY_BRANCH_MIGRATION);
  if (legacy) useLegacyVariants(dataDS);
  announceEachMigration(schemaDS);
  announceEachMigration(dataDS);
  const data: [DataSource, BeforeCommitSteps] = [dataDS, collectBeforeCommitSteps(dataDS)];
  if (!plan) {
    try {
      // Inside the try: a loosen that stops part way restores the rules it already dropped.
      if (legacy) await loosenLegacyRules(dataDS);
      return await runInSeparateTransactions(schemaDS, data, DATA_PHASE_REASON);
    } catch (error) {
      // Still holding the migration lock, so no other runner sees the loosened rules.
      if (legacy) {
        await restoreLegacyRules(dataDS).catch((restoreError) =>
          console.error(`[migrations] Legacy upgrade: restore failed: ${(restoreError as Error).message}`)
        );
      }
      throw error;
    }
  }
  announceEachMigration(cleanupDS);
  if (plan.hasMissingType) {
    return runInSeparateTransactions(schemaDS, data, ENUM_SEPARATE_TRANSACTIONS_REASON, cleanupDS);
  }
  await runAtomic(plan.precommittable, schemaDS, dataDS, cleanupDS, data[1]);
}

async function migrateAsSolePod(
  [schemaDS, dataDS, cleanupDS]: [DataSource, DataSource, DataSource],
  session: LockSession,
  phase: MigrationPhase | undefined,
  head: string
): Promise<void> {
  const baseline = await upgradeBaseline(schemaDS, head);
  if (!phase) await holdBackCleanups(cleanupDS, baseline);
  const pending = await pendingNames(schemaDS, dataDS, ...(phase ? [] : [cleanupDS]));
  const execute = () => executeMigrations(schemaDS, dataDS, cleanupDS, phase);
  if (!pending.length) {
    console.log('[migrations] No schema or data migrations pending — not cutting API traffic for this boot.');
    return execute();
  }
  console.log(`[migrations] ${pending.length} migration(s) pending: ${pending.join(', ')}`);
  await holdingActiveLock(session, execute);
}

/** False when MIGRATION_SKIP_IF_LOCKED found another server migrating and left the run to it. */
export async function run(
  schemaDS: DataSource = schemaDataSource,
  dataDS: DataSource = dataDataSource,
  cleanupDS: DataSource = cleanupDataSource
): Promise<boolean> {
  // process.env, not getEnvVars(): the parent sets it per spawn.
  let phase = parseMigrationPhase(process.env.MIGRATION_PHASE);
  for (const dataSource of [schemaDS, dataDS, cleanupDS]) {
    if (dataSource.isInitialized) continue;
    // A lost node would otherwise hold the transaction's row locks for the OS keepalive (~2h).
    withMigrationConnectionOptions(dataSource);
    await dataSource.initialize();
  }

  // getEnvVars(): this process has no ConfigModule, so settings only in the env file would be missed.
  const env = getEnvVars();
  const head = codeHead(schemaDS, dataDS, cleanupDS);
  if (phase === 'cleanup') return runCleanupPhase(cleanupDS, getLockWaitOptions(env), head);
  const schemaOptions = getSchemaPhaseOptions(env);
  if (phase === 'schema') {
    // A single-transaction run holds LOCK TABLE migrations to the end; reading behind it hits statement_timeout.
    if (await migrationsTableLocked(schemaDS, schemaOptions.lockTimeoutMs)) {
      console.log('[migrations] Another server is migrating with the migrations table locked; waiting for it.');
      await withMigrationAdvisoryLock(schemaDS, schemaOptions.lockWait, {}, async () => undefined);
    }
    const legacy = (await pendingNames(schemaDS, dataDS)).filter(blocksAsyncUpgrade);
    if (legacy.length) {
      console.log(
        `[migrations] ${legacy[0]} is pending: this database is older than 3.21.58 (${legacy.length} such pending); ` +
          'running the whole upgrade before boot in one transaction, the blocking way.'
      );
      phase = undefined;
    }
  }
  if (runStrategy(phase) === 'multi-transaction') {
    withoutLockSentinels(schemaDS);
    withoutLockSentinels(dataDS);
  }
  if (phase === 'schema') return runSchemaPhase(schemaDS, schemaOptions, head);

  // A server already migrating owns the run; waiting would re-run its migrations after it ends, even failed ones.
  const ran = await withMigrationAdvisoryLock(
    schemaDS,
    getLockWaitOptions(env),
    {},
    async (session) => {
      await migrateAsSolePod([schemaDS, dataDS, cleanupDS], session, phase, head);
      return true;
    },
    { skipIfBusy: process.env.MIGRATION_SKIP_IF_LOCKED === 'true' }
  );
  if (!ran) console.log('[migrations] Another server is running migrations; leaving the run to it.');
  return !!ran;
}

// Runs only when invoked directly, not when a test imports it.
if (require.main === module) {
  const destroyAll = () =>
    Promise.all(
      [schemaDataSource, dataDataSource, cleanupDataSource].map((dataSource) =>
        dataSource.destroy().catch(() => undefined)
      )
    );
  run()
    .then(async (ran) => {
      await destroyAll();
      process.exit(ran ? 0 : SKIPPED_EXIT_CODE);
    })
    .catch(async (error) => {
      console.error(error);
      await destroyAll();
      process.exit(1);
    });
}
