import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTablesForToojetAiConversations1740399879253 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create `ai_conversations` table
    await queryRunner.createTable(
      new Table({
        name: 'ai_conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'app_id',
            type: 'uuid',
          },
          {
            name: 'conversation_type',
            type: 'enum',
            enum: ['generate', 'learn'],
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      })
    );
    await queryRunner.createForeignKey(
      'ai_conversations',
      new TableForeignKey({
        columnNames: ['app_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'apps',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'ai_conversations',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'ai_conversation_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'ai_conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'prompt_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'message_type',
            type: 'enum',
            enum: ['ai', 'user'],
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'references',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_latest',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      })
    );

    await queryRunner.createForeignKey(
      'ai_conversation_messages',
      new TableForeignKey({
        columnNames: ['ai_conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ai_conversations',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'ai_response_votes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'ai_conversation_message_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'vote_type',
            type: 'enum',
            enum: ['up', 'down'],
            isNullable: false,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      })
    );
    await queryRunner.createForeignKey(
      'ai_response_votes',
      new TableForeignKey({
        columnNames: ['ai_conversation_message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ai_conversation_messages',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'ai_response_votes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const responseVotesTable = await queryRunner.getTable('ai_response_votes');
    if (responseVotesTable) {
      for (const foreignKey of responseVotesTable.foreignKeys) {
        await queryRunner.dropForeignKey('ai_response_votes', foreignKey);
      }
    }
    await queryRunner.dropTable('ai_response_votes');

    const conversationMessagesTable = await queryRunner.getTable('ai_conversation_messages');
    if (conversationMessagesTable) {
      for (const foreignKey of conversationMessagesTable.foreignKeys) {
        await queryRunner.dropForeignKey('ai_conversation_messages', foreignKey);
      }
    }
    await queryRunner.dropTable('ai_conversation_messages');

    const conversationsTable = await queryRunner.getTable('ai_conversations');
    if (conversationsTable) {
      for (const foreignKey of conversationsTable.foreignKeys) {
        await queryRunner.dropForeignKey('ai_conversations', foreignKey);
      }
    }
    await queryRunner.dropTable('ai_conversations');

    await queryRunner.query(`DROP TYPE IF EXISTS "ai_conversation_messages_message_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_response_votes_vote_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_conversations_conversation_type_enum"`);
  }
}
