import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class createDatasourceOptions1667075911289 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'data_source_options',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
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
            name: 'options',
            type: 'json',
            isNullable: true,
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

    await queryRunner.createForeignKeys('data_source_options', [
      new TableForeignKey({
        columnNames: ['data_source_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_sources',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['environment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_environments',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createUniqueConstraint(
      'data_source_options',
      new TableUnique({
        name: 'data_source_env_data_source_options_unique',
        columnNames: ['data_source_id', 'environment_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('data_source_options');
  }
}
