import { MigrationInterface, QueryRunner, Table } from 'typeorm';

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
            name: 'subscription_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'invoice_id',
            type: 'varchar',
            isNullable: false,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
