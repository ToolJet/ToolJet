import { existsSync, writeFileSync } from 'fs';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sleeps, so a test can look at locks mid-run. FIXTURE_DEADLOCK_ONCE deadlocks on the first attempt only;
 * FIXTURE_FAIL fails every attempt.
 */
export class SlowFixtureStep1790700000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SELECT pg_sleep($1)', [Number(process.env.FIXTURE_MIGRATION_SLEEP_SECONDS ?? '0')]);
    if (process.env.FIXTURE_FAIL) throw new Error('fixture data migration failed');
    const marker = process.env.FIXTURE_DEADLOCK_ONCE;
    if (marker && !existsSync(marker)) {
      writeFileSync(marker, 'deadlocked');
      await queryRunner.query(`DO $$ BEGIN RAISE EXCEPTION 'deadlock detected' USING ERRCODE = '40P01'; END $$`);
    }
  }

  public async down(): Promise<void> {
    // Reads only.
  }
}
