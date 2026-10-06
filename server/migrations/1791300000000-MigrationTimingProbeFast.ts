import { MigrationInterface, QueryRunner } from 'typeorm';

// Throwaway: verifies the migration-timing CI job passes a fast migration. Do not merge.
export class MigrationTimingProbeFast1791300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE IF NOT EXISTS migration_timing_probe (id int)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS migration_timing_probe');
  }
}
