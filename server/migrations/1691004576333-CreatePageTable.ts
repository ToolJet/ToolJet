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
            name: 'app_version_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'update_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'last_hashed_diff',
            type: 'varchar',
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
