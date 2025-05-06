import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTableGithubSSH1742209024000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_git_ssh',
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
            name: 'git_url',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'ssh_private_key',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'ssh_public_key',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'key_type',
            type: 'enum',
            enumName: 'ssh_key_type',
            enum: ['rsa', 'ed25519'],
            default: "'ed25519'",
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
      'organization_git_ssh',
      new TableForeignKey({
        columnNames: ['config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_git_sync',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_git_ssh');
  }
}
