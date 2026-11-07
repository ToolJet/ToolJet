import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateQueryPermissions1747759439358 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'query_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'query_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['SINGLE', 'GROUP'],
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'query_permissions',
      new TableForeignKey({
        columnNames: ['query_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_queries',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('query_permissions');
  }
}
