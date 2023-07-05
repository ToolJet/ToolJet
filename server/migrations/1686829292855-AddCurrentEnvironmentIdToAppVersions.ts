import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCurrentEnvironmentIdToAppVersions1686829292855 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'current_environment_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'app_versions',
      new TableForeignKey({
        columnNames: ['current_environment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_environments',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_versions', 'current_environment_id');
  }
}
