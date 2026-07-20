import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleFolderGranularPermissions1784551352800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'module_folder';
        `);

    await queryRunner.query(`
            ALTER TABLE "permission_groups"
            ADD COLUMN "module_folder_create" boolean NOT NULL DEFAULT false;
            ALTER TABLE "permission_groups"
            ADD COLUMN "module_folder_delete" boolean NOT NULL DEFAULT false;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing a value from an enum type; the
    // 'module_folder' value added to "resource_type" above is left in place,
    // matching the precedent in 1784112371030-AddWorkflowFolderGranularPermissions.
    await queryRunner.query(`
            ALTER TABLE "permission_groups"
            DROP COLUMN "module_folder_create";
            ALTER TABLE "permission_groups"
            DROP COLUMN "module_folder_delete";
        `);
  }
}
