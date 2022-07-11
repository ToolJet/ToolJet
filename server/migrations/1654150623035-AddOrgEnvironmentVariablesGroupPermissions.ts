import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrgEnvironmentVariablesGroupPermissions1654150623035 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'org_environment_variable_create',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'org_environment_variable_update',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'org_environment_variable_delete',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_permissions', 'org_environment_variable_delete');
    await queryRunner.dropColumn('group_permissions', 'org_environment_variable_update');
    await queryRunner.dropColumn('group_permissions', 'org_environment_variable_create');
  }
}
