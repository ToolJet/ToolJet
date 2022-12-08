import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class removePluginFromDataQuery1669055405494 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_queries', 'plugin_id');

    await queryRunner.changeColumn(
      'data_queries',
      new TableColumn({
        name: 'data_source_id',
        type: 'uuid',
      }),
      new TableColumn({
        name: 'data_source_id',
        type: 'uuid',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_sources',
      new TableColumn({
        name: 'plugin_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.changeColumn(
      'data_queries',
      new TableColumn({
        name: 'data_source_id',
        type: 'uuid',
        isNullable: false,
      }),
      new TableColumn({
        name: 'data_source_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }
}
