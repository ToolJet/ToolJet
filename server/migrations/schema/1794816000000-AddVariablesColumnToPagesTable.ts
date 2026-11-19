import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Page variables declared in the App Builder Variables panel: `{ [definitionId]: { id, name, value, fxActive } }`. */
export class AddVariablesColumnToPagesTable1794816000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pages',
      new TableColumn({
        name: 'variables',
        type: 'jsonb',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pages', 'variables');
  }
}
