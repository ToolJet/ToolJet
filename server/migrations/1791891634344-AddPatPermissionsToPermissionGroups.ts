import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPatPermissionsToPermissionGroups1791891634344 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('permission_groups', [
      new TableColumn({ name: 'pat_create', type: 'boolean', default: false, isNullable: false }),
      new TableColumn({ name: 'pat_revoke', type: 'boolean', default: false, isNullable: false }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permission_groups', 'pat_revoke');
    await queryRunner.dropColumn('permission_groups', 'pat_create');
  }
}
