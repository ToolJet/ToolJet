import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConfigurationColumnToInternalTables1718529294184 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'internal_tables',
      new TableColumn({
        name: 'configurations',
        type: 'jsonb',
        isNullable: false, // Set to false to make it NOT NULL
        default: '\'{"columns": {"column_names":{}, "configurations":{}}}\'',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('internal_tables', 'configurations');
  }
}
