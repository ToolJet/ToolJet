import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFlexOrderToLayoutsTable1775040800001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('layouts', [
      new TableColumn({
        name: 'flex_order',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'width_px',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fill_width',
        type: 'boolean',
        isNullable: true,
      }),
      new TableColumn({
        name: 'height_px',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fill_height',
        type: 'boolean',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('layouts', 'fill_height');
    await queryRunner.dropColumn('layouts', 'height_px');
    await queryRunner.dropColumn('layouts', 'fill_width');
    await queryRunner.dropColumn('layouts', 'width_px');
    await queryRunner.dropColumn('layouts', 'flex_order');
  }
}
