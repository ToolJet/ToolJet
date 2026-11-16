import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class addForeignKeyForCommentUsers1664535394458 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('comment_users');
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('comment_id') !== -1);
    await queryRunner.dropForeignKey('comment_users', foreignKey);

    await queryRunner.createForeignKey(
      'comment_users',
      new TableForeignKey({
        columnNames: ['comment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comments',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
