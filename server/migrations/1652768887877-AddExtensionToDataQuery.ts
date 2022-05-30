import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExtensionToDataQuery1652768887877 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_queries',
      new TableColumn({
        name: 'extension_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
