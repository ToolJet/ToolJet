import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateOrganizationSubscriptionTable1708923006176 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_subscriptions',
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
            name: 'customer_id',
            type: 'varchar',
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
            name: 'status',
            type: 'enum',
            enumName: 'subscription_status',
            enum: ['active', 'incomplete', 'incomplete_expired', 'trialing', 'past_due', 'canceled', 'unpaid'],
            default: `'incomplete'`,
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
            name: 'subscription_type',
            type: 'enum',
            enumName: 'subscription_type',
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

    await queryRunner.createUniqueConstraint(
      'organization_subscriptions',
      new TableUnique({
        name: 'unique_key_organization_subscriptions_subscription_id',
        columnNames: ['subscription_id'],
      })
    );
    await queryRunner.createForeignKey(
      'organization_subscriptions',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
      })
    );
    await queryRunner.createForeignKey(
      'organization_subscriptions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
