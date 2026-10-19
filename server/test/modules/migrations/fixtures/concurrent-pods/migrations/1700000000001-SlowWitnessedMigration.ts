import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stands in for a real schema migration that takes long enough for other pods to pile up
 * behind the `migrations` table lock.
 *
 * It witnesses its own execution: the row count in `migration_witness` is how the spec proves
 * the body ran exactly once across every pod, rather than trusting TypeORM's bookkeeping.
 */
export class SlowWitnessedMigration1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS migration_witness (
        id serial PRIMARY KEY,
        pod text NOT NULL,
        ran_at timestamptz NOT NULL DEFAULT clock_timestamp()
      )
    `);
    await queryRunner.query('INSERT INTO migration_witness (pod) VALUES ($1)', [process.env.POD_ID ?? 'unknown']);
    await queryRunner.query(`SELECT pg_sleep($1)`, [Number(process.env.FIXTURE_MIGRATION_SLEEP_SECONDS ?? '6')]);
  }

  public async down(): Promise<void> {}
}
