import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddSelfhostAICreditHistory1757488858256 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    
    await queryRunner.createTable(
      new Table({
        name: 'selfhost_customers_ai_credit_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'amount',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'ai_credits',
            type: 'int',
            default: 0,
          },
          {
            name: 'operation',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'wallet_type',
            type: 'wallet_type_enum',
          },
          {
            name: 'transaction_type',
            type: 'transaction_type_enum',
          },
          {
            name: 'status',
            type: 'transaction_status_enum',
          },
          {
            name: 'selfhost_customer_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'selfhost_customers_ai_credit_history',
      new TableForeignKey({
        columnNames: ['selfhost_customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'selfhost_customers',
        onDelete: 'CASCADE',
      }),
    );

    //Add Index
    await queryRunner.createIndex(
      'selfhost_customers_ai_credit_history',
      new TableIndex({
        name: 'IDX_selfhost_customers_ai_credit_history_selfhost_customer_id',
        columnNames: ['selfhost_customer_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK
    const table = await queryRunner.getTable('selfhost_customers_ai_credit_history');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('selfhost_customer_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('selfhost_customers_ai_credit_history', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('selfhost_customers_ai_credit_history');

    // Drop enums
    await queryRunner.query(`DROP TYPE "transaction_type_enum_selfhost"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum_selfhost"`);
  }
}
