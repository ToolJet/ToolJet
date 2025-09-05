import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAppHistoryTable1756984957000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'app_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'app_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'app_version_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sequence_number',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'history_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'action_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'operation_scope',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'change_payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        checks: [
          {
            expression: "history_type IN ('snapshot', 'delta')",
          },
          {
            expression: `
              (history_type = 'snapshot' AND jsonb_typeof(change_payload) = 'object') OR
              (history_type = 'delta' AND jsonb_typeof(change_payload) = 'array')
            `,
          },
        ],
      }),
      true
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'app_history',
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'apps',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'app_history',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'app_history',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );

    await queryRunner.createForeignKey(
      'app_history',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_history',
      })
    );

    // Create unique constraint
    await queryRunner.createIndex(
      'app_history',
      new TableIndex({
        name: 'IDX_UNIQUE_SEQ_PER_APP_VERSION',
        columnNames: ['app_version_id', 'sequence_number'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const table = await queryRunner.getTable('app_history');
    
    const appIdForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('app_id') !== -1);
    if (appIdForeignKey) {
      await queryRunner.dropForeignKey('app_history', appIdForeignKey);
    }

    const appVersionIdForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('app_version_id') !== -1);
    if (appVersionIdForeignKey) {
      await queryRunner.dropForeignKey('app_history', appVersionIdForeignKey);
    }

    const userIdForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('user_id') !== -1);
    if (userIdForeignKey) {
      await queryRunner.dropForeignKey('app_history', userIdForeignKey);
    }

    const parentIdForeignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('parent_id') !== -1);
    if (parentIdForeignKey) {
      await queryRunner.dropForeignKey('app_history', parentIdForeignKey);
    }

    // Drop index
    await queryRunner.dropIndex('app_history', 'IDX_UNIQUE_SEQ_PER_APP_VERSION');
    
    // Drop table
    await queryRunner.dropTable('app_history');
  }
}