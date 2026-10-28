import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIconFieldToPagesTable1716921638529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pages', 'icon');
  }
}
