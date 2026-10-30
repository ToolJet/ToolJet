import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFolderUpdateAndDeletePermissionToGroupPermissions1653391166172 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'folder_delete',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'group_permissions',
      new TableColumn({
        name: 'folder_update',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_permissions', 'folder_delete');
    await queryRunner.dropColumn('group_permissions', 'folder_update');
  }
}
