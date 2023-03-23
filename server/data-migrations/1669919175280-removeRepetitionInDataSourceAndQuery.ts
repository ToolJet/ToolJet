import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class removeRepetitionInDataSourceAndQuery1669919175280 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKey('data_sources', 'app_id', queryRunner);
    await this.dropForeignKey('data_queries', 'app_id', queryRunner);
    await this.dropForeignKey('data_queries', 'app_version_id', queryRunner);

    await queryRunner.dropColumn('data_sources', 'app_id');
    await queryRunner.dropColumn('data_queries', 'app_id');
    await queryRunner.dropColumn('data_queries', 'app_version_id');
    await queryRunner.dropColumn('data_queries', 'kind');
    await queryRunner.dropColumn('apps', 'definition');

    await queryRunner.query('ALTER TABLE data_queries ALTER COLUMN data_source_id DROP NOT NULL;');
    await queryRunner.query('ALTER TABLE data_sources ALTER COLUMN app_version_id DROP NOT NULL;');

    //update data sources - add onDelete action to app_version_id
    await this.dropForeignKey('data_sources', 'app_version_id', queryRunner);
    await queryRunner.createForeignKey(
      'data_sources',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async dropForeignKey(tableName: string, columnName: string, queryRunner) {
    const table = await queryRunner.getTable(tableName);
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf(columnName) !== -1);
    await queryRunner.dropForeignKey(tableName, foreignKey);
  }
}
