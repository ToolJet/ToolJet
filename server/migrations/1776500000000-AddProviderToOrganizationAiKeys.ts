import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organization_ai_keys', 'provider');
  }
}
