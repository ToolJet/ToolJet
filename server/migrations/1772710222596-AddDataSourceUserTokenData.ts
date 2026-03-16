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

    // Partial unique index: one row per (option + user) for multi-auth rows
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_datasource_user_token_data_option_user
      ON datasource_user_token_data (data_source_option_id, user_id)
      WHERE user_id IS NOT NULL
    `);

    // Partial unique index: one row per option for single-auth rows (user_id = NULL)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_datasource_user_token_data_option_no_user
      ON datasource_user_token_data (data_source_option_id)
      WHERE user_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('datasource_user_token_data', true);
  }
}