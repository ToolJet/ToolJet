import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleCreateDeleteToGroupPermissions1782196835449 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill lives in BackfillModuleCreateDeleteForDefaultGroups data migration.
    await queryRunner.query(`
      SET LOCAL lock_timeout = '5s';
      ALTER TABLE "permission_groups"
        ADD COLUMN "module_create" boolean NOT NULL DEFAULT false,
        ADD COLUMN "module_delete" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permission_groups"
        DROP COLUMN "module_create",
        DROP COLUMN "module_delete";
    `);
  }
}
