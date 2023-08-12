import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

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

    // Add foreign key to relate Component with Page
    await queryRunner.createForeignKey(
      'components',
      new TableForeignKey({
        columnNames: ['page_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pages',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('components');
  }
}
