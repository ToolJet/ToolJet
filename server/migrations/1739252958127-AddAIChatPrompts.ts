import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAIChatPrompts1739252958127 implements MigrationInterface {
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
            type: 'json',
            isNullable: true,
          },
          {
            name: 'response',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['openai', 'claude'],
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
