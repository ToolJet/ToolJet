import { DataSource, Migration, MigrationExecutor, QueryRunner } from 'typeorm';
import schemaDataSource from './db-migrations-datasource';
import dataDataSource from './data-migrations-datasource';
import { extractEnumValueAdditions, EnumValueAddition } from './enum-value-additions';
import {
  getLockWaitOptions,
  LOCK_SENTINEL_MIGRATION_NAMES,
  getSchemaPhaseOptions,
  isLockNotAvailableError,
  LockSession,
  MIGRATION_ACTIVE_LOCK_KEY,
  SchemaPhaseOptions,
  SKIPPED_EXIT_CODE,
  withMigrationConnectionOptions,
  withMigrationAdvisoryLock,
} from './migration-locks';
import { retryOnLockTimeout } from './with-short-lock';
import { blocksAsyncUpgrade, MigrationPhase, parseMigrationPhase, runStrategy } from './migration-mode';
import { getEnvVars } from '../../scripts/database-config-utils';

/**
 * Runs expand migrations, then backfill migrations (phases and strategies: `MigrationPhase` in migration-mode.ts).
 * Two executor passes, never one DataSource: TypeORM orders by class-name timestamp, and expand and backfill
 * timestamps interleave. A single-transaction run is atomic except for enum values (docs/MIGRATION_FLOW.md).
 */

const EXPAND_LOCK_RETRY_DELAY_MS = 2000;

const ENUM_SEPARATE_TRANSACTIONS_REASON =
  'A pending ALTER TYPE ADD VALUE targets an enum type created in this run; running expand and backfill in ' +
  'separate transactions (PostgreSQL cannot add and use an enum value in one transaction).';

const BACKFILL_PHASE_REASON =
  'Backfill phase: running expand (catch-up, normally empty) and backfill in separate transactions, so a ' +
  'backfill failure rolls back the backfill only.';

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
async function runPass(label: string, dataSource: DataSource, queryRunner?: QueryRunner): Promise<void> {
  const executor = new MigrationExecutor(dataSource, queryRunner);
  executor.transaction = 'all';
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

// ponytail: only single-transaction upgrades from before 3.21.58 need this; delete with that upgrade path.
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

async function runAtomic(precommittable: EnumValueAddition[], schemaDS: DataSource, dataDS: DataSource): Promise<void> {
  await precommitEnumValueAdditions(precommittable, schemaDS);
  await inTransaction(
    schemaDS,
    async (queryRunner) => {
      await runPass('expand', schemaDS, queryRunner);
      await runPass('backfill', dataDS, queryRunner);
    },
    () => console.error('[migrations] Migration failed. Rolled back expand AND backfill changes.')
  );
  console.log('[migrations] Committed expand + backfill migrations in a single transaction.');
}

async function runInSeparateTransactions(schemaDS: DataSource, dataDS: DataSource, reason: string): Promise<void> {
  console.log(`[migrations] ${reason} Expand commits before backfill runs.`);
  await runPass('expand', schemaDS);
  await runPass('backfill', dataDS);
  console.log('[migrations] Committed expand and backfill migrations in separate transactions.');
}

async function runExpandPhase(schemaDS: DataSource, options: SchemaPhaseOptions): Promise<boolean> {
  // Restarts and scale-ups end here, without waiting on the advisory lock.
  if (!(await pendingNames(schemaDS)).length) {
    console.log('[migrations] No expand migrations pending before boot.');
    return true;
  }
  await withMigrationAdvisoryLock(schemaDS, options.lockWait, {}, async (session) => {
    const pending = await pendingNames(schemaDS);
    if (!pending.length) {
      console.log('[migrations] Another pod applied the expand migrations.');
      return;
    }
    console.log(`[migrations] ${pending.length} expand migration(s) pending: ${pending.join(', ')}`);
    await holdingActiveLock(session, () => applyExpandUnderLockTimeout(schemaDS, options));
  });
  return true;
}

/** A waiting ALTER queues every reader behind it, so give up early and retry. */
async function applyExpandUnderLockTimeout(
  schemaDS: DataSource,
  { lockTimeoutMs, lockAttempts }: SchemaPhaseOptions
): Promise<void> {
  await precommitEnumValueAdditions((await planEnumAdditions(schemaDS)).precommittable, schemaDS);
  announceEachMigration(schemaDS);
  const applyOnce = () =>
    inTransaction(schemaDS, async (queryRunner) => {
      await queryRunner.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
      await runPass('expand', schemaDS, queryRunner);
    });
  try {
    await retryOnLockTimeout(applyOnce, { attempts: lockAttempts, retryDelayMs: EXPAND_LOCK_RETRY_DELAY_MS }, (next) =>
      console.warn(
        `[migrations] An expand migration waited over ${lockTimeoutMs}ms for a table lock; rolled back so ` +
          `readers are not stalled behind it. Retrying (attempt ${next} of ${lockAttempts}).`
      )
    );
  } catch (error) {
    console.error('[migrations] Expand migrations failed. Rolled back the expand changes.');
    throw error;
  }
  console.log('[migrations] Committed expand migrations.');
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
  phase: MigrationPhase | undefined
): Promise<void> {
  // Plan before announcing: it scans up() source, which the announcing wrapper hides.
  const plan = phase === 'backfill' ? undefined : await planEnumAdditions(schemaDS);
  announceEachMigration(schemaDS);
  announceEachMigration(dataDS);
  if (!plan) return runInSeparateTransactions(schemaDS, dataDS, BACKFILL_PHASE_REASON);
  if (plan.hasMissingType) return runInSeparateTransactions(schemaDS, dataDS, ENUM_SEPARATE_TRANSACTIONS_REASON);
  await runAtomic(plan.precommittable, schemaDS, dataDS);
}

async function migrateAsSolePod(
  schemaDS: DataSource,
  dataDS: DataSource,
  session: LockSession,
  phase: MigrationPhase | undefined
): Promise<void> {
  const pending = await pendingNames(schemaDS, dataDS);
  if (!pending.length) {
    console.log('[migrations] No expand or backfill migrations pending — not cutting API traffic for this boot.');
    return executeMigrations(schemaDS, dataDS, phase);
  }
  console.log(`[migrations] ${pending.length} migration(s) pending: ${pending.join(', ')}`);
  await holdingActiveLock(session, () => executeMigrations(schemaDS, dataDS, phase));
}

/** False when MIGRATION_SKIP_IF_LOCKED found another server migrating and left the run to it. */
export async function run(
  schemaDS: DataSource = schemaDataSource,
  dataDS: DataSource = dataDataSource
): Promise<boolean> {
  // process.env, not getEnvVars(): the parent sets it per spawn.
  let phase = parseMigrationPhase(process.env.MIGRATION_PHASE);
  for (const dataSource of [schemaDS, dataDS]) {
    if (dataSource.isInitialized) continue;
    // A lost node would otherwise hold the transaction's row locks for the OS keepalive (~2h).
    withMigrationConnectionOptions(dataSource);
    await dataSource.initialize();
  }

  // getEnvVars(): this process has no ConfigModule, so settings only in the env file would be missed.
  const env = getEnvVars();
  const expandOptions = getSchemaPhaseOptions(env);
  if (phase === 'expand') {
    // A single-transaction run holds LOCK TABLE migrations to the end; reading behind it hits statement_timeout.
    if (await migrationsTableLocked(schemaDS, expandOptions.lockTimeoutMs)) {
      console.log('[migrations] Another server is migrating with the migrations table locked; waiting for it.');
      await withMigrationAdvisoryLock(schemaDS, expandOptions.lockWait, {}, async () => undefined);
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
  if (phase === 'expand') return runExpandPhase(schemaDS, expandOptions);

  // A server already migrating owns the run; waiting would re-run its migrations after it ends, even failed ones.
  const ran = await withMigrationAdvisoryLock(
    schemaDS,
    getLockWaitOptions(env),
    {},
    async (session) => {
      await migrateAsSolePod(schemaDS, dataDS, session, phase);
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
    Promise.all([schemaDataSource, dataDataSource].map((dataSource) => dataSource.destroy().catch(() => undefined)));
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
