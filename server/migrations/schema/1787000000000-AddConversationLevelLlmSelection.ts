import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddConversationLevelLlmSelection1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Moves the provider/model choice from "one per membership" to "one per chat".
    //
    // organization_users keeps its llm_* columns unchanged — their meaning narrows from
    // "the setting" to "the default stamped onto the next new chat", which is what makes the
    // most recent pick carry over to new conversations without dragging existing ones with it.
    //
    // No CHECK on either value, for the same reason as AddUserLevelLlmPreference and
    // AddUserLevelLlmModel: the allowed sets are MANAGED_SELECTABLE_PROVIDERS and
    // PROVIDER_MODEL_CATALOG in ee/ai/util.service.ts, enforced on write and again on read,
    // so pinning them here would turn a catalogue edit into a migration.
    await queryRunner.addColumns('ai_conversations', [
      new TableColumn({ name: 'llm_provider', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'llm_model', type: 'varchar', length: '200', isNullable: true }),
      new TableColumn({ name: 'llm_model_context_window', type: 'integer', isNullable: true }),
    ]);

    // Existing chats are pinned to whatever their owner is on right now, so the first time that
    // builder changes their default nothing they already had open moves underneath them. Only
    // touches users who actually set a preference; everyone else stays null and resolves to the
    // default, which is exactly the behaviour they have today.
    await queryRunner.query(`
      UPDATE ai_conversations c
      SET    llm_provider = ou.llm_provider,
             llm_model = ou.llm_model,
             llm_model_context_window = ou.llm_model_context_window
      FROM   apps a
      JOIN   organization_users ou ON ou.organization_id = a.organization_id
      WHERE  c.app_id = a.id
        AND  ou.user_id = c.user_id
        AND  ou.llm_provider IS NOT NULL
    `);

    // A switch now belongs to the chat it was made in, so the transcript divider is rendered
    // there and nowhere else. Nullable because rows written before this migration were genuinely
    // workspace-wide; the read path keeps rendering those in every conversation.
    await queryRunner.addColumn(
      'user_llm_provider_changes',
      new TableColumn({ name: 'conversation_id', type: 'uuid', isNullable: true })
    );

    await queryRunner.createForeignKey(
      'user_llm_provider_changes',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ai_conversations',
        onDelete: 'CASCADE',
      })
    );

    // The conversation read path looks up every change for one conversation since its creation,
    // so it filters on conversation_id and orders by created_at.
    await queryRunner.createIndex(
      'user_llm_provider_changes',
      new TableIndex({
        name: 'user_llm_provider_changes_conversation_id_created_at_idx',
        columnNames: ['conversation_id', 'created_at'],
      })
    );

    // The transcript explains model switches as well as provider ones, so the log records which
    // model a switch moved between: the provider pair alone cannot tell "Anthropic, Auto →
    // Anthropic, Claude Sonnet 5" from no change at all.
    //
    // Null is meaningful rather than unknown — it is "Auto", the provider running its own default
    // model — so a move to or from Auto is itself a change. Rows written before this migration
    // have null on both sides, which reads correctly: they were provider-only switches made when
    // a model could not be picked per chat.
    //
    // The table keeps its user_llm_provider_changes name: renaming it would churn the entity, both
    // indexes and every reference for no behavioural gain, and it is still a log of one builder's
    // LLM switches — just a more complete one.
    await queryRunner.addColumns('user_llm_provider_changes', [
      new TableColumn({ name: 'from_model', type: 'varchar', length: '200', isNullable: true }),
      new TableColumn({ name: 'to_model', type: 'varchar', length: '200', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('user_llm_provider_changes', ['from_model', 'to_model']);
    await queryRunner.dropIndex('user_llm_provider_changes', 'user_llm_provider_changes_conversation_id_created_at_idx');

    const table = await queryRunner.getTable('user_llm_provider_changes');
    const foreignKey = table?.foreignKeys.find((key) => key.columnNames.includes('conversation_id'));
    if (foreignKey) {
      await queryRunner.dropForeignKey('user_llm_provider_changes', foreignKey);
    }
    await queryRunner.dropColumn('user_llm_provider_changes', 'conversation_id');

    await queryRunner.dropColumns('ai_conversations', [
      'llm_model_context_window',
      'llm_model',
      'llm_provider',
    ]);
  }
}
