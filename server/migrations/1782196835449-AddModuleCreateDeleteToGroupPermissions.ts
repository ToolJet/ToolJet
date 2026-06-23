import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddModuleCreateDeleteToGroupPermissions1782196835449 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'permission_groups',
      new TableColumn({
        name: 'module_create',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'permission_groups',
      new TableColumn({
        name: 'module_delete',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permission_groups', 'module_create');
    await queryRunner.dropColumn('permission_groups', 'module_delete');
  }
}
