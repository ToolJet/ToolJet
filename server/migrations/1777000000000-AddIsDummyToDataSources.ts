import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsDummyToDataSources1777000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_sources',
      new TableColumn({
        name: 'is_dummy',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_sources', 'is_dummy');
  }
}
