import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderDataSourceConstraints1774255111000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE folder_data_sources ADD CONSTRAINT folder_data_sources_data_source_id_unique UNIQUE (data_source_id)`
    );

    await queryRunner.query(
      `ALTER TABLE group_folder_data_sources ADD CONSTRAINT group_folder_data_sources_folder_permission_unique UNIQUE (folder_id, folder_data_sources_group_permissions_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE group_folder_data_sources DROP CONSTRAINT IF EXISTS group_folder_data_sources_folder_permission_unique`
    );
    await queryRunner.query(
      `ALTER TABLE folder_data_sources DROP CONSTRAINT IF EXISTS folder_data_sources_data_source_id_unique`
    );
  }
}
