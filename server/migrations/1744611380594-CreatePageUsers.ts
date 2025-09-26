import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePageUsers1744611380594 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'page_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'page_permissions_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'permission_groups_id',
            type: 'uuid',
            isNullable: true,
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
      'page_users',
      new TableForeignKey({
        columnNames: ['page_permissions_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'page_permissions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'page_users',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'page_users',
      new TableForeignKey({
        columnNames: ['permission_groups_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permission_groups',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('page_users');
  }
}
