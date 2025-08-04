import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTableGithubHTTPS1742215405123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_git_https',
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
            name: 'https_url',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'github_branch',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'github_app_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'github_installation_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'github_enterprise_url',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'github_enterprise_api_url',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'github_private_key',
            type: 'text',
            isNullable: false,
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
      'organization_git_https',
      new TableForeignKey({
        columnNames: ['config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_git_sync',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_git_https');
  }
}
