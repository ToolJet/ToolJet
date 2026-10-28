import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddWorkflowScheduleTable1730434774100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workflow_schedules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'workflow_id',
            type: 'uuid',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'active',
            type: 'boolean',
            isNullable: false,
            isUnique: false,
            default: 'false',
          },
          {
            name: 'environment_id',
            type: 'uuid',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
            isUnique: false,
            default: "'interval'",
          },
          {
            name: 'timezone',
            type: 'varchar',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'details',
            type: 'jsonb',
            isNullable: true,
            default: "'{}'::jsonb",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'workflow_schedules',
      new TableForeignKey({
        columnNames: ['workflow_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'workflow_schedules',
      new TableForeignKey({
        columnNames: ['environment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_environments',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('workflow_schedules');
    table.foreignKeys.forEach(async (foreignKey) => {
      await queryRunner.dropForeignKey('workflow_schedules', foreignKey);
    });
    await queryRunner.dropTable('workflow_schedules');
  }
}
