import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { EDITIONS } from '@modules/app/constants';
import { getEnvVars } from '../scripts/database-config-utils';

export class CreateDatasourceGroupPermission1680152466161 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    if (!envData.EDITION || envData.EDITION === EDITIONS.CE) {
      return;
    }
    await queryRunner.createTable(
      new Table({
        name: 'data_source_group_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'data_source_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'group_permission_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'update',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'delete',
            type: 'boolean',
            default: false,
            isNullable: false,
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
      }),
      true
    );

    await queryRunner.createForeignKey(
      'data_source_group_permissions',
      new TableForeignKey({
        columnNames: ['data_source_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'data_sources',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'data_source_group_permissions',
      new TableForeignKey({
        columnNames: ['group_permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_permissions',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    if (!envData.EDITION || envData.EDITION === EDITIONS.CE) {
      return;
    }
    await queryRunner.dropTable('data_source_group_permissions');
  }
}
