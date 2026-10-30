import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

// Per-query lifecycle for the query library: versions get an environment, a parent and a description,
// and library_query_states holds the draft/release pointers (rows are created lazily; a missing row
// means "has a draft, nothing released").
// migration-lint: allow-destructive foreign keys sit on new nullable columns, so the previous release never sets them and its writes are not rejected
export class AddLibraryQueryLifecycle1792600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('library_query_versions', [
      new TableColumn({ name: 'current_environment_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'created_from_version_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'description', type: 'varchar', isNullable: true }),
    ]);
    await queryRunner.createForeignKeys('library_query_versions', [
      new TableForeignKey({
        columnNames: ['current_environment_id'],
        referencedTableName: 'app_environments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['created_from_version_id'],
        referencedTableName: 'library_query_versions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'library_query_states',
        columns: [
          { name: 'library_query_id', type: 'uuid', isPrimary: true },
          { name: 'has_draft', type: 'boolean', isNullable: false, default: true },
          { name: 'draft_created_from_version_id', type: 'uuid', isNullable: true },
          { name: 'draft_description', type: 'varchar', isNullable: true },
          { name: 'released_version_id', type: 'uuid', isNullable: true },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['library_query_id'],
            referencedTableName: 'library_queries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['draft_created_from_version_id'],
            referencedTableName: 'library_query_versions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['released_version_id'],
            referencedTableName: 'library_query_versions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('library_query_states', true);
    const table = await queryRunner.getTable('library_query_versions');
    for (const fk of table?.foreignKeys.filter((f) =>
      f.columnNames.some((c) => c === 'current_environment_id' || c === 'created_from_version_id')
    ) ?? []) {
      await queryRunner.dropForeignKey('library_query_versions', fk);
    }
    await queryRunner.dropColumns('library_query_versions', [
      'current_environment_id',
      'created_from_version_id',
      'description',
    ]);
  }
}
