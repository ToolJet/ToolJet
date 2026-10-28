import { DataSource, Migration, MigrationExecutor, QueryRunner } from 'typeorm';
import schemaDataSource from './db-migrations-datasource';
import dataDataSource from './data-migrations-datasource';
import contractDataSource from './contract-migrations-datasource';
import { extractEnumValueAdditions, EnumValueAddition } from './enum-value-additions';
import {
  CONTRACT_ADVISORY_LOCK_KEY,
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
  BackfillMigration,
  blocksAsyncUpgrade,
  MigrationPhase,
  parseMigrationPhase,
  runStrategy,
} from './migration-mode';
import { getEnvVars } from '../../scripts/database-config-utils';

/**
 * Runs expand, backfill, then contract migrations (phases and strategies: `MigrationPhase` in migration-mode.ts).
 * One executor pass per phase, never one DataSource: TypeORM orders by class-name timestamp, and the phases'
 * timestamps interleave. A single-transaction run is atomic except for enum values (docs/MIGRATION_FLOW.md).
 */

const EXPAND_LOCK_RETRY_DELAY_MS = 2000;
const BACKFILL_ATTEMPTS = 3;
const BACKFILL_RETRY_DELAY_MS = 2000;

/** Deadlock, serialization failure, lock timeout: the whole backfill rolls back, so running it again is safe. */
const TRANSIENT_ERROR_CODES = new Set(['40P01', '40001', '55P03']);

function isTransientError(error: unknown): boolean {
  const { code, driverError } = (error ?? {}) as { code?: string; driverError?: { code?: string } };
  return TRANSIENT_ERROR_CODES.has(driverError?.code ?? code ?? '');
}

interface DeferredTails {
  run(queryRunner: QueryRunner): Promise<void>;
  clear(): void;
}

/** Collects the tail of each backfill whose up() ran in this attempt. */
function deferTails(dataDS: DataSource): DeferredTails {
  const tails: { name: string; tail: (queryRunner: QueryRunner) => Promise<void> }[] = [];
  for (const migration of dataDS.migrations as BackfillMigration[]) {
    if (!migration.tail) continue;
    const name = migration.name || migration.constructor.name;
    const tail = migration.tail.bind(migration);
    const up = migration.up.bind(migration);
    migration.up = async (queryRunner: QueryRunner) => {
      await up(queryRunner);
      tails.push({ name, tail });
    };
  }
  return {
    clear: () => tails.splice(0),
    async run(queryRunner) {
      for (const { name, tail } of tails.splice(0)) {
        console.log(`[migrations] TAIL ${name}`);
        await tail(queryRunner);
      }
    },
  };
}

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

async function runAtomic(
  precommittable: EnumValueAddition[],
  schemaDS: DataSource,
  dataDS: DataSource,
  contractDS: DataSource,
  tails: DeferredTails
): Promise<void> {
  await precommitEnumValueAdditions(precommittable, schemaDS);
  await inTransaction(
    schemaDS,
    async (queryRunner) => {
      await runPass('expand', schemaDS, queryRunner);
      await runPass('backfill', dataDS, queryRunner);
      await tails.run(queryRunner);
      // 'all' throws for contract classes (transaction = false); 'none' still runs inside this transaction.
      await runPass('contract', contractDS, queryRunner, 'none');
    },
    () => console.error('[migrations] Migration failed. Rolled back expand AND backfill changes.')
  );
  console.log('[migrations] Committed expand + backfill migrations in a single transaction.');
}

/** `contractDS` only for a single-transaction run; the backfill phase leaves contract to its own run. */
async function runInSeparateTransactions(
  schemaDS: DataSource,
  [dataDS, tails]: [DataSource, DeferredTails],
  reason: string,
  contractDS?: DataSource
): Promise<void> {
  console.log(`[migrations] ${reason} Expand commits before backfill runs.`);
  await runPass('expand', schemaDS);
  await retryWhen(
    isTransientError,
    () => {
      tails.clear();
      return inTransaction(dataDS, async (queryRunner) => {
        await runPass('backfill', dataDS, queryRunner);
        await tails.run(queryRunner);
      });
    },
    { attempts: BACKFILL_ATTEMPTS, retryDelayMs: BACKFILL_RETRY_DELAY_MS },
    (next) =>
      console.warn(
        `[migrations] The backfill hit a deadlock or lock timeout and rolled back. Retrying (attempt ${next} of ${BACKFILL_ATTEMPTS}).`
      )
  );
  if (contractDS) await runPass('contract', contractDS, undefined, 'each');
  console.log('[migrations] Committed expand and backfill migrations in separate transactions.');
}

class YieldToMigrationRun extends Error {}

/** Contract never holds the migration lock, so a run never waits on it; it stops when one starts. */
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
async function runContractPhase(contractDS: DataSource, lockWait: LockWaitOptions): Promise<boolean> {
  if (!(await pendingNames(contractDS)).length) {
    console.log('[migrations] No contract migrations pending.');
    return true;
  }
  const ran = await withMigrationAdvisoryLock(
    contractDS,
    lockWait,
    {},
    async (session) => {
      announceEachMigration(contractDS);
      yieldBeforeEachMigration(contractDS, session);
      try {
        await runPass('contract', contractDS, undefined, 'each');
      } catch (error) {
        if (!(error instanceof YieldToMigrationRun)) throw error;
        console.log('[migrations] A migration run started; the remaining contract migrations run on the next boot.');
      }
      return true;
    },
    { skipIfBusy: true, key: CONTRACT_ADVISORY_LOCK_KEY }
  );
  if (!ran) console.log('[migrations] Another server is running the contract migrations.');
  return !!ran;
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
  contractDS: DataSource,
  phase: MigrationPhase | undefined
): Promise<void> {
  // Plan before announcing: it scans up() source, which the announcing wrapper hides.
  const plan = phase === 'backfill' ? undefined : await planEnumAdditions(schemaDS);
  announceEachMigration(schemaDS);
  announceEachMigration(dataDS);
  const backfill: [DataSource, DeferredTails] = [dataDS, deferTails(dataDS)];
  if (!plan) return runInSeparateTransactions(schemaDS, backfill, BACKFILL_PHASE_REASON);
  announceEachMigration(contractDS);
  if (plan.hasMissingType) {
    return runInSeparateTransactions(schemaDS, backfill, ENUM_SEPARATE_TRANSACTIONS_REASON, contractDS);
  }
  await runAtomic(plan.precommittable, schemaDS, dataDS, contractDS, backfill[1]);
}

async function migrateAsSolePod(
  [schemaDS, dataDS, contractDS]: [DataSource, DataSource, DataSource],
  session: LockSession,
  phase: MigrationPhase | undefined
): Promise<void> {
  const pending = await pendingNames(schemaDS, dataDS, ...(phase ? [] : [contractDS]));
  const execute = () => executeMigrations(schemaDS, dataDS, contractDS, phase);
  if (!pending.length) {
    console.log('[migrations] No expand or backfill migrations pending — not cutting API traffic for this boot.');
    return execute();
  }
  console.log(`[migrations] ${pending.length} migration(s) pending: ${pending.join(', ')}`);
  await holdingActiveLock(session, execute);
}

/** False when MIGRATION_SKIP_IF_LOCKED found another server migrating and left the run to it. */
export async function run(
  schemaDS: DataSource = schemaDataSource,
  dataDS: DataSource = dataDataSource,
  contractDS: DataSource = contractDataSource
): Promise<boolean> {
  // process.env, not getEnvVars(): the parent sets it per spawn.
  let phase = parseMigrationPhase(process.env.MIGRATION_PHASE);
  for (const dataSource of [schemaDS, dataDS, contractDS]) {
    if (dataSource.isInitialized) continue;
    // A lost node would otherwise hold the transaction's row locks for the OS keepalive (~2h).
    withMigrationConnectionOptions(dataSource);
    await dataSource.initialize();
  }

  // getEnvVars(): this process has no ConfigModule, so settings only in the env file would be missed.
  const env = getEnvVars();
  if (phase === 'contract') return runContractPhase(contractDS, getLockWaitOptions(env));
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
      await migrateAsSolePod([schemaDS, dataDS, contractDS], session, phase);
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
      [schemaDataSource, dataDataSource, contractDataSource].map((dataSource) =>
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
