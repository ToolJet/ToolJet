import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

// migration-lint: allow-destructive new table; its foreign key is on that new table

export class CreateTableBitbucket1795675998000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_bitbucket',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'config_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'bitbucket_workspace',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'bitbucket_repo_slug',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'bitbucket_branch',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'bitbucket_access_token',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'is_finalized',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['config_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'organization_git_sync',
            onDelete: 'CASCADE',
          }),
        ],
      }),
      // Skipped where an earlier run of this migration under its old name already made the table.
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_bitbucket', true);
  }
}
