import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class BanListTables1782458527607 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
          new Table({
            name: 'user_ban_list',
            columns: [
              {
                name: 'id',
                type: 'uuid',
                isPrimary: true,
                default: 'gen_random_uuid()',
              },
              {
                name: 'email',
                type: 'varchar',
                isNullable: false,
                isUnique: true,
              },
              {
                name: 'info',
                type: 'jsonb',
                isNullable: true,
              },
              {
                name: 'created_at',
                type: 'timestamptz',
                default: 'now()',
              },
              {
                name: 'updated_at',
                type: 'timestamptz',
                default: 'now()',
              },
            ],
          }),
          true
        );
    
        await queryRunner.createIndex(
          'user_ban_list',
          new TableIndex({
            name: 'IDX_user_ban_list_email',
            columnNames: ['email'],
          })
        );
    
        await queryRunner.createTable(
          new Table({
            name: 'workspace_ban_list',
            columns: [
              {
                name: 'id',
                type: 'uuid',
                isPrimary: true,
                default: 'gen_random_uuid()',
              },
              {
                name: 'organization_id',
                type: 'uuid',
                isNullable: false,
                isUnique: true,
              },
              {
                name: 'info',
                type: 'jsonb',
                isNullable: true,
              },
              {
                name: 'created_at',
                type: 'timestamptz',
                default: 'now()',
              },
              {
                name: 'updated_at',
                type: 'timestamptz',
                default: 'now()',
              },
            ],
            foreignKeys: [
              {
                columnNames: ['organization_id'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
              },
            ],
          }),
          true
        );
    
        await queryRunner.createIndex(
          'workspace_ban_list',
          new TableIndex({
            name: 'IDX_workspace_ban_list_organization_id',
            columnNames: ['organization_id'],
          })
        );
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('workspace_ban_list', 'IDX_workspace_ban_list_organization_id');
        await queryRunner.dropTable('workspace_ban_list');
        await queryRunner.dropIndex('user_ban_list', 'IDX_user_ban_list_email');
        await queryRunner.dropTable('user_ban_list');
      }

}
