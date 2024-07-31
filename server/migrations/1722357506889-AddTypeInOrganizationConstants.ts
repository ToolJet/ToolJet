import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organization_constants', 'type');
  }
}
