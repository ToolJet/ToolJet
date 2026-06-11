import { MigrationInterface, QueryRunner, TableCheck, TableColumn } from 'typeorm';

export class AddProviderToOrganizationAiKeys1776500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organization_ai_keys',
      new TableColumn({
        name: 'provider',
        type: 'varchar',
        length: '50',
        isNullable: false,
        default: "'anthropic'",
      })
    );
    await queryRunner.createCheckConstraint(
      'organization_ai_keys',
      new TableCheck({
        name: 'chk_organization_ai_keys_provider',
        columnNames: ['provider'],
        expression: `provider IN ('anthropic', 'gemini', 'tooljet_managed')`,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint('organization_ai_keys', 'chk_organization_ai_keys_provider');
    await queryRunner.dropColumn('organization_ai_keys', 'provider');
  }
}
