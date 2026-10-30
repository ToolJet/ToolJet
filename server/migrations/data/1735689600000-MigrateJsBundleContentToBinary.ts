import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data migration to copy JavaScript bundle content from the legacy
 * bundle_content (TEXT) column to bundle_binary (BYTEA).
 */
export class MigrateJsBundleContentToBinary1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate existing JS bundles from bundle_content (TEXT) to bundle_binary (BYTEA)
    // Only migrate rows where bundle_content exists and bundle_binary is empty
    await queryRunner.query(`
      UPDATE workflow_bundles
      SET bundle_binary = convert_to(bundle_content, 'UTF8')
      WHERE bundle_content IS NOT NULL
        AND bundle_binary IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration: copy bundle_binary back to bundle_content for JS bundles
    // This only affects JavaScript bundles (not Python tar.gz bundles)
    await queryRunner.query(`
      UPDATE workflow_bundles
      SET bundle_content = convert_from(bundle_binary, 'UTF8')
      WHERE language = 'javascript'
        AND bundle_binary IS NOT NULL
        AND bundle_content IS NULL
    `);
  }
}
