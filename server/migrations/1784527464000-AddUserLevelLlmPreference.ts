import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddUserLevelLlmPreference1784527464000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Membership already is the user-and-workspace pair a preference is keyed on, with
    // a unique constraint and cascades on both sides, so the choice is a column on it
    // rather than a table that would duplicate all three.
    //
    // No CHECK on the value: the allowed set is MANAGED_SELECTABLE_PROVIDERS in
    // ee/ai/util.service.ts, enforced on write and again on read, and pinning it here
    // too would turn adding a provider into a migration.
    await queryRunner.addColumn(
      'organization_users',
      new TableColumn({
        name: 'llm_provider',
        type: 'varchar',
        length: '50',
        isNullable: true,
      })
    );

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
    await queryRunner.dropColumn('organization_users', 'llm_provider');
  }
}
