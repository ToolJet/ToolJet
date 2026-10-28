import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfigScopeInInstanceSettings1706113492448 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update all rows in a single operation
    await queryRunner.query(`
          UPDATE sso_configs
          SET config_scope = CASE
            WHEN organization_id IS NOT NULL THEN 'organization'::config_scope_enum
            ELSE 'instance'::config_scope_enum
          END
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
