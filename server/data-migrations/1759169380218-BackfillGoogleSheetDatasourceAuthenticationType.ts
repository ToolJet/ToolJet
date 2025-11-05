import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillGoogleSheetDatasourceAuthenticationType1759169380218 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE data_source_options
        SET "options" = ("options"::jsonb || '{"authentication_type": {"value": "oauth2", "encrypted": false}}'::jsonb)::json
        FROM data_sources ds
        WHERE ds.id = data_source_id and ds.kind = 'googlesheets'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
