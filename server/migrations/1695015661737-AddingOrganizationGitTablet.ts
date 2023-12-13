import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddingWorkspaceGiTablet1695015661737 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_git_sync',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },

          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'git_url',
            type: 'varchar',
            // length: 500,
            isNullable: false,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'is_finalized',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'ssh_private_key',
            type: 'varchar',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'ssh_public_key',
            type: 'varchar',
            isNullable: true,
            isUnique: true,
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
      'organization_git_sync',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'app_git_sync',
      new TableForeignKey({
        columnNames: ['organization_git_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organization_git_sync',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
