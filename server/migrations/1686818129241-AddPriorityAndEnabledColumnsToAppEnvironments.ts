import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPriorityAndEnabledColumnsToAppEnvironments1686818129241 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_environments',
      new TableColumn({
        name: 'priority',
        type: 'integer',
        isNullable: true,
        default: 1,
      })
    );

    await queryRunner.addColumn(
      'app_environments',
      new TableColumn({
        name: 'enabled',
        type: 'boolean',
        isNullable: false,
        default: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('app_environments', ['priority', 'enabled']);
  }
}
