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

    // Update moduleVersionId.value from DB UUID → version name so GitSync can resolve it
    // portably across environments (version names are stable, UUIDs are not).
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(av.name::text)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.id::text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore moduleVersionId.value from version name → DB UUID
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(av.id::text)
      )::json
      FROM app_versions av
      INNER JOIN apps a ON a.id = av.app_id AND a.type = 'module'
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.name
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') = a.co_relation_id::text;
    `);

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
