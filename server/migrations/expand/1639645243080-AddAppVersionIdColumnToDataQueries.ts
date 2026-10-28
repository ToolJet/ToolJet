import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAppVersionIdColumnToDataQueries1639645243080 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_queries',
      new TableColumn({
        name: 'app_version_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'data_queries',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_queries', 'app_version_id');
  }
}
