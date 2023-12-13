import { LICENSE_TYPE } from 'src/helpers/license.helper';
import { MigrationInterface, QueryRunner, TableColumn, Table, TableUnique, TableForeignKey } from 'typeorm';

export class AddOrganizationLicenseTable1698848739145 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_license',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          }),
          new TableColumn({
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          }),
          new TableColumn({
            name: 'license_type',
            type: 'enum',
            enumName: 'license_type',
            enum: [LICENSE_TYPE.TRIAL, LICENSE_TYPE.ENTERPRISE, LICENSE_TYPE.BUSINESS],
            isNullable: false,
          }),
          new TableColumn({
            name: 'expiry_date',
            type: 'timestamp',
            isNullable: false,
          }),
          new TableColumn({
            name: 'license_key',
            type: 'varchar',
            isNullable: true,
          }),
          new TableColumn({
            name: 'terms',
            type: 'json',
            isNullable: false,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          }),
        ],
      })
    );
    await queryRunner.createUniqueConstraint(
      'organization_license',
      new TableUnique({
        columnNames: ['organization_id'],
        name: 'organization_license_organization_id_unique',
      })
    );
    await queryRunner.createForeignKey(
      'organization_license',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_license');
  }
}
