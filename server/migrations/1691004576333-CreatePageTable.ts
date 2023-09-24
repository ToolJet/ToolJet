import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePageTable1691004576333 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pages',
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
            name: 'index',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'page_handle',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'disabled',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'hidden',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'app_version_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
      })
    );

    // Add foreign key to relate Page with AppVersion
    await queryRunner.createForeignKey(
      'pages',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pages');
  }
}
