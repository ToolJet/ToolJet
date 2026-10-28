import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackFillDatabricksOauth1779187191605 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // All existing Databricks datasources used Personal Access Token
    // authentication (the only option before OAuth U2M was introduced).
    // Backfill authentication_type so the plugin's dropdown-component-flip
    // routes to the correct credential fields without fallback logic.
    await queryRunner.query(`
      UPDATE data_source_version_options dsvo
      SET "options" = (
        dsvo."options"::jsonb || '{"authentication_type": {"value": "personal_access_token", "encrypted": false}}'::jsonb
      )::json
      FROM data_source_versions dsv
      JOIN data_sources ds ON ds.id = dsv.data_source_id
      WHERE dsvo.data_source_version_id = dsv.id
        AND ds.kind = 'databricks'
        AND NOT (dsvo."options"::jsonb ? 'authentication_type')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE data_source_version_options dsvo
      SET "options" = (dsvo."options"::jsonb - 'authentication_type')::json
      FROM data_source_versions dsv
      JOIN data_sources ds ON ds.id = dsv.data_source_id
      WHERE dsvo.data_source_version_id = dsv.id
        AND ds.kind = 'databricks'
    `);
  }
}
