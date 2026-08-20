import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateDataSourceVersionFolders1784600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'data_source_version_folders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'folder_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'data_source_version_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
        ],
        uniques: [
          {
            // A data source lives in at most one folder per branch. The DSV id already
            // encodes (data_source_id, branch_id), so uniqueness on it alone is sufficient.
            name: 'UQ_data_source_version_folders_dsv',
            columnNames: ['data_source_version_id'],
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'data_source_version_folders',
      new TableForeignKey({
        columnNames: ['folder_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'folders',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'data_source_version_folders',
      new TableForeignKey({
        columnNames: ['data_source_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_source_versions',
        onDelete: 'CASCADE',
      })
    );

    // Drives the folder sidebar member-count query (folder_id IN (...)),
    // mirroring idx_folder_apps_folder_id.
    await queryRunner.createIndex(
      'data_source_version_folders',
      new TableIndex({
        name: 'IDX_data_source_version_folders_folder_id',
        columnNames: ['folder_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drops the table together with its foreign keys, unique constraint and index.
    await queryRunner.dropTable('data_source_version_folders', true);
  }
}
