import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// Released snapshots of a query library query. The draft stays on data_queries; each release copies
// its kind, data source and options here as `v{version_number}` (the name is computed, never stored).
// Rows are soft-deleted, and version numbers are never reused.
export class CreateLibraryQueryVersions1792500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'library_query_versions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'data_query_id', type: 'uuid', isNullable: false },
          { name: 'version_number', type: 'integer', isNullable: false },
          { name: 'kind', type: 'varchar', isNullable: false },
          { name: 'data_source_id', type: 'uuid', isNullable: true },
          { name: 'options', type: 'jsonb', isNullable: false },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        uniques: [{ name: 'UQ_library_query_versions_query_number', columnNames: ['data_query_id', 'version_number'] }],
        foreignKeys: [
          {
            columnNames: ['data_query_id'],
            referencedTableName: 'data_queries',
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
  }
}
