import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateCoRelationIdForModules1776470400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Generate co_relation_id for module-type apps that don't have one yet
    await queryRunner.query(`
      UPDATE apps
      SET co_relation_id = gen_random_uuid()
      WHERE type = 'module'
        AND co_relation_id IS NULL;
    `);

    // Update ModuleViewer component properties: replace moduleAppId.value (raw DB id)
    // with the module app's co_relation_id so GitSync can resolve the reference
    // portably across environments.
    // components.properties is stored as json, so we cast to jsonb for manipulation then back to json.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleAppId,value}',
        to_jsonb(a.co_relation_id::text)
      )::json
      FROM apps a
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') = a.id::text
        AND a.type = 'module';
    `);

    // Add module_reference_id to app_versions: stable, portable per-row identity
    // that survives branching, merging, and cross-instance pulls.
    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS module_reference_id uuid;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_app_versions_module_ref_branch
        ON app_versions (module_reference_id, branch_id);
    `);

    // Backfill: every existing row gets a fresh UUID.
    await queryRunner.query(`
      UPDATE app_versions
      SET module_reference_id = gen_random_uuid()
      WHERE module_reference_id IS NULL;
    `);

    // Update moduleVersionId.value from DB UUID → module_reference_id so GitSync
    // can resolve the reference portably across environments. Components configured
    // by the user pin a specific app_version row by its DB id; we rewrite that to
    // the row's module_reference_id which is preserved across push/pull.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(av.module_reference_id::text)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.id::text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: rewrite moduleVersionId.value from module_reference_id → DB UUID.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(av.id::text)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.module_reference_id::text;
    `);

    // Drop the module_reference_id column + index.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_app_versions_module_ref_branch;`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS module_reference_id;`);

    // Restore ModuleViewer component properties to use the DB id instead of co_relation_id
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleAppId,value}',
        to_jsonb(a.id::text)
      )::json
      FROM apps a
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') = a.co_relation_id::text
        AND a.type = 'module';
    `);
  }
}
