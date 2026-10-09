import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDashboardV2Tables1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cascade = (column: string, table: string) => ({
      columnNames: [column],
      referencedTableName: table,
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    });

    await queryRunner.createTable(
      new Table({
        name: 'user_app_activity',
        columns: [
          { name: 'user_id', type: 'uuid', isPrimary: true },
          { name: 'app_id', type: 'uuid', isPrimary: true },
          { name: 'branch_id', type: 'uuid', isPrimary: true },
          { name: 'last_viewed_at', type: 'timestamp', isNullable: true },
          { name: 'last_edited_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          cascade('user_id', 'users'),
          cascade('app_id', 'apps'),
          cascade('branch_id', 'organization_git_sync_branches'),
        ],
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'pinned_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'app_id', type: 'uuid', isNullable: true },
          { name: 'folder_id', type: 'uuid', isNullable: true },
          { name: 'position', type: 'int' },
          { name: 'pinned_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          cascade('user_id', 'users'),
          cascade('branch_id', 'organization_git_sync_branches'),
          cascade('app_id', 'apps'),
          cascade('folder_id', 'folders'),
        ],
        checks: [{ name: 'chk_pinned_items_one_resource', expression: 'num_nonnulls(app_id, folder_id) = 1' }],
        uniques: [
          { name: 'uq_pinned_items_user_branch_app', columnNames: ['user_id', 'branch_id', 'app_id'] },
          { name: 'uq_pinned_items_user_branch_folder', columnNames: ['user_id', 'branch_id', 'folder_id'] },
        ],
      })
    );

    await queryRunner.createIndex(
      'user_app_activity',
      new TableIndex({ name: 'idx_user_app_activity_app_branch_edited', columnNames: ['app_id', 'branch_id', 'last_edited_at'] })
    );
    await queryRunner.createIndex(
      'pinned_items',
      new TableIndex({ name: 'idx_pinned_items_user_branch', columnNames: ['user_id', 'branch_id'] })
    );
    await queryRunner.createIndex('apps', new TableIndex({ name: 'idx_apps_organization_id_type', columnNames: ['organization_id', 'type'] }));
    await queryRunner.createIndex('folders', new TableIndex({ name: 'idx_folders_organization_id_type', columnNames: ['organization_id', 'type'] }));
    // No folder_apps index: its branch_id comes from a data migration, which runs after all schema migrations.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('folders', 'idx_folders_organization_id_type');
    await queryRunner.dropIndex('apps', 'idx_apps_organization_id_type');
    await queryRunner.dropTable('pinned_items');
    await queryRunner.dropTable('user_app_activity');
  }
}
