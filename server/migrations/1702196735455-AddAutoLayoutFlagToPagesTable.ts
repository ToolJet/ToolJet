import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAutoLayoutFlagToPagesTable1702196735455 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new columns to the app_versions table
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'auto_compute_layout',
        type: 'boolean',
        isNullable: false,
        default: 'false',
      })
    );

    await queryRunner.changeColumn(
      'pages',
      'auto_compute_layout',
      new TableColumn({
        name: 'auto_compute_layout',
        type: 'boolean',
        isNullable: false,
        default: 'true',
      })
    );

    await queryRunner.addColumn(
      'layouts',
      new TableColumn({
        name: 'dimension_unit',
        type: 'varchar',
        isNullable: false,
        default: `'percent'`,
      })
    );

    await queryRunner.changeColumn(
      'layouts',
      'dimension_unit',
      new TableColumn({
        name: 'dimension_unit',
        type: 'varchar',
        isNullable: false,
        default: `'count'`,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pages', 'auto_compute_layout');
  }
}
