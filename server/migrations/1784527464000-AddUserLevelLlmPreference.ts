import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

// Managed-plan selectable providers. OpenRouter is absent deliberately — it is
// BYOK-only. Keep in lockstep with MANAGED_SELECTABLE_PROVIDERS in ee/ai/util.service.ts.
const USER_SELECTABLE_PROVIDERS = `'anthropic', 'grok', 'gemini'`;

export class AddUserLevelLlmPreference1784527464000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_ai_preferences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
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
        uniques: [
          {
            name: 'user_ai_preferences_user_id_organization_id_unique',
            columnNames: ['user_id', 'organization_id'],
          },
        ],
        checks: [
          {
            name: 'chk_user_ai_preferences_provider',
            expression: `provider IN (${USER_SELECTABLE_PROVIDERS})`,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('user_ai_preferences', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'user_llm_provider_changes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'from_provider',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'to_provider',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKeys('user_llm_provider_changes', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    ]);

    // The conversation read path looks up every change for a user since a given
    // message timestamp, so it always filters on user_id and orders by created_at.
    await queryRunner.createIndex(
      'user_llm_provider_changes',
      new TableIndex({
        name: 'user_llm_provider_changes_user_id_created_at_idx',
        columnNames: ['user_id', 'created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_llm_provider_changes');
    await queryRunner.dropTable('user_ai_preferences');
  }
}
