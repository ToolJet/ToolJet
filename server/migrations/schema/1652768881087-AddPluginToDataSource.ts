import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPluginToDataSource1652768881087 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_sources',
      new TableColumn({
        name: 'plugin_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
