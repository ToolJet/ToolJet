import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMicrosoftGraphDatasourceScopeToHaveOfflineAccessForRefreshToken1760693571486
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE data_source_options
        SET "options" = ("options"::jsonb || '{"scopes": {"value": "https://graph.microsoft.com/.default offline_access", "encrypted": false}}'::jsonb)::json
        FROM data_sources ds
        WHERE ds.id = data_source_id and ds.kind = 'microsoft_graph'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
