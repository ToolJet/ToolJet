import { MigrationInterface, QueryRunner } from 'typeorm';

// Throwaway: verifies the migration-timing CI job fails a migration over the 30s limit. Do not merge.
export class MigrationTimingProbeSlow1791300000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SELECT pg_sleep(40)');
  }

  async down(): Promise<void> {
    // nothing to undo
  }
}
