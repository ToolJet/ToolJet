import { MigrationInterface, QueryRunner } from 'typeorm';

// What a git branch draft last pushed: its content fingerprint and its rows. A review on a git branch covers
// committed content only, and the compare view shows that content rather than the draft's later edits.
export class AddCommittedFingerprintToAppVersions1793700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS committed_fingerprint varchar(80) NULL DEFAULT NULL`
    );
    await queryRunner.query(`ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS committed_content jsonb NULL DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS committed_content`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS committed_fingerprint`);
  }
}
