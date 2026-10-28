import { MigrationInterface, QueryRunner } from 'typeorm';

/** Uses the value the schema migration added (55P04 if both share a transaction), then sleeps. */
export class UseFixtureColorValue1790700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SELECT 'blue'::fixture_color`);
    await queryRunner.query('SELECT pg_sleep($1)', [Number(process.env.FIXTURE_MIGRATION_SLEEP_SECONDS ?? '0')]);
  }

  public async down(): Promise<void> {
    // Reads only.
  }
}
