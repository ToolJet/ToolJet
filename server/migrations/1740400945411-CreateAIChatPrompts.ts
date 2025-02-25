import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAIChatPrompts1740400945411 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ai_chat_prompts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'prompt',
            type: 'varchar',
            length: '65535',
          },
          {
            name: 'response',
            type: 'varchar',
            length: '65535',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['openai', 'claude', 'docs', 'copilot'],
          },
          {
            name: 'operation_id',
            type: 'varchar',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'selfhost_customer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'credits_used',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ai_chat_prompts');
  }
}
