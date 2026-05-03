import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackFillBigQueryType1773229178901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // All existing BigQuery datasources used service_account auth (the only
    // option before OAuth was introduced). Backfill the authentication_type
    // so the plugin can branch correctly without fallback.
    // Uncomment on next release
    // await queryRunner.query(`
    //   UPDATE data_source_options
    //   SET "options" = (
    //     "options"::jsonb || '{"authentication_type": {"value": "service_account", "encrypted": false}}'::jsonb
    //   )::json
    //   FROM data_sources ds
    //   WHERE ds.id = data_source_id
    //     AND ds.kind = 'bigquery'
    //     AND NOT ("options"::jsonb ? 'authentication_type')
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE data_source_options
      SET "options" = ("options"::jsonb - 'authentication_type')::json
      FROM data_sources ds
      WHERE ds.id = data_source_id
        AND ds.kind = 'bigquery'
    `);
  }
}
