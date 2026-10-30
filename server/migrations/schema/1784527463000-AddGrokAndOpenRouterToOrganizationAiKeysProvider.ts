import { MigrationInterface, QueryRunner, TableCheck } from 'typeorm';

export class AddGrokAndOpenRouterToOrganizationAiKeysProvider1784527463000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint('organization_ai_keys', 'chk_organization_ai_keys_provider');
    await queryRunner.createCheckConstraint(
      'organization_ai_keys',
      new TableCheck({
        name: 'chk_organization_ai_keys_provider',
        columnNames: ['provider'],
        expression: `provider IN ('anthropic', 'gemini', 'grok', 'openrouter', 'tooljet_managed')`,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint('organization_ai_keys', 'chk_organization_ai_keys_provider');
    await queryRunner.createCheckConstraint(
      'organization_ai_keys',
      new TableCheck({
        name: 'chk_organization_ai_keys_provider',
        columnNames: ['provider'],
        expression: `provider IN ('anthropic', 'gemini', 'tooljet_managed')`,
      })
    );
  }
}
