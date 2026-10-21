import { DataSource, MigrationExecutor, QueryRunner } from 'typeorm';
import schemaDataSource from './db-migrations-datasource';
import dataDataSource from './data-migrations-datasource';
import { extractEnumValueAdditions, EnumValueAddition } from './enum-value-additions';
import {
  excludeLockSentinels,
  getLockWaitOptions,
  getSchemaPhaseOptions,
  isLockNotAvailableError,
  LockSession,
  MIGRATION_ACTIVE_LOCK_KEY,
  SchemaPhaseOptions,
  SKIPPED_EXIT_CODE,
  withMigrationAdvisoryLock,
} from './migrations-table-gate';
import { MigrationPhase, parseMigrationPhase } from './migration-status';
import { getEnvVars } from '../../scripts/database-config-utils';

/**
 * Runs schema migrations (src/migrations) then data migrations (data-migrations).
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
 *
 * Phases (`MIGRATION_PHASE`, set per spawn in async mode; unset keeps the joint run above):
 *   - `schema`: at boot, before Nest starts. Only schema migrations, in one short transaction under
 *     `lock_timeout`, retried on 55P03 so a queued ALTER never stalls readers of released apps.
 *   - `data`: the server-spawned run. Schema (normally empty, catch-up) then data, in two
 *     transactions, so a data failure rolls back the data only.
 *
 * Concurrency (`migrations-table-gate.ts`): one pod at a time holds the migration advisory lock
 * from "what is pending?" to commit; the others wait their turn instead of crash-looping. While
 * real migrations run it also holds the active lock, which serving pods read to answer writes
 * with 503 rather than serve them against a half-migrated schema.
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
    await runPassInSharedTransaction('schema', schemaDS, queryRunner);
    await runPassInSharedTransaction('data', dataDS, queryRunner);
    await queryRunner.commitTransaction();
    console.log('[migrations] Committed schema + data migrations in a single transaction.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('[migrations] Migration failed. Rolled back schema AND data changes.');
    throw error;
  } finally {
    await queryRunner.release();
  }
}

async function runTwoPhase(schemaDS: DataSource, dataDS: DataSource, reason: string): Promise<void> {
  console.log(`[migrations] ${reason} Schema commits before data runs.`);
  await runPassInOwnTransaction('schema', schemaDS);
  await runPassInOwnTransaction('data', dataDS);
  console.log('[migrations] Committed schema and data migrations in separate transactions.');
}

const ENUM_TWO_PHASE_REASON =
  'A pending ALTER TYPE ADD VALUE targets an enum type created in this run; running schema and data in ' +
  'separate transactions (PostgreSQL cannot add and use an enum value in one transaction).';

const DATA_PHASE_REASON =
  'Data phase: running schema (catch-up, normally empty) and data in separate transactions, so a data ' +
  'failure rolls back the data only.';

const SCHEMA_LOCK_RETRY_DELAY_MS = 2000;

async function runSchemaPhase(schemaDS: DataSource, options: SchemaPhaseOptions): Promise<boolean> {
  // Most boots (restart, scale-up, a pod booting during a long data phase) end here without the lock.
  if ((await realPendingMigrationNames(schemaDS)).length === 0) {
    console.log('[migrations] No schema migrations pending before boot.');
    return true;
  }
  await withMigrationAdvisoryLock(schemaDS, options.lockWait, {}, async (session) => {
    const pending = await realPendingMigrationNames(schemaDS);
    if (pending.length === 0) {
      console.log('[migrations] Another pod applied the schema migrations.');
      return;
    }
    console.log(`[migrations] ${pending.length} schema migration(s) pending: ${pending.join(', ')}`);
    await holdingActiveLock(session, () => applySchemaUnderLockTimeout(schemaDS, options));
  });
  return true;
}

async function applySchemaUnderLockTimeout(
  schemaDS: DataSource,
  { lockTimeoutMs, lockAttempts }: SchemaPhaseOptions
): Promise<void> {
  announceEachMigration(schemaDS);
  // Same enum handling as the joint run, so a schema migration can use a value an earlier one added.
  await precommitEnumValueAdditions((await planEnumAdditions(schemaDS)).precommittable, schemaDS);
  for (let attempt = 1; ; attempt++) {
    const queryRunner = schemaDS.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(`SET LOCAL lock_timeout = ${lockTimeoutMs}`);
      await runPassInSharedTransaction('schema', schemaDS, queryRunner);
      await queryRunner.commitTransaction();
      console.log('[migrations] Committed schema migrations.');
      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (!isLockNotAvailableError(error) || attempt >= lockAttempts) {
        console.error('[migrations] Schema migrations failed. Rolled back the schema changes.');
        throw error;
      }
      console.warn(
        `[migrations] A schema migration waited over ${lockTimeoutMs}ms for a table lock; rolled back so ` +
          `readers are not stalled behind it. Retrying (attempt ${attempt + 1} of ${lockAttempts}).`
      );
    } finally {
      await queryRunner.release();
    }
    await new Promise((resolve) => setTimeout(resolve, SCHEMA_LOCK_RETRY_DELAY_MS));
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

/** Pending migrations that represent real work — see `excludeLockSentinels`. */
async function realPendingMigrationNames(dataSourceWithMigrations: DataSource): Promise<string[]> {
  const pending = await new MigrationExecutor(dataSourceWithMigrations).getPendingMigrations();
  return excludeLockSentinels(pending.map(({ name }) => name));
}

/** False when MIGRATION_SKIP_IF_LOCKED found another server migrating and left the run to it. */
export async function run(
  schemaDS: DataSource = schemaDataSource,
  dataDS: DataSource = dataDataSource
): Promise<boolean> {
  // process.env, not getEnvVars(): set by the parent per spawn.
  const phase = parseMigrationPhase(process.env.MIGRATION_PHASE);
  if (!schemaDS.isInitialized) await schemaDS.initialize();
  // dataDS is initialized to load its migration classes; queries run through whichever
  // query runner each pass uses.
  if (!dataDS.isInitialized) await dataDS.initialize();

  // getEnvVars(), not process.env: this process never boots ConfigModule, so settings that
  // live only in the env file would otherwise be invisible here.
  const env = getEnvVars();
  if (phase === 'schema') return runSchemaPhase(schemaDS, getSchemaPhaseOptions(env));
  const lockWaitOptions = getLockWaitOptions(env);

  // Everything from "what is pending?" to "migrations committed" happens as the cluster's only
  // migrating pod. Reading the pending list outside this lock is what lets a losing pod wake up
  // with a stale list and re-run an already-applied migration.
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
  phase: MigrationPhase
): Promise<void> {
  const pending = [...(await realPendingMigrationNames(schemaDS)), ...(await realPendingMigrationNames(dataDS))];

  if (pending.length === 0) {
    console.log('[migrations] No schema or data migrations pending — not cutting API traffic for this boot.');
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

async function executeMigrations(schemaDS: DataSource, dataDS: DataSource, phase: MigrationPhase): Promise<void> {
  announceEachMigration(schemaDS);
  announceEachMigration(dataDS);
  if (phase === 'data') return runTwoPhase(schemaDS, dataDS, DATA_PHASE_REASON);
  const { precommittable, hasMissingType } = await planEnumAdditions(schemaDS);

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
