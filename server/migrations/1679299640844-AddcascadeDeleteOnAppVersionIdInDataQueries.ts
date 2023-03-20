import { dropForeignKey } from 'src/helpers/utils.helper';
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddcascadeDeleteOnAppVersionIdInDataQueries1679299640844 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropForeignKey('data_queries', 'app_version_id', queryRunner);
    await queryRunner.createForeignKey(
      'data_queries',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
