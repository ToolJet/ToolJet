import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFolderDataSourceGranularPermissions1774255110000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'folder_data_source';
    `);

    await queryRunner.query(`
      CREATE TABLE folder_data_sources_group_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        granular_permission_id UUID NOT NULL,
        can_edit_folder BOOLEAN NOT NULL DEFAULT false,
        can_configure_ds BOOLEAN NOT NULL DEFAULT false,
        can_use_ds BOOLEAN NOT NULL DEFAULT false,
        can_run_query BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_folder_data_sources_gp_granular_permission FOREIGN KEY (granular_permission_id)
          REFERENCES granular_permissions(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_folder_data_sources_gp_granular_permission_id
        ON folder_data_sources_group_permissions(granular_permission_id);
    `);

    await queryRunner.query(`
      CREATE TABLE group_folder_data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folder_data_sources_group_permissions_id UUID NOT NULL,
        folder_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT fk_group_folder_data_sources_permissions FOREIGN KEY (folder_data_sources_group_permissions_id)
          REFERENCES folder_data_sources_group_permissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_folder_data_sources_folder FOREIGN KEY (folder_id)
          REFERENCES folders(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_group_folder_data_sources_permissions_id
        ON group_folder_data_sources(folder_data_sources_group_permissions_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_group_folder_data_sources_folder_id
        ON group_folder_data_sources(folder_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_folder_data_sources`);
    await queryRunner.query(`DROP TABLE IF EXISTS folder_data_sources_group_permissions`);
    // Note: Cannot remove enum value in PG without recreating the type
  }
}
