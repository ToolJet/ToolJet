import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterTypeColumnOfDataSourceTable1710321318372 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'data_sources',
      'type',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enumName: 'type',
        enum: ['static', 'default', 'sample'],
        default: `'default'`,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
