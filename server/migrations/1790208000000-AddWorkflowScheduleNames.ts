import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddWorkflowScheduleNames1790208000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('workflow_schedules', [
      new TableColumn({ name: 'name', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'app_id', type: 'uuid', isNullable: true }),
    ]);

    await queryRunner.query(`
      UPDATE workflow_schedules schedule
      SET app_id = version.app_id
      FROM app_versions version
      WHERE version.id = schedule.workflow_id
    `);
    await queryRunner.changeColumn(
      'workflow_schedules',
      'app_id',
      new TableColumn({ name: 'app_id', type: 'uuid', isNullable: false })
    );
    await queryRunner.createForeignKey(
      'workflow_schedules',
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedTableName: 'apps',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_workflow_schedules_app_name
      ON workflow_schedules (app_id, LOWER(BTRIM(name)))
      WHERE name IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_workflow_schedules_app_name`);
    const table = await queryRunner.getTable('workflow_schedules');
    const appForeignKey = table.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('app_id'));
    if (appForeignKey) await queryRunner.dropForeignKey('workflow_schedules', appForeignKey);
    await queryRunner.dropColumns('workflow_schedules', ['app_id', 'name']);
  }
}
