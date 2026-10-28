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
 * Runs expand migrations (migrations/expand) then backfill migrations (migrations/backfill).
 * Phase and run-strategy meanings: `MigrationPhase` in migration-mode.ts.
 *
 * Why this exists:
 * `typeorm migration:run` was previously invoked twice (schema, then data) as two
 * separate OS processes joined by `&&`. Each opened its own connection and its own
 * transaction, so the schema transaction COMMITTED before the data migrations even
 * started. A failing data migration therefore left the committed schema changes
 * behind while only the data changes rolled back.
 *
 * Default (atomic) mode: PostgreSQL DDL is transactional, so we run both phases
 * through one query runner and one transaction — any failure, schema or data, rolls
 * the whole thing back.
 *
 * The enum exception (why it is not ALWAYS atomic):
 * PostgreSQL forbids USING an enum value in the same transaction that added it via
 * `ALTER TYPE ... ADD VALUE` (SQLSTATE 55P04) — with NO exemption for a type created
 * in that same transaction. So "add an enum value in a schema migration and read/write
 * it in a data migration" cannot live in one transaction. Two cases:
 *   - UPGRADE (the enum TYPE already exists from a prior deploy): we pre-commit the
 *     value on a separate connection BEFORE the shared transaction, then stay atomic.
 *     See `precommitEnumValueAdditions`.
 *   - FRESH INSTALL / brand-new enum TYPE (the type is created in THIS run, so it does
 *     not exist yet and its value cannot be pre-committed): full atomicity is impossible.
 *     We fall back to running schema and data in SEPARATE transactions — the original,
 *     enum-safe ordering (schema commits, so the value is durable before data uses it).
 *     Atomicity is lost only for that run, which is acceptable: a fresh/reset install has
 *     no pre-existing data to protect, and PostgreSQL leaves no atomic alternative.
 *
 * Ordering: we always run ALL schema migrations before ALL data migrations (data
 * backfills assume the final schema shape). We do NOT merge the two migration globs into
 * one data source — TypeORM sorts by the timestamp in the class name and schema/data
 * timestamps interleave, which would reorder them and break that invariant. Instead we
 * drive two MigrationExecutor passes.
 */

/**
 * Runs a migration pass inside a transaction the caller already opened. Passing an
 * already-in-transaction queryRunner makes MigrationExecutor run the migrations inside
 * our transaction without starting or committing its own (see typeorm MigrationExecutor:
 * it only starts/commits when no transaction is active — `transactionStartedByUs` stays
 * false here).
 */
async function runPassInSharedTransaction(
  label: string,
  dataSourceWithMigrations: DataSource,
  queryRunner: QueryRunner
): Promise<void> {
  const executor = new MigrationExecutor(dataSourceWithMigrations, queryRunner);
  executor.transaction = 'all';
  logExecuted(label, await executor.executePendingMigrations());
}

/**
 * Runs a migration pass in its own transaction (MigrationExecutor creates the query
 * runner and wraps all pending migrations in one transaction, committing on success and
 * rolling back on failure). Used for the enum fallback, where schema must commit before
 * data runs.
 */
async function runPassInOwnTransaction(label: string, dataSourceWithMigrations: DataSource): Promise<void> {
  const executor = new MigrationExecutor(dataSourceWithMigrations);
  executor.transaction = 'all';
  logExecuted(label, await executor.executePendingMigrations());
}

function logExecuted(label: string, executed: { name: string }[]): void {
  if (executed.length) {
    console.log(`[migrations] ${label}: executed ${executed.length} migration(s):`);
    executed.forEach((migration) => console.log(`  - ${migration.name}`));
  } else {
    console.log(`[migrations] ${label}: no pending migrations.`);
  }
}

interface EnumAdditionPlan {
  /** Pending enum-value additions whose target type ALREADY EXISTS (safe to pre-commit). */
  precommittable: EnumValueAddition[];
  /** True if any pending addition targets a type that does NOT exist yet (forces fallback). */
  hasMissingType: boolean;
}

/**
 * Inspects pending schema migrations for `ALTER TYPE ... ADD VALUE` and checks, on a
 * throwaway connection, whether each target enum type already exists.
 */
async function planEnumAdditions(dataSource: DataSource): Promise<EnumAdditionPlan> {
  const pending = await new MigrationExecutor(dataSource).getPendingMigrations();
  const additions = extractEnumValueAdditions(pending);
  if (additions.length === 0) return { precommittable: [], hasMissingType: false };

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    const precommittable: EnumValueAddition[] = [];
    let hasMissingType = false;
    for (const addition of additions) {
      const [{ exists }] = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = $1)`, [
        addition.typeName,
      ]);
      if (exists) precommittable.push(addition);
      else hasMissingType = true;
    }
    return { precommittable, hasMissingType };
  } finally {
    await queryRunner.release();
  }
}

/**
 * Commits enum-value additions whose type already exists, on a separate auto-committed
 * connection, BEFORE the shared transaction opens — so a data migration inside that
 * transaction can use the value. `ADD VALUE IF NOT EXISTS` keeps this idempotent and
 * concurrency-safe, and makes the migration's own `ADD VALUE IF NOT EXISTS` statement a
 * no-op when it later runs inside the transaction. Enum-value additions are irreversible
 * in PostgreSQL, so committing them ahead of the atomic block costs nothing.
 */
async function precommitEnumValueAdditions(additions: EnumValueAddition[], dataSource: DataSource): Promise<void> {
  if (additions.length === 0) return;
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    for (const { typeExpression, typeName, value, migrationName } of additions) {
      // Identifiers/values come from our own migration source (not user input), so
      // interpolation is safe here.
      await queryRunner.query(`ALTER TYPE ${typeExpression} ADD VALUE IF NOT EXISTS '${value}'`);
      console.log(`[migrations] pre-committed enum value ${typeName}.'${value}' (from ${migrationName}).`);
    }
  } finally {
    await queryRunner.release();
  }
}

async function runAtomic(precommittable: EnumValueAddition[], schemaDS: DataSource, dataDS: DataSource): Promise<void> {
  await precommitEnumValueAdditions(precommittable, schemaDS);

  const queryRunner = schemaDS.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await runPassInSharedTransaction('expand', schemaDS, queryRunner);
    await runPassInSharedTransaction('backfill', dataDS, queryRunner);
    await queryRunner.commitTransaction();
    console.log('[migrations] Committed expand + backfill migrations in a single transaction.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('[migrations] Migration failed. Rolled back expand AND backfill changes.');
    throw error;
  } finally {
    await queryRunner.release();
  }
}

async function runTwoPhase(schemaDS: DataSource, dataDS: DataSource, reason: string): Promise<void> {
  console.log(`[migrations] ${reason} Expand commits before backfill runs.`);
  await runPassInOwnTransaction('expand', schemaDS);
  await runPassInOwnTransaction('backfill', dataDS);
  console.log('[migrations] Committed expand and backfill migrations in separate transactions.');
}

const ENUM_TWO_PHASE_REASON =
  'A pending ALTER TYPE ADD VALUE targets an enum type created in this run; running schema and data in ' +
  'separate transactions (PostgreSQL cannot add and use an enum value in one transaction).';

const BACKFILL_PHASE_REASON =
  'Backfill phase: running expand (catch-up, normally empty) and backfill in separate transactions, so a ' +
  'backfill failure rolls back the backfill only.';

const SCHEMA_LOCK_RETRY_DELAY_MS = 2000;

async function runSchemaPhase(schemaDS: DataSource, options: SchemaPhaseOptions): Promise<boolean> {
  // Most boots (restart, scale-up, a pod booting during a long data phase) end here without the advisory lock.
  if ((await realPendingMigrationNames(schemaDS)).length === 0) {
    console.log('[migrations] No expand migrations pending before boot.');
    return true;
  }
  await withMigrationAdvisoryLock(schemaDS, options.lockWait, {}, async (session) => {
    const pending = await realPendingMigrationNames(schemaDS);
    if (pending.length === 0) {
      console.log('[migrations] Another pod applied the expand migrations.');
      return;
    }
    console.log(`[migrations] ${pending.length} expand migration(s) pending: ${pending.join(', ')}`);
    await holdingActiveLock(session, () => applySchemaUnderLockTimeout(schemaDS, options));
  });
  return true;
}

async function applySchemaUnderLockTimeout(
  schemaDS: DataSource,
  { lockTimeoutMs, lockAttempts }: SchemaPhaseOptions
): Promise<void> {
  await precommitEnumValueAdditions((await planEnumAdditions(schemaDS)).precommittable, schemaDS);
  announceEachMigration(schemaDS);
  const applyOnce = async () => {
    const queryRunner = schemaDS.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
      await runPassInSharedTransaction('expand', schemaDS, queryRunner);
      await queryRunner.commitTransaction();
      console.log('[migrations] Committed expand migrations.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  };
  try {
    await retryOnLockTimeout(applyOnce, { attempts: lockAttempts, retryDelayMs: SCHEMA_LOCK_RETRY_DELAY_MS }, (next) =>
      console.warn(
        `[migrations] An expand migration waited over ${lockTimeoutMs}ms for a table lock; rolled back so ` +
          `readers are not stalled behind it. Retrying (attempt ${next} of ${lockAttempts}).`
      )
    );
  } catch (error) {
    console.error('[migrations] Expand migrations failed. Rolled back the expand changes.');
    throw error;
  }
}

/** Serving pods refuse writes while this is held; it dies with this session, so a killed pod cannot leave it set. */
async function holdingActiveLock(session: LockSession, work: () => Promise<void>): Promise<void> {
  await session.query('SELECT pg_advisory_lock($1)', [MIGRATION_ACTIVE_LOCK_KEY]);
  try {
    await work();
  } finally {
    await session.query('SELECT pg_advisory_unlock($1)', [MIGRATION_ACTIVE_LOCK_KEY]).catch(() => undefined);
  }
}

async function realPendingMigrations(dataSourceWithMigrations: DataSource): Promise<Migration[]> {
  const pending = await new MigrationExecutor(dataSourceWithMigrations).getPendingMigrations();
  return pending.filter(({ name }) => !LOCK_SENTINEL_MIGRATION_NAMES.includes(name));
}

async function realPendingMigrationNames(dataSourceWithMigrations: DataSource): Promise<string[]> {
  return (await realPendingMigrations(dataSourceWithMigrations)).map(({ name }) => name);
}

// ponytail: probe-then-read; a joint run starting between the two can still stall the read.
async function migrationsTableLocked(dataSource: DataSource, lockTimeoutMs: number): Promise<boolean> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    // A role statement_timeout below lockTimeoutMs would cancel with 57014 instead of 55P03.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);
    await queryRunner.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
    const [{ table }] = await queryRunner.query(`SELECT to_regclass('migrations') AS table`);
    if (table) await queryRunner.query('LOCK TABLE migrations IN ACCESS SHARE MODE');
    return false;
  } catch (error) {
    if (isLockNotAvailableError(error)) return true;
    throw error;
  } finally {
    await queryRunner.rollbackTransaction().catch(() => undefined);
    await queryRunner.release();
  }
}

/** Older migrations may drop, rename or SET NOT NULL, which breaks the release still serving. */
async function pendingBeforeAuthoringRules(schemaDS: DataSource, dataDS: DataSource): Promise<string[]> {
  const pending = [...(await realPendingMigrations(schemaDS)), ...(await realPendingMigrations(dataDS))];
  return pending.map(({ name }) => name).filter(blocksAsyncUpgrade);
}

/** Split phases are serialised by the advisory lock; the sentinels' LOCK TABLE would stall booting pods. */
function withoutLockSentinels(dataSource: DataSource): void {
  const kept = dataSource.migrations.filter(
    (migration) => !LOCK_SENTINEL_MIGRATION_NAMES.includes(migration.name || migration.constructor.name)
  );
  dataSource.migrations.splice(0, dataSource.migrations.length, ...kept);
}

/** False when MIGRATION_SKIP_IF_LOCKED found another server migrating and left the run to it. */
export async function run(
  schemaDS: DataSource = schemaDataSource,
  dataDS: DataSource = dataDataSource
): Promise<boolean> {
  // process.env, not getEnvVars(): set by the parent per spawn.
  let phase = parseMigrationPhase(process.env.MIGRATION_PHASE);
  // A lost node leaves the migration transaction's row locks for the OS default (~2h) without this.
  for (const dataSource of [schemaDS, dataDS])
    if (!dataSource.isInitialized) withMigrationConnectionOptions(dataSource);
  if (!schemaDS.isInitialized) await schemaDS.initialize();
  // dataDS is initialized to load its migration classes; queries run through whichever
  // query runner each pass uses.
  if (!dataDS.isInitialized) await dataDS.initialize();

  // getEnvVars(), not process.env: this process never boots ConfigModule, so settings that
  // live only in the env file would otherwise be invisible here.
  const env = getEnvVars();
  const schemaOptions = getSchemaPhaseOptions(env);
  if (phase === 'expand') {
    // A single-transaction or blocking run holds LOCK TABLE migrations to the end; reading behind it hits statement_timeout.
    if (await migrationsTableLocked(schemaDS, schemaOptions.lockTimeoutMs)) {
      console.log('[migrations] Another server is migrating with the migrations table locked; waiting for it.');
      await withMigrationAdvisoryLock(schemaDS, schemaOptions.lockWait, {}, async () => undefined);
    }
    const legacy = await pendingBeforeAuthoringRules(schemaDS, dataDS);
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

  if (phase === 'expand') return runSchemaPhase(schemaDS, schemaOptions);
  const lockWaitOptions = getLockWaitOptions(env);

  // Server-managed modes: another server already migrating owns the run. Waiting would make this one
  // re-run the same migrations after that run ends, even a failed one.
  const skipIfBusy = process.env.MIGRATION_SKIP_IF_LOCKED === 'true';
  const ran = await withMigrationAdvisoryLock(
    schemaDS,
    lockWaitOptions,
    {},
    async (session) => {
      await migrateAsSolePod(schemaDS, dataDS, session, phase);
      return true;
    },
    { skipIfBusy }
  );
  if (!ran) console.log('[migrations] Another server is running migrations; leaving the run to it.');
  return !!ran;
}

async function migrateAsSolePod(
  schemaDS: DataSource,
  dataDS: DataSource,
  session: LockSession,
  phase: MigrationPhase | undefined
): Promise<void> {
  const pending = [...(await realPendingMigrationNames(schemaDS)), ...(await realPendingMigrationNames(dataDS))];

  if (pending.length === 0) {
    console.log('[migrations] No expand or backfill migrations pending — not cutting API traffic for this boot.');
    await executeMigrations(schemaDS, dataDS, phase);
    return;
  }

  console.log(`[migrations] ${pending.length} migration(s) pending: ${pending.join(', ')}`);
  await holdingActiveLock(session, () => executeMigrations(schemaDS, dataDS, phase));
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
  const plan = phase === 'backfill' ? null : await planEnumAdditions(schemaDS);
  announceEachMigration(schemaDS);
  announceEachMigration(dataDS);
  if (!plan) return runTwoPhase(schemaDS, dataDS, BACKFILL_PHASE_REASON);
  const { precommittable, hasMissingType } = plan;

  if (hasMissingType) {
    await runTwoPhase(schemaDS, dataDS, ENUM_TWO_PHASE_REASON);
  } else {
    await runAtomic(precommittable, schemaDS, dataDS);
  }
}

// Auto-run only when invoked directly (dev: ts-node this file; prod: node dist/…js).
// Importing the module (e.g. from a test) does not execute migrations.
if (require.main === module) {
  run()
    .then(async (ran) => {
      await schemaDataSource.destroy();
      await dataDataSource.destroy();
      process.exit(ran ? 0 : SKIPPED_EXIT_CODE);
    })
    .catch(async (error) => {
      console.error(error);
      await schemaDataSource.destroy().catch(() => undefined);
      await dataDataSource.destroy().catch(() => undefined);
      process.exit(1);
    });
}
