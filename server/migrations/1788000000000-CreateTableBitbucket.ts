import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTableBitbucket1788000000000 implements MigrationInterface {
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
      })
    );

    await queryRunner.createForeignKey(
      'organization_bitbucket',
      new TableForeignKey({
        columnNames: ['config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_git_sync',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_bitbucket', true);
  }
}
