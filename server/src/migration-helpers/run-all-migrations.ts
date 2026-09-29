import { DataSource, MigrationExecutor, QueryRunner } from 'typeorm';
import schemaDataSource from './db-migrations-datasource';
import dataDataSource from './data-migrations-datasource';
import { extractEnumValueAdditions } from './enum-value-additions';

/**
 * PostgreSQL forbids using an enum value in the same transaction that added it via
 * `ALTER TYPE ... ADD VALUE` (SQLSTATE 55P04, "unsafe use of new value") — UNLESS the
 * enum type was itself created earlier in that same transaction. Because `run()` executes
 * all schema and data migrations inside ONE transaction, an UPGRADE that adds a value to
 * an already-committed enum and then backfills rows using it (a data migration filtering
 * or inserting that value) fails. Fresh installs are unaffected: their CREATE TYPE and
 * ADD VALUE run in the same transaction, so Postgres treats the value as safe.
 *
 * Enum-value additions are irreversible anyway — Postgres cannot drop an enum value, and
 * such migrations' down() leaves the value in place — so they gain nothing from the atomic
 * rollback. We therefore pre-run each pending ADD VALUE whose type ALREADY EXISTS on a
 * separate, auto-committed connection BEFORE opening the shared transaction. `ADD VALUE
 * IF NOT EXISTS` keeps both this pre-run and the migration's own statement idempotent, and
 * types that don't exist yet are skipped (they are created-and-used safely inside the
 * upcoming transaction). This is what the old two-process runner got for free by committing
 * the schema phase before the data phase.
 */
async function precommitEnumValueAdditions(dataSource: DataSource): Promise<void> {
  // No queryRunner passed → getPendingMigrations reads executed migrations on its own
  // auto-committed connection, independent of the shared transaction opened later.
  const pending = await new MigrationExecutor(dataSource).getPendingMigrations();
  const additions = extractEnumValueAdditions(pending);
  if (additions.length === 0) return;

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    for (const { typeExpression, typeName, value, migrationName } of additions) {
      // Skip types not yet created: they will be CREATEd and used inside the shared
      // transaction, where adding + using a value in one transaction is safe.
      const [{ exists }] = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = $1)`, [
        typeName,
      ]);
      if (!exists) continue;

      // No transaction is active on this query runner, so each statement auto-commits —
      // the value is durable before the shared transaction opens. Identifiers/values come
      // from our own migration source (not user input), so interpolation is safe here.
      await queryRunner.query(`ALTER TYPE ${typeExpression} ADD VALUE IF NOT EXISTS '${value}'`);
      console.log(`[migrations] pre-committed enum value ${typeName}.'${value}' (from ${migrationName}).`);
    }
  } finally {
    await queryRunner.release();
  }
}

/**
 * Runs schema migrations (src/migrations) and data migrations (data-migrations)
 * inside a SINGLE database transaction, in that fixed order.
 *
 * Why this exists:
 * `typeorm migration:run` was previously invoked twice (schema, then data) as two
 * separate OS processes joined by `&&`. Each invocation opened its own connection
 * and its own transaction, so the schema transaction COMMITTED before the data
 * migrations even started. A failing data migration therefore left the committed
 * schema changes behind while only the data changes rolled back.
 *
 * PostgreSQL DDL is transactional, so we run both phases through one query runner
 * and one transaction: any failure — schema or data — rolls the whole thing back.
 *
 * Ordering: we deliberately run ALL schema migrations before ALL data migrations
 * (data backfills assume the final schema shape). We do NOT merge the two migration
 * globs into one data source, because TypeORM sorts purely by the timestamp encoded
 * in the class name and schema/data timestamps interleave — merging would reorder
 * them and break that invariant. Instead we drive two MigrationExecutor passes that
 * share the same query runner (and therefore the same transaction).
 *
 * Concurrency: the LockMigrationsTable migrations (lowest timestamps, present in both
 * dirs) run first in the schema pass and `LOCK TABLE migrations`, serialising
 * concurrent boots. Because everything is one transaction, the lock is now held
 * across both phases instead of being released between them.
 *
 * Enum values: adding a value to an existing enum (`ALTER TYPE ... ADD VALUE`) and then
 * using it in the same transaction is illegal in PostgreSQL (55P04). Since both phases
 * now share one transaction, `precommitEnumValueAdditions` commits such additions on a
 * separate connection first — see that function's comment. It is idempotent and
 * concurrency-safe (`ADD VALUE IF NOT EXISTS`).
 */

async function runPass(label: string, dataSourceWithMigrations: DataSource, queryRunner: QueryRunner): Promise<void> {
  // Passing an already-in-transaction queryRunner makes MigrationExecutor run the
  // migrations inside our transaction without starting or committing its own
  // (see typeorm MigrationExecutor: it only starts/commits when no transaction is
  // active — `transactionStartedByUs` stays false here).
  const executor = new MigrationExecutor(dataSourceWithMigrations, queryRunner);
  executor.transaction = 'all';

  const executed = await executor.executePendingMigrations();
  if (executed.length) {
    console.log(`[migrations] ${label}: executed ${executed.length} migration(s):`);
    executed.forEach((migration) => console.log(`  - ${migration.name}`));
  } else {
    console.log(`[migrations] ${label}: no pending migrations.`);
  }
}

async function run(): Promise<void> {
  await schemaDataSource.initialize();
  // dataDataSource is initialized only to load its migration classes; every query
  // runs through the schema data source's query runner so both passes share one
  // connection and one transaction.
  await dataDataSource.initialize();

  // Must run BEFORE the shared transaction opens: commits enum-value additions that an
  // upgrade would otherwise add and use in the same transaction (PostgreSQL 55P04).
  await precommitEnumValueAdditions(schemaDataSource);

  const queryRunner = schemaDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await runPass('schema', schemaDataSource, queryRunner);
    await runPass('data', dataDataSource, queryRunner);
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

run()
  .then(async () => {
    await schemaDataSource.destroy();
    await dataDataSource.destroy();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await schemaDataSource.destroy().catch(() => undefined);
    await dataDataSource.destroy().catch(() => undefined);
    process.exit(1);
  });
