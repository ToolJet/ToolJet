import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddScopeColumnToDataSources1675179628075 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_sources',
      new TableColumn({
        name: 'scope',
        type: 'enum',
        enumName: 'scope',
        enum: ['local', 'global'],
        default: `'local'`,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_sources', 'scope');
  }
}
