import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddOrganizationAICreditHistory1757488747540 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(
      `CREATE TYPE "transaction_type_enum" AS ENUM ('debit', 'credit')`
    );
    await queryRunner.query(
      `CREATE TYPE "transaction_status_enum" AS ENUM ('success', 'failure')`
    );

    await queryRunner.createTable(
      new Table({
        name: 'organization_ai_credit_history',
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
            name: 'organization_id',
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
      'organization_ai_credit_history',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    //Add Index
    await queryRunner.createIndex(
      'organization_ai_credit_history',
      new TableIndex({
        name: 'IDX_organization_ai_credit_history_org_id',
        columnNames: ['organization_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK
    const table = await queryRunner.getTable('organization_ai_credit_history');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('organization_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('organization_ai_credit_history', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('organization_ai_credit_history');

    // Drop enums
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
  }
}
