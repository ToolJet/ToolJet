import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// Workspace-owned query identities and immutable saved snapshots.
// Rows are soft-deleted, and version numbers are never reused.
export class CreateLibraryQueryVersions1792500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'library_query_folders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'organization_id', type: 'uuid' },
          { name: 'name', type: 'varchar' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        uniques: [{ name: 'UQ_library_query_folders_workspace_name', columnNames: ['organization_id', 'name'] }],
        foreignKeys: [
          {
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );
    await queryRunner.createTable(
      new Table({
        name: 'library_queries',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'organization_id', type: 'uuid' },
          { name: 'name', type: 'varchar' },
          { name: 'folder_id', type: 'uuid', isNullable: true },
          { name: 'co_relation_id', type: 'uuid', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        uniques: [
          { name: 'UQ_library_queries_workspace_name', columnNames: ['organization_id', 'name'] },
          // Several NULLs are allowed: only imported queries carry a co_relation_id.
          { name: 'UQ_library_queries_workspace_co_relation', columnNames: ['organization_id', 'co_relation_id'] },
        ],
        indices: [{ name: 'IDX_library_queries_folder_id', columnNames: ['folder_id'] }],
        foreignKeys: [
          {
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['folder_id'],
            referencedTableName: 'library_query_folders',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    );
    await queryRunner.createTable(
      new Table({
        name: 'library_query_versions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'library_query_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '25', isNullable: false },
          { name: 'version_number', type: 'integer', isNullable: false },
          { name: 'kind', type: 'varchar', isNullable: false },
          { name: 'data_source_id', type: 'uuid', isNullable: true },
          { name: 'options', type: 'jsonb', isNullable: false },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [
          { name: 'UQ_library_query_versions_query_number', columnNames: ['library_query_id', 'version_number'] },
        ],
        // Foreign keys get an index so a parent delete (ON DELETE SET NULL) does not scan every snapshot.
        indices: [{ name: 'IDX_library_query_versions_data_source_id', columnNames: ['data_source_id'] }],
        foreignKeys: [
          {
            columnNames: ['library_query_id'],
            referencedTableName: 'library_queries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            // A deleted data source leaves the snapshot in place; running it then reports the source as gone.
            columnNames: ['data_source_id'],
            referencedTableName: 'data_sources',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('library_query_versions', true);
    await queryRunner.dropTable('library_queries', true);
    await queryRunner.dropTable('library_query_folders', true);
  }
}
