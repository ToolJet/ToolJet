import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDsFolderGranularPermissions1774255110000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'data_source_folder' to the resource_type PG enum
    await queryRunner.query(`
      ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'data_source_folder';
    `);

    // Create ds_folders_group_permissions table
    await queryRunner.query(`
      CREATE TABLE ds_folders_group_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        granular_permission_id UUID NOT NULL,
        can_edit_folder BOOLEAN NOT NULL DEFAULT false,
        can_configure_ds BOOLEAN NOT NULL DEFAULT false,
        can_use_ds BOOLEAN NOT NULL DEFAULT false,
        restrict_query_run BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ds_folders_gp_granular_permission FOREIGN KEY (granular_permission_id)
          REFERENCES granular_permissions(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ds_folders_gp_granular_permission_id
        ON ds_folders_group_permissions(granular_permission_id);
    `);

    // Create group_ds_folders join table
    await queryRunner.query(`
      CREATE TABLE group_ds_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ds_folders_group_permissions_id UUID NOT NULL,
        folder_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_group_ds_folders_permissions FOREIGN KEY (ds_folders_group_permissions_id)
          REFERENCES ds_folders_group_permissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_ds_folders_folder FOREIGN KEY (folder_id)
          REFERENCES folders(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_group_ds_folders_permissions_id
        ON group_ds_folders(ds_folders_group_permissions_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_group_ds_folders_folder_id
        ON group_ds_folders(folder_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_ds_folders`);
    await queryRunner.query(`DROP TABLE IF EXISTS ds_folders_group_permissions`);
    // Note: Cannot remove enum value in PG without recreating the type
  }
}
