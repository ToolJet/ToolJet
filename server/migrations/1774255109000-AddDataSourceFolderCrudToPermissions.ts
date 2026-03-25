import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderDataSourceCreateDeleteToPermissions1774255109000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE permission_groups ADD COLUMN folder_data_source_create BOOLEAN NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE permission_groups ADD COLUMN folder_data_source_delete BOOLEAN NOT NULL DEFAULT false`
    );

    await queryRunner.query(
      `UPDATE permission_groups SET folder_data_source_create = true, folder_data_source_delete = true WHERE name = 'admin'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE permission_groups DROP COLUMN IF EXISTS folder_data_source_create`);
    await queryRunner.query(`ALTER TABLE permission_groups DROP COLUMN IF EXISTS folder_data_source_delete`);
  }
}
