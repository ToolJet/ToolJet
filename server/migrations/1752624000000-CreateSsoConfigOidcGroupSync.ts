import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSsoConfigOidcGroupSync1752624000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sso_config_oidc_group_sync',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'sso_config_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'claim_name',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'group_mappings',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'is_group_sync_enabled',
            type: 'boolean',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ],
        foreignKeys: [
          {
            columnNames: ['sso_config_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'sso_configs',
            onDelete: 'CASCADE'
          }
        ]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sso_config_oidc_group_sync');
  }
}
