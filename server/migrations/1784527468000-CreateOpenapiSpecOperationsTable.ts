import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique, TableIndex } from 'typeorm';

export class CreateOpenapiSpecOperationsTable1784527468000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'openapi_spec_operations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'data_source_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'environment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'operation_id',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'service_id',
            type: 'text',
            isNullable: false,
            default: `'default'`,
          },
          {
            name: 'path',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'deprecated',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'security',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'has_request_body',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'parameters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'request_body_schema',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'openapi_spec_operations',
      new TableForeignKey({
        columnNames: ['data_source_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_sources',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'openapi_spec_operations',
      new TableForeignKey({
        columnNames: ['environment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_environments',
        onDelete: 'CASCADE',
      })
    );

    // No unique constraint on operation_id: it's optional per the OpenAPI 3.0/2.0 spec, and
    // even when present a malformed spec could technically reuse it across operations.
    // Identity/lookups instead go through this table's own generated `id`, scoped here.
    await queryRunner.createUniqueConstraint(
      'openapi_spec_operations',
      new TableUnique({
        name: 'UQ_OPENAPI_SPEC_OPERATION',
        columnNames: ['data_source_id', 'environment_id', 'id'],
      })
    );

    await queryRunner.createIndex(
      'openapi_spec_operations',
      new TableIndex({
        name: 'IDX_OPENAPI_SPEC_OPERATION_SERVICE',
        columnNames: ['data_source_id', 'environment_id', 'service_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('openapi_spec_operations', 'IDX_OPENAPI_SPEC_OPERATION_SERVICE');
    await queryRunner.dropUniqueConstraint('openapi_spec_operations', 'UQ_OPENAPI_SPEC_OPERATION');

    const table = await queryRunner.getTable('openapi_spec_operations');

    const dataSourceIdForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('data_source_id') !== -1);
    if (dataSourceIdForeignKey) {
      await queryRunner.dropForeignKey('openapi_spec_operations', dataSourceIdForeignKey);
    }

    const environmentIdForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('environment_id') !== -1);
    if (environmentIdForeignKey) {
      await queryRunner.dropForeignKey('openapi_spec_operations', environmentIdForeignKey);
    }

    await queryRunner.dropTable('openapi_spec_operations');
  }
}
