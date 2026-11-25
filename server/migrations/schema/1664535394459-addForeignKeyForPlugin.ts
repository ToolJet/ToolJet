import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class addForeignKeyForPlugin1664535394459 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'data_sources',
      new TableForeignKey({
        columnNames: ['plugin_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'plugins',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'data_queries',
      new TableForeignKey({
        columnNames: ['plugin_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'plugins',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
