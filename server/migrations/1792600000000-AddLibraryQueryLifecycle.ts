import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

// Fresh feature schema: named editable drafts are independent from immutable saved snapshots.
// migration-lint: allow-destructive all constraints apply to fresh feature tables created in this delivery
export class AddLibraryQueryLifecycle1792600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('library_query_versions', [
      new TableColumn({ name: 'current_environment_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'created_from_version_id', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'description', type: 'varchar', length: '500', isNullable: true }),
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
    // Foreign keys get an index so a parent delete (ON DELETE SET NULL / CASCADE) does not scan the child table.
    await queryRunner.query(
      'CREATE INDEX "IDX_library_query_versions_current_environment_id" ON library_query_versions (current_environment_id)'
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_library_query_versions_created_from_version_id" ON library_query_versions (created_from_version_id)'
    );

    await queryRunner.createTable(
      new Table({
        name: 'library_query_drafts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'library_query_id', type: 'uuid' },
          { name: 'name', type: 'varchar', length: '25' },
          { name: 'description', type: 'varchar', length: '500', isNullable: true },
          { name: 'created_from_version_id', type: 'uuid', isNullable: true },
          { name: 'kind', type: 'varchar' },
          { name: 'data_source_id', type: 'uuid', isNullable: true },
          { name: 'options', type: 'jsonb' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
        foreignKeys: [
          {
            columnNames: ['library_query_id'],
            referencedTableName: 'library_queries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['created_from_version_id'],
            referencedTableName: 'library_query_versions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['data_source_id'],
            referencedTableName: 'data_sources',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'IDX_library_query_drafts_live_name',
            columnNames: ['library_query_id', 'name'],
            isUnique: true,
            where: 'deleted_at IS NULL',
          },
          // The partial index above covers live drafts only; a library query delete cascades to every draft.
          { name: 'IDX_library_query_drafts_library_query_id', columnNames: ['library_query_id'] },
          { name: 'IDX_library_query_drafts_data_source_id', columnNames: ['data_source_id'] },
          { name: 'IDX_library_query_drafts_created_from_version_id', columnNames: ['created_from_version_id'] },
        ],
      }),
      true
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_library_query_versions_live_name" ON library_query_versions (library_query_id, name) WHERE deleted_at IS NULL'
    );

    await queryRunner.createTable(
      new Table({
        name: 'library_query_states',
        columns: [
          { name: 'library_query_id', type: 'uuid', isPrimary: true },
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
            columnNames: ['released_version_id'],
            referencedTableName: 'library_query_versions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [{ name: 'IDX_library_query_states_released_version_id', columnNames: ['released_version_id'] }],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('library_query_states', true);
    await queryRunner.dropTable('library_query_drafts', true);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_library_query_versions_live_name"');
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
