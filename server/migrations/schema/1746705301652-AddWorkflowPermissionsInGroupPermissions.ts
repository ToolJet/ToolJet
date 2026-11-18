import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowPermissionsInGroupPermissions1746705301652 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE permission_groups
            ADD COLUMN workflow_create BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN workflow_delete BOOLEAN NOT NULL DEFAULT FALSE;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE permission_groups
            DROP COLUMN workflow_delete,
            DROP COLUMN workflow_create;
        `);
  }
}
