import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillSlackAppOption1747338135635 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE data_source_options
        SET "options" = ("options"::jsonb || '{"credential_source": {"value": "from_env", "encrypted": false}}'::jsonb)::json
        FROM data_sources ds
        WHERE ds.id = data_source_id and ds.kind = 'slack'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
