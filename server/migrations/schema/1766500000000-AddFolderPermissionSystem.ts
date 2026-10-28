import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddFolderPermissionSystem1766500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add 'folder' to resource_type enum
    // NOTE: New enum values cannot be used in the same transaction in PostgreSQL
    // Data seeding is done in a separate migration (1766500000001-SeedFolderPermissions.ts)
    await queryRunner.query(`
      ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'folder';
    `);

    // Step 2: Add folder_create and folder_delete columns to permission_groups if they don't exist
    const hasfolderCreate = await queryRunner.hasColumn('permission_groups', 'folder_create');
    if (!hasfolderCreate) {
      await queryRunner.addColumn(
        'permission_groups',
        new TableColumn({
          name: 'folder_create',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      );
    }

    const hasFolderDelete = await queryRunner.hasColumn('permission_groups', 'folder_delete');
    if (!hasFolderDelete) {
      await queryRunner.addColumn(
        'permission_groups',
        new TableColumn({
          name: 'folder_delete',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      );
    }

    // Step 2b: Migrate existing folder_crud values to folder_create and folder_delete
    // This preserves permissions for existing users
    const hasFolderCrud = await queryRunner.hasColumn('permission_groups', 'folder_crud');
    if (hasFolderCrud) {
      await queryRunner.query(`
        UPDATE permission_groups 
        SET folder_create = folder_crud, folder_delete = folder_crud
        WHERE folder_crud = true;
      `);

      // Drop the old folder_crud column after migration
      await queryRunner.dropColumn('permission_groups', 'folder_crud');
    }

    // Step 3: Add created_by column to folders table
    await queryRunner.addColumn(
      'folders',
      new TableColumn({
        name: 'created_by',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add foreign key for created_by -> users.id
    await queryRunner.createForeignKey(
      'folders',
      new TableForeignKey({
        name: 'fk_folders_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Step 4: Create folders_group_permissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS folders_group_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        granular_permission_id UUID UNIQUE NOT NULL,
        can_edit_folder BOOLEAN DEFAULT false,
        can_edit_apps BOOLEAN DEFAULT false,
        can_view_apps BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_folders_granular_permission_id 
          FOREIGN KEY (granular_permission_id) 
          REFERENCES granular_permissions(id) 
          ON DELETE CASCADE
      );
    `);

    // Create index on granular_permission_id
    await queryRunner.createIndex(
      'folders_group_permissions',
      new TableIndex({
        name: 'idx_folders_group_permissions_granular_permission_id',
        columnNames: ['granular_permission_id'],
      })
    );

    // Step 5: Create group_folders table (junction table)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folder_id UUID,
        folders_group_permissions_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_group_folders_folder_id 
          FOREIGN KEY (folder_id) 
          REFERENCES folders(id) 
          ON DELETE CASCADE,
        CONSTRAINT fk_group_folders_permissions_id 
          FOREIGN KEY (folders_group_permissions_id) 
          REFERENCES folders_group_permissions(id) 
          ON DELETE CASCADE,
        CONSTRAINT unique_folder_and_permission 
          UNIQUE (folder_id, folders_group_permissions_id)
      );
    `);

    // Create indexes for group_folders
    await queryRunner.createIndex(
      'group_folders',
      new TableIndex({
        name: 'idx_group_folders_folder_id',
        columnNames: ['folder_id'],
      })
    );

    await queryRunner.createIndex(
      'group_folders',
      new TableIndex({
        name: 'idx_group_folders_permissions_id',
        columnNames: ['folders_group_permissions_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop group_folders indexes and table
    await queryRunner.dropIndex('group_folders', 'idx_group_folders_permissions_id');
    await queryRunner.dropIndex('group_folders', 'idx_group_folders_folder_id');
    await queryRunner.query(`DROP TABLE IF EXISTS group_folders`);

    // Drop folders_group_permissions index and table
    await queryRunner.dropIndex('folders_group_permissions', 'idx_folders_group_permissions_granular_permission_id');
    await queryRunner.query(`DROP TABLE IF EXISTS folders_group_permissions`);

    // Drop created_by foreign key and column from folders
    await queryRunner.dropForeignKey('folders', 'fk_folders_created_by');
    await queryRunner.dropColumn('folders', 'created_by');

    // Drop folder_create and folder_delete columns from permission_groups
    const hasFolderCreate = await queryRunner.hasColumn('permission_groups', 'folder_create');
    if (hasFolderCreate) {
      await queryRunner.dropColumn('permission_groups', 'folder_create');
    }

    const hasFolderDelete = await queryRunner.hasColumn('permission_groups', 'folder_delete');
    if (hasFolderDelete) {
      await queryRunner.dropColumn('permission_groups', 'folder_delete');
    }
  }
}
