import { DataSource, MigrationExecutor, QueryRunner } from 'typeorm';
import schemaDataSource from './db-migrations-datasource';
import dataDataSource from './data-migrations-datasource';

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
