import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddDataSourceUserTokenData1772710222596 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'datasource_user_token_data',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'data_source_option_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true, // enforces 1-to-1 with data_source_options
          },
          {
            name: 'auth_token',
            type: 'text',
            isNullable: true,
            comment: 'Encrypted at application layer before persistence',
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
            comment: 'Encrypted at application layer before persistence',
          },
          {
            name: 'more_details',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true, // ifNotExists
    );

    await queryRunner.createForeignKey(
      'datasource_user_token_data',
      new TableForeignKey({
        name: 'fk_datasource_user_token_data_source_option',
        columnNames: ['data_source_option_id'],
        referencedTableName: 'data_source_options',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    //Index for quick lookup by data_source_option_id and user_id
    await queryRunner.createIndex(
      'datasource_user_token_data',
      new TableIndex({
        name: 'idx_datasource_user_token_data_option_user',
        columnNames: ['data_source_option_id', 'user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('datasource_user_token_data', true);
  }
}