import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDataSourceCreateAndDataSourceDeleteToGroupPermission1680160847536 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('group_permissions');

    if (!tableExists) {
      console.log('Table group_permissions does not exist. Migration will not be applied.');
      return;
    }
    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'data_source_create',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'data_source_delete',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('group_permissions');

    if (!tableExists) {
      console.log('Table group_permissions does not exist. Migration will not be applied.');
      return;
    }
    await queryRunner.dropColumn('group_permissions', 'data_source_create');
    await queryRunner.dropColumn('group_permissions', 'data_source_delete');
  }
}
