import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateComponentTable1691006952074 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'components',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'page_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parent',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'properties',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'styles',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'validations',
            type: 'json',
            isNullable: true,
          },
        ],
      })
    );

    await queryRunner.createForeignKey(
      'components',
      new TableForeignKey({
        columnNames: ['page_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pages',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex('components', new TableIndex({ columnNames: ['name'] }));
    await queryRunner.createIndex('components', new TableIndex({ columnNames: ['type'] }));
    await queryRunner.createIndex('components', new TableIndex({ columnNames: ['page_id'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('components', 'IDX_COMPONENT_NAME');
    await queryRunner.dropIndex('components', 'IDX_COMPONENT_TYPE');
    await queryRunner.dropIndex('components', 'IDX_COMPONENT_PAGE');

    // Drop foreign key
    await queryRunner.dropForeignKey('components', 'FK_COMPONENT_PAGE');

    // Drop table
    await queryRunner.dropTable('components');
  }
}
