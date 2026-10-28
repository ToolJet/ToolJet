import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowBundleLanguageUniqueIndex1767294792000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique index on (app_version_id, language) to support per-language bundles
    // This allows each app version to have one bundle per language (javascript, python, etc.)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_bundles_app_version_language
      ON workflow_bundles (app_version_id, language)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_workflow_bundles_app_version_language`);
  }
}
