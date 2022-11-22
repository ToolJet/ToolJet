import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeAppRelatedColumnsFromDataSource1668892081720 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.dropColumn('data_sources', 'options');
    await this.dropForeignKey('data_sources', 'app_id', queryRunner);
    await this.dropForeignKey('data_queries', 'app_id', queryRunner);
    await this.dropForeignKey('data_queries', 'app_version_id', queryRunner);

    await queryRunner.dropColumn('data_sources', 'app_id');
    await queryRunner.dropColumn('data_queries', 'app_id');
    await queryRunner.dropColumn('data_queries', 'app_version_id');
    await queryRunner.dropColumn('apps', 'definition');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async dropForeignKey(tableName: string, columnName: string, queryRunner) {
    const table = await queryRunner.getTable(tableName);
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf(columnName) !== -1);
    await queryRunner.dropForeignKey(tableName, foreignKey);
  }
}
