import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addDataSourceType1671815159504 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_sources',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enumName: 'type',
        enum: ['static', 'default'],
        default: `'default'`,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_sources', 'type');
  }
}
