import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateExtensions1651056032052 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'extensions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'operations_file_id',
            type: 'uuid',
          },
          {
            name: 'icon_file_id',
            type: 'uuid',
          },
          {
            name: 'manifest_file_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            referencedTableName: 'files',
            referencedColumnNames: ['id'],
            columnNames: ['operations_file_id'],
          },
          {
            referencedTableName: 'files',
            referencedColumnNames: ['id'],
            columnNames: ['icon_file_id'],
          },
          {
            referencedTableName: 'files',
            referencedColumnNames: ['id'],
            columnNames: ['manifest_file_id'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
