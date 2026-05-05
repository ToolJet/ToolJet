import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFlexOrderToLayoutsTable1775040800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'layouts',
      new TableColumn({
        name: 'flex_order',
        type: 'double precision',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('layouts', 'flex_order');
  }
}
