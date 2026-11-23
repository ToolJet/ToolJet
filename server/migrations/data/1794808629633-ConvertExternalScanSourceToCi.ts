import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'ConvertExternalScanSourceToCi1794808629633';

/**
 * Finishes AddCiScanSource1793600000001: converts scans stored with source 'external' to 'ci', then validates the
 * app_version_scans_source_check that migration added NOT VALID. VALIDATE CONSTRAINT blocks neither reads nor writes,
 * and does nothing once the check is valid.
 */
export class ConvertExternalScanSourceToCi1794808629633 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS total FROM app_version_scans WHERE source = 'external'`
    );
    console.log(`${MIGRATION_NAME}: [START] Convert external scan sources to ci: ${total}`);
    const [, updated] = await queryRunner.query(`UPDATE app_version_scans SET source = 'ci' WHERE source = 'external'`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Convert external scan sources to ci finished. Updated: ${updated ?? 0}`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app_version_scans VALIDATE CONSTRAINT app_version_scans_source_check');
  }

  public async down(): Promise<void> {
    // Not reversed here: AddCiScanSource1793600000001's down() puts 'external' and the old check back.
  }
}
