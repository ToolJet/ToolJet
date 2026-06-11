import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPageIdToThreads1669280005881 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'threads',
      new TableColumn({
        name: 'page_id',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('threads', 'page_id');
  }
}
