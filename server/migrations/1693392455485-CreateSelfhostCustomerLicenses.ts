import { LICENSE_TYPE } from 'src/helpers/license.helper';
import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class CreateSelfhostCustomerLicenses1693392455485 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'selfhost_customer_licenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'license_key',
            type: 'varchar',
            length: '2000',
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'customer_id',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'license_type',
            type: 'enum',
            enumName: 'selfhost_customer_licenses_license_type_enum',
            enum: [LICENSE_TYPE.TRIAL, LICENSE_TYPE.BUSINESS, LICENSE_TYPE.ENTERPRISE],
            isNullable: false,
            default: `'${LICENSE_TYPE.TRIAL}'`,
          },
          {
            name: 'hostname',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'subpath',
            type: 'varchar',
            isNullable: true,
            length: '200',
          },
          {
            name: 'other_data',
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

    await queryRunner.createUniqueConstraint(
      'selfhost_customer_licenses',
      new TableUnique({
        columnNames: ['email'],
        name: 'selfhost_customer_licenses_email_unique',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('selfhost_customer_licenses');
  }
}
