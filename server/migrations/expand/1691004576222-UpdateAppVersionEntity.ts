import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateAppVersionEntity1691006886222 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new columns to the app_versions table
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'global_settings',
        type: 'json',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'show_viewer_navigation',
        type: 'boolean',
        default: true,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'home_page_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the new columns from the app_versions table (if necessary)
    await queryRunner.dropColumn('app_versions', 'global_settings');
    await queryRunner.dropColumn('app_versions', 'show_viewer_navigation');
    await queryRunner.dropColumn('app_versions', 'home_page_id');
  }
}
