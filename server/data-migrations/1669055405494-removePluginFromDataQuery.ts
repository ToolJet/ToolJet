import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class removePluginFromDataQuery1669055405494 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_queries', 'plugin_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_queries',
      new TableColumn({
        name: 'plugin_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }
}
