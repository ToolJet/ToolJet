import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReadOnDashboardToAppGroupPermissions1661448846469 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_group_permissions',
      new TableColumn({
        name: 'read_on_dashboard',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_group_permissions', 'read_on_dashboard');
  }
}
