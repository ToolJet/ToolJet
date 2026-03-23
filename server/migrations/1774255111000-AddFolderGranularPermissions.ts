import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderGranularPermissions1774255111000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'folder' to the resource_type PG enum
    await queryRunner.query(`
      ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'folder';
    `);

    // Create folders_group_permissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS folders_group_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        granular_permission_id UUID NOT NULL UNIQUE,
        can_edit_folder BOOLEAN NOT NULL DEFAULT false,
        can_edit_apps BOOLEAN NOT NULL DEFAULT false,
        can_view_apps BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_folders_gp_granular_permission FOREIGN KEY (granular_permission_id)
          REFERENCES granular_permissions(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_folders_gp_granular_permission_id
        ON folders_group_permissions(granular_permission_id);
    `);

    // Create group_folders join table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folders_group_permissions_id UUID NOT NULL,
        folder_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_group_folders_permissions FOREIGN KEY (folders_group_permissions_id)
          REFERENCES folders_group_permissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_folders_folder FOREIGN KEY (folder_id)
          REFERENCES folders(id) ON DELETE CASCADE,
        CONSTRAINT uq_group_folders_folder_perm UNIQUE (folder_id, folders_group_permissions_id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_folders_permissions_id
        ON group_folders(folders_group_permissions_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_folders_folder_id
        ON group_folders(folder_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_folders`);
    await queryRunner.query(`DROP TABLE IF EXISTS folders_group_permissions`);
    // Note: Cannot remove enum value in PG without recreating the type
  }
}
