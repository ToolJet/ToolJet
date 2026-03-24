import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderDataSourceConstraints1774255111000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // C2: A data source can only belong to one folder at a time.
    // The existing constraint (folder_id, data_source_id) prevents duplicates within the same folder,
    // but doesn't prevent a DS from being in multiple folders. Add UNIQUE on data_source_id alone.
    await queryRunner.query(
      `ALTER TABLE folder_data_sources ADD CONSTRAINT folder_data_sources_data_source_id_unique UNIQUE (data_source_id)`
    );

    // I7: Prevent the same folder from being assigned to the same permissions row twice,
    // matching the pattern from group_folders which has UNIQUE(folder_id, folders_group_permissions_id).
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
