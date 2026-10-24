import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFlexGrowAndMinWidthToLayouts1791600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('layouts', [
      new TableColumn({
        name: 'grow',
        type: 'double precision',
        isNullable: true,
      }),
      new TableColumn({
        name: 'min_width_px',
        type: 'double precision',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('layouts', 'min_width_px');
    await queryRunner.dropColumn('layouts', 'grow');
  }
}
