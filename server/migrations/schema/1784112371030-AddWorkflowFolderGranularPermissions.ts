import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowFolderGranularPermissions1784112371030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder';
        `);

    await queryRunner.query(`
            ALTER TABLE "permission_groups"
            ADD COLUMN "workflow_folder_create" boolean NOT NULL DEFAULT false;
            ALTER TABLE "permission_groups"
            ADD COLUMN "workflow_folder_delete" boolean NOT NULL DEFAULT false;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing a value from an enum type; the
    // 'workflow_folder' value added to "resource_type" above is left in place,
    // matching the precedent in 1746705448788-AddAppTypeInAppsGroupPermissions.
    await queryRunner.query(`
            ALTER TABLE "permission_groups"
            DROP COLUMN "workflow_folder_create";
            ALTER TABLE "permission_groups"
            DROP COLUMN "workflow_folder_delete";
        `);
  }
}
