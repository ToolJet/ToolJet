import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAppGitTable1693375209543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'app_git_sync',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'organization_git_id',
            type: 'uuid',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'version_id',
            type: 'uuid',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'app_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'git_app_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'git_version_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'git_app_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'git_version_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_commit_message',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_commit_user',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_commit_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_push_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_pull_date',
            type: 'timestamp',
            isNullable: true,
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
      }),
      true
    );

    await queryRunner.createForeignKey(
      'app_git_sync',
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'apps',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
