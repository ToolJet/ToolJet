import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDataQueryFolderTables1743251000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'data_query_folders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'app_version_id',
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
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'data_query_folder_mappings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'child_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'child_type',
            type: 'enum',
            enum: ['query', 'folder'],
            isNullable: false,
          },
          {
            name: 'index',
            type: 'integer',
            isNullable: false,
            default: 0,
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
            name: 'UQ_data_query_folder_mapping_child',
            columnNames: ['child_id', 'child_type'],
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'data_query_folder_mappings',
      new TableIndex({
        name: 'IDX_data_query_folder_mappings_parent_id',
        columnNames: ['parent_id'],
      })
    );

    await queryRunner.createIndex(
      'data_query_folder_mappings',
      new TableIndex({
        name: 'IDX_data_query_folder_mappings_child_id',
        columnNames: ['child_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('data_query_folder_mappings', true);
    await queryRunner.dropTable('data_query_folders', true);
  }
}
