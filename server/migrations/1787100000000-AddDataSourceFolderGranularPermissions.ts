import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dedicated granular-permission resource for data-source folders, mirroring the workflow-folder
 * (1784112371030) and module-folder (1784551352800) migrations. Data-source folders must NOT share
 * the app-folder (type='folder') permission set — an app-folder grant would otherwise leak into
 * data-source folders and vice-versa.
 *
 * Also adds `can_run_query` to the shared `folders_group_permissions` table: a data-source-folder
 * grant with can_run_query=false restricts query execution on the data sources inside the folder
 * (mirroring the per-data-source data_sources_group_permissions.can_run_query). Defaults true and
 * is unused for app/workflow/module folders.
 */
export class AddDataSourceFolderGranularPermissions1787100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'data_source_folder';
        `);

    await queryRunner.query(`
            ALTER TABLE "permission_groups"
            ADD COLUMN "data_source_folder_create" boolean NOT NULL DEFAULT false;
            ALTER TABLE "permission_groups"
            ADD COLUMN "data_source_folder_delete" boolean NOT NULL DEFAULT false;
        `);

    await queryRunner.query(`
            ALTER TABLE "folders_group_permissions"
            ADD COLUMN "can_run_query" boolean NOT NULL DEFAULT true;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing a value from an enum type; the 'data_source_folder' value
    // added to "resource_type" above is left in place, matching the precedent in
    // 1784112371030-AddWorkflowFolderGranularPermissions and 1784551352800-AddModuleFolderGranularPermissions.
    await queryRunner.query(`
            ALTER TABLE "folders_group_permissions"
            DROP COLUMN "can_run_query";
        `);

    await queryRunner.query(`
            ALTER TABLE "permission_groups"
            DROP COLUMN "data_source_folder_create";
            ALTER TABLE "permission_groups"
            DROP COLUMN "data_source_folder_delete";
        `);
  }
}
