/**
 * Reports the table locks each given migration takes and fails on ones that would stall the release still
 * serving (`classifyLocks`). Applies every other pending migration first, then runs the given ones in phase order,
 * each step in its own transaction. It commits them, so run it on a copy of the database.
 *
 * Usage (CI, on a copy of the snapshot): npm run db:probe-locks -- server/migrations/backfill/<file>.ts …
 */
import { resolve } from 'path';
import { DataSource, MigrationInterface, QueryRunner } from 'typeorm';
import schemaDataSource from '../src/migration-helpers/db-migrations-datasource';
import dataDataSource from '../src/migration-helpers/data-migrations-datasource';
import contractDataSource from '../src/migration-helpers/contract-migrations-datasource';
import { classifyLocks, MigrationPart, phaseOfMigrationFile, ProbedLock } from '../src/migration-helpers/lock-probe';
import { BackfillMigration, MigrationPhase } from '../src/migration-helpers/migration-mode';

const PHASE_ORDER: MigrationPhase[] = ['expand', 'backfill', 'contract'];
const REPO_ROOT = resolve(__dirname, '../..');

interface ProbedMigration {
  name: string;
  phase: MigrationPhase;
  instance: BackfillMigration;
}

async function load(file: string): Promise<ProbedMigration> {
  const exports: Record<string, unknown> = await import(resolve(REPO_ROOT, file));
  const [name, Migration] = Object.entries(exports).find(([key]) => /\d{13}$/.test(key)) ?? [];
  if (!name) throw new Error(`${file}: no migration class found.`);
  return { name, phase: phaseOfMigrationFile(file), instance: new (Migration as new () => MigrationInterface)() };
}

/** Commits every pending migration except the probed ones, so they run against the schema they expect. */
async function applyOthers(dataSource: DataSource, probed: ReadonlySet<string>): Promise<void> {
  await dataSource.initialize();
  const others = dataSource.migrations.filter((migration) => !probed.has(migration.name || migration.constructor.name));
  dataSource.migrations.splice(0, dataSource.migrations.length, ...others);
  await dataSource.runMigrations({ transaction: 'each' });
}

const relationLocks = (queryRunner: QueryRunner): Promise<{ oid: number; table: string; mode: string }[]> =>
  queryRunner.query(
    `SELECT c.oid::int AS oid, c.relname AS table, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
     WHERE l.pid = pg_backend_pid() AND l.locktype = 'relation' AND c.relkind IN ('r', 'p')
       AND c.relnamespace <> 'pg_catalog'::regnamespace`
  );

/** Each step in its own transaction, as a real run would after the earlier phases committed. */
async function probe(queryRunner: QueryRunner, migrations: ProbedMigration[]): Promise<string[]> {
  const [{ oids }] = await queryRunner.query(
    `SELECT array_agg(oid::int) AS oids FROM pg_class WHERE relkind IN ('r', 'p')`
  );
  const existing = new Set<number>(oids);
  const violations: string[] = [];
  const step = async ({ name, phase }: ProbedMigration, part: MigrationPart, run: () => Promise<void>) => {
    await queryRunner.startTransaction();
    try {
      await run();
      const locks: ProbedLock[] = (await relationLocks(queryRunner)).map(({ oid, table, mode }) => ({
        table,
        mode,
        existed: existing.has(oid),
      }));
      console.log(
        `[lock-probe] ${name} ${part}: ${locks.map(({ table, mode }) => `${table} ${mode}`).join(', ') || 'none'}`
      );
      violations.push(...classifyLocks(phase, part, locks).map((lock) => `${name} ${part}: ${lock}`));
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  };

  const ordered = PHASE_ORDER.flatMap((phase) => migrations.filter((migration) => migration.phase === phase));
  for (const migration of ordered.filter(({ phase }) => phase !== 'contract')) {
    await step(migration, 'up', () => migration.instance.up(queryRunner));
  }
  for (const migration of ordered) {
    const tail = migration.instance.tail?.bind(migration.instance);
    // Only the backfill phase runs tails.
    if (tail && migration.phase === 'backfill') await step(migration, 'tail', () => tail(queryRunner));
  }
  for (const migration of ordered.filter(({ phase }) => phase === 'contract')) {
    await step(migration, 'up', () => migration.instance.up(queryRunner));
  }
  return violations;
}

async function main(files: string[]): Promise<number> {
  const migrations = await Promise.all(files.map(load));
  const probed = new Set(migrations.map(({ name }) => name));
  for (const dataSource of [schemaDataSource, dataDataSource, contractDataSource])
    await applyOthers(dataSource, probed);

  const queryRunner = schemaDataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    const violations = await probe(queryRunner, migrations);
    if (!violations.length) return 0;
    console.error(
      `[lock-probe] These locks would stall the release still serving (server/AGENTS.md, Migrations):\n  ${violations.join('\n  ')}`
    );
    return 1;
  } finally {
    await queryRunner.release();
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
