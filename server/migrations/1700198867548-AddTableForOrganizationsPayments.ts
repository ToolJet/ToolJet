import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTableForOrganizationsPayments1700198867548 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organizations_payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'subscription_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'invoice_id',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'invoice_paid_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'no_of_editors',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'no_of_readers',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enumName: 'stripe_payment_status',
            enum: ['success', 'failed'],
            default: `'failed'`,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'company_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'is_license_generated',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'invoice_type',
            type: 'enum',
            enumName: 'stripe_invoice_type',
            enum: ['recurring', 'subscription'],
            isNullable: false,
          },
          {
            name: 'subscription_type',
            type: 'enum',
            enumName: 'cloud_subscription_type',
            enum: ['monthly', 'yearly'],
            isNullable: false,
          },
          {
            name: 'mode',
            type: 'enum',
            enumName: 'stripe_mode',
            enum: ['payment', 'setup', 'subscription'],
            isNullable: false,
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
      true
    );
    await queryRunner.createForeignKey(
      'organizations_payments',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
      })
    );
    await queryRunner.createForeignKey(
      'organizations_payments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
