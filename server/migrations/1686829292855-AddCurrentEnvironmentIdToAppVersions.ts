import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_versions', 'current_environment_id');
  }
}
