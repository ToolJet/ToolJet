import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPageGroupIndexColumntoPage1719246896935 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await Promise.all([
      queryRunner.addColumn(
        'pages',
        new TableColumn({
          name: 'page_group_index',
          type: 'int',
          isNullable: true,
        })
      ),
      queryRunner.addColumn(
        'pages',
        new TableColumn({
          name: 'page_group_id',
          type: 'varchar',
          isNullable: true,
        })
      ),
      queryRunner.addColumn(
        'pages',
        new TableColumn({
          name: 'is_page_group',
          type: 'boolean',
          default: false,
        })
      ),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await Promise.all([
      queryRunner.dropColumn('pages', 'page_group_index'),
      queryRunner.dropColumn('pages', 'page_group_id'),
      queryRunner.dropColumn('pages', 'is_page_group'),
    ]);
  }
}
