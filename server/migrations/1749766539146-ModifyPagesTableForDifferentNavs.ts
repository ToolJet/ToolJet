import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ModifyPagesTableForDifferentNavs1749766539146 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'url',
        type: 'varchar',
        isNullable: true,
      })
    );

    if (queryRunner.connection.driver.options.type === 'postgres') {
      await queryRunner.query(`
            CREATE TYPE "page_open_in_enum" AS ENUM ('new_tab', 'same_tab')
          `);
    }
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'open_in',
        type: queryRunner.connection.driver.options.type === 'postgres' ? 'page_open_in_enum' : 'varchar',
        default: `'new_tab'`,
        isNullable: false,
      })
    );

    if (queryRunner.connection.driver.options.type === 'postgres') {
      await queryRunner.query(`
            CREATE TYPE "page_type_enum" AS ENUM ('default', 'group', 'url', 'app')
          `);
    }
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'type',
        type: queryRunner.connection.driver.options.type === 'postgres' ? 'page_type_enum' : 'varchar',
        default: `'default'`,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'app_id',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
