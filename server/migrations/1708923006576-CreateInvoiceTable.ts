import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';

export class CreateInvoiceTable1708923006576 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_subscription_invoices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'customer_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'invoice_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_viewed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'invoice_link',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'paid_date',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'current_period_start',
            type: 'timestamp with time zone',
          },
          {
            name: 'current_period_end',
            type: 'timestamp with time zone',
          },
          {
            name: 'invoice_due',
            type: 'timestamp with time zone',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'open', 'paid', 'uncollectible', 'void', 'failed'],
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['recurring', 'subscription'],
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      })
    );

    await queryRunner.createUniqueConstraint(
      'organization_subscription_invoices',
      new TableUnique({
        name: 'unique_key_subscription_invoices_invoice_id',
        columnNames: ['invoice_id'],
      })
    );

    // Add foreign key constraints
    await queryRunner.addColumn(
      'organization_subscription_invoices',
      new TableColumn({
        name: 'organization_id',
        type: 'uuid',
      })
    );
    await queryRunner.createForeignKey(
      'organization_subscription_invoices',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
      })
    );

    await queryRunner.addColumn(
      'organization_subscription_invoices',
      new TableColumn({
        name: 'organization_subscription_id',
        type: 'uuid',
      })
    );
    await queryRunner.createForeignKey(
      'organization_subscription_invoices',
      new TableForeignKey({
        columnNames: ['organization_subscription_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_subscriptions',
      })
    );

    await queryRunner.addColumn(
      'organization_subscription_invoices',
      new TableColumn({
        name: 'user_id',
        type: 'uuid',
      })
    );
    await queryRunner.createForeignKey(
      'organization_subscription_invoices',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_subscription_invoices');
  }
}
