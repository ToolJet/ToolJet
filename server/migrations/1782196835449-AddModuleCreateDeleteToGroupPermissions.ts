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

    // Backfill existing admin and builder role groups on non-fresh deployments.
    // On a fresh DB this matches 0 rows (no groups yet); DEFAULT_GROUP_PERMISSIONS covers that path.
    await queryRunner.query(`
      UPDATE permission_groups
      SET module_create = true, module_delete = true
      WHERE name IN ('admin', 'builder') AND type = 'default'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permission_groups', 'module_create');
    await queryRunner.dropColumn('permission_groups', 'module_delete');
  }
}
