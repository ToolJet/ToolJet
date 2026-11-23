import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsMaintenanceOnToApp1649860649643 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'is_maintenance_on',
        type: 'boolean',
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('apps', 'is_maintenance_on');
  }
}
