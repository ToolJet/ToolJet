import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeReadOnDashboardColumnName1673424772525 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.renameColumn('app_group_permissions', 'read_on_dashboard', 'hide_from_dashboard');
    } catch {
      console.log('No column found, Already changed the column name');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('app_group_permissions', 'hide_from_dashboard', 'read_on_dashboard');
  }
}
