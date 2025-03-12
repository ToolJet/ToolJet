import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';

export class AddTypeInOrganizationConstants1722357506889 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organization_constants',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enumName: 'OrganizationConstantType',
        enum: ['Global', 'Secret'],
        default: `'Global'`,
        isNullable: false,
      })
    );

    // Delete unique constraint for the combination of 'constantName' and 'organizationId'
    const table = await queryRunner.getTable('organization_constants');
    const uniqueConstraint = table!.uniques.find(
      (uq) => uq.columnNames.includes('constant_name') && uq.columnNames.includes('organization_id')
    );
    if (uniqueConstraint) {
      await queryRunner.dropUniqueConstraint('organization_constants', uniqueConstraint);
    }

    // Add a unique constraint for the combination of 'constantName', 'organizationId', and 'type'
    await queryRunner.createUniqueConstraint(
      'organization_constants',
      new TableUnique({
        name: 'UQ_organization_constant_name_type',
        columnNames: ['constant_name', 'organization_id', 'type'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organization_constants', 'type');
  }
}
