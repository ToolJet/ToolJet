import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppVersionsBranchIdIndex1779800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Partial — only branched rows indexed.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_app_versions_branch_id"
      ON "app_versions" ("branch_id")
      WHERE "branch_id" IS NOT NULL
    `);

    // Composite for per-app branch existence probes.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_app_versions_app_id_branch_id"
      ON "app_versions" ("app_id", "branch_id")
    `);

    // folder_apps(folder_id) drives /api/folder-apps sidebar counts.
    // Existing indexes only cover app_id; folder_id IN (...) was scanning the table.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_folder_apps_folder_id"
      ON "folder_apps" ("folder_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_folder_apps_folder_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_versions_app_id_branch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_app_versions_branch_id"`);
  }
}
