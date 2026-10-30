import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrgEnvironmentConstantGroupPermission1687383173997 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'org_environment_constant_create',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'org_environment_constant_delete',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_permissions', 'org_environment_constant_delete');
    await queryRunner.dropColumn('group_permissions', 'org_environment_constant_create');
  }
}
