import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSourceFolderGranularPermissions1774255110000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'data_source_folder' to the resource_type PG enum
    await queryRunner.query(`
      ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'data_source_folder';
    `);

    // Create data_source_folders_group_permissions table
    await queryRunner.query(`
      CREATE TABLE data_source_folders_group_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        granular_permission_id UUID NOT NULL,
        can_edit_folder BOOLEAN NOT NULL DEFAULT false,
        can_configure_ds BOOLEAN NOT NULL DEFAULT false,
        can_use_ds BOOLEAN NOT NULL DEFAULT false,
        can_run_query BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_data_source_folders_gp_granular_permission FOREIGN KEY (granular_permission_id)
          REFERENCES granular_permissions(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_data_source_folders_gp_granular_permission_id
        ON data_source_folders_group_permissions(granular_permission_id);
    `);

    // Create group_data_source_folders join table
    await queryRunner.query(`
      CREATE TABLE group_data_source_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_source_folders_group_permissions_id UUID NOT NULL,
        folder_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_group_data_source_folders_permissions FOREIGN KEY (data_source_folders_group_permissions_id)
          REFERENCES data_source_folders_group_permissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_data_source_folders_folder FOREIGN KEY (folder_id)
          REFERENCES folders(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_group_data_source_folders_permissions_id
        ON group_data_source_folders(data_source_folders_group_permissions_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_group_data_source_folders_folder_id
        ON group_data_source_folders(folder_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_data_source_folders`);
    await queryRunner.query(`DROP TABLE IF EXISTS data_source_folders_group_permissions`);
    // Note: Cannot remove enum value in PG without recreating the type
  }
}
