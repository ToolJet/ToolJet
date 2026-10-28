import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPageSettingsColumnToAppVersionTable1716890766240 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'page_settings',
        type: 'json',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_versions', 'page_settings');
  }
}
