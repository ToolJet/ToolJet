import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWorkflowScheduleParams1790300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'workflow_schedules',
      new TableColumn({ name: 'params', type: 'jsonb', isNullable: true })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('workflow_schedules', 'params');
  }
}
