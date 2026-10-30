import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeReadOnDashboardColumnName1673424772525 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('app_group_permissions', 'read_on_dashboard', 'hide_from_dashboard');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('app_group_permissions', 'hide_from_dashboard', 'read_on_dashboard');
  }
}
