import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSelfhostCustomersAiFeature1740400796314 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'selfhost_customers_ai_feature',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'selfhost_customer_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'api_key',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'balance',
            type: 'int',
          },
          {
            name: 'renew_date',
            type: 'timestamp',
          },
          {
            name: 'ai_credit_fixed',
            type: 'int',
          },
          {
            name: 'ai_credit_multiplier',
            type: 'int',
          },
          {
            name: 'balance_renewed_date',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'selfhost_customers_ai_feature',
      new TableForeignKey({
        columnNames: ['selfhost_customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'selfhost_customers',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'selfhost_customers_ai_feature',
      new TableIndex({
        name: 'IDX_UNIQUE_SELFHOST_CUSTOMER_AI_FEATURE',
        columnNames: ['selfhost_customer_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
