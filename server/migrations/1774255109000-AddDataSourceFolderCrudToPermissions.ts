import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSourceFolderCreateDeleteToPermissions1774255109000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE permission_groups ADD COLUMN data_source_folder_create BOOLEAN NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE permission_groups ADD COLUMN data_source_folder_delete BOOLEAN NOT NULL DEFAULT false`
    );

    // Set true for existing admin groups
    await queryRunner.query(
      `UPDATE permission_groups SET data_source_folder_create = true, data_source_folder_delete = true WHERE name = 'admin'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE permission_groups DROP COLUMN IF EXISTS data_source_folder_create`);
    await queryRunner.query(`ALTER TABLE permission_groups DROP COLUMN IF EXISTS data_source_folder_delete`);
  }
}
