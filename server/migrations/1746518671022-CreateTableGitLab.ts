import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTableGitLab1746518671022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_gitlab',
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
            name: 'gitlab_url',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'gitlab_branch',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'gitlab_project_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'gitlab_project_access_token',
            type: 'text',
            isNullable: true,
            default: null,
          },
          {
            name: 'gitlab_enterprise_url',
            type: 'varchar',
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
      'organization_gitlab',
      new TableForeignKey({
        columnNames: ['config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_git_sync',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
