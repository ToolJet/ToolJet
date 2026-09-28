import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Model selection for providers that route to many models.
 *
 * Only OpenRouter uses these today — every other provider resolves its model from a
 * fixed per-tier table in the agent. The context window is stored alongside the slug
 * because it is model-specific and cannot be derived from the name, and the agent's
 * session panel needs it to render context usage.
 */
export class AddModelToOrganizationAiKeys1784527467000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organization_ai_keys', [
      new TableColumn({
        name: 'model',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
      new TableColumn({
        name: 'model_context_window',
        type: 'integer',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('organization_ai_keys', ['model', 'model_context_window']);
  }
}
