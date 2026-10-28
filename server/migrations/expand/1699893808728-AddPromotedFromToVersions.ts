import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddPromotedFromToVersions1699893808728 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'promoted_from',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'app_versions',
      new TableForeignKey({
        columnNames: ['promoted_from'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_environments',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_versions', 'promoted_from');
  }
}
