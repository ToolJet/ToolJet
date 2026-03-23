import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPageFooterColumnToPagesTable1767700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'page_footer',
        type: 'jsonb',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pages', 'page_footer');
  }
}
